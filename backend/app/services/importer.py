"""CSV price-list importer.

Real supplier prices arrive as a spreadsheet export (Excel/Sheets -> CSV). This
module validates every row, reports row-level errors, and only then writes the
rows that are valid, so one bad line never blocks a whole price list.

Expected columns (case-insensitive, several aliases per language):

    product, supplier, unit_price [, category, unit, phone, location,
    delivery_cost, minimum_order_quantity, available_quantity, status]

Importing a row:
* creates the product and supplier when they do not exist yet (marked real),
* inserts or updates the offer for that (product, supplier) pair,
* appends a price-history point so analytics works on real data,
* always sets ``is_demo = False`` - imported numbers are never labelled demo.
"""
from __future__ import annotations

import csv
import io
from dataclasses import dataclass, field
from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import Offer, PriceHistory, Product, Supplier
from app.schemas import ImportPreviewRow, ImportReport, ImportRowError
from app.services.dataset import dataset_status

OFFER_STATUSES = ("in_stock", "low_stock", "out_of_stock")

COLUMN_ALIASES: dict[str, set[str]] = {
    "product": {"product", "product_name", "mahsulot", "товар", "наименование"},
    "supplier": {"supplier", "supplier_name", "taminotchi", "ta’minotchi", "поставщик"},
    "unit_price": {"unit_price", "price", "narx", "birlik_narx", "цена"},
    "delivery_cost": {"delivery_cost", "delivery", "yetkazish", "доставка"},
    "minimum_order_quantity": {
        "minimum_order_quantity",
        "min_order",
        "moq",
        "minimal_partiya",
        "мин_заказ",
    },
    "available_quantity": {
        "available_quantity",
        "available",
        "stock",
        "mavjud",
        "наличие",
    },
    "status": {"status", "holat", "статус"},
    "category": {"category", "kategoriya", "категория"},
    "unit": {"unit", "birlik", "единица"},
    "phone": {"phone", "telefon", "телефон"},
    "location": {"location", "city", "shahar", "город"},
}

REQUIRED_COLUMNS = ("product", "supplier", "unit_price")

DEFAULT_CATEGORY = "Imported"
DEFAULT_UNIT = "kg"


@dataclass
class ParsedRow:
    row: int
    product: str
    supplier: str
    unit_price: int
    delivery_cost: int = 0
    minimum_order_quantity: float = 1.0
    available_quantity: float = 0.0
    status: str = "in_stock"
    category: str = DEFAULT_CATEGORY
    unit: str = DEFAULT_UNIT
    phone: str | None = None
    location: str | None = None


@dataclass
class ImportOutcome:
    report: ImportReport
    committed: bool = False
    warnings: list[str] = field(default_factory=list)


class ImportError_(Exception):
    """Raised for problems that make the whole file unusable."""


def _normalise_header(raw: str) -> str:
    return raw.strip().lstrip("\ufeff").lower().replace(" ", "_").replace("-", "_")


def _canonical_keys(headers: list[str]) -> dict[str, str]:
    """Map the file's header names onto canonical column names."""
    mapping: dict[str, str] = {}
    for header in headers:
        normalised = _normalise_header(header)
        for canonical, aliases in COLUMN_ALIASES.items():
            if normalised in aliases:
                mapping[header] = canonical
                break
    return mapping


def _parse_int(value: str, field_name: str, row: int, errors: list[ImportRowError]) -> int | None:
    cleaned = (
        (value or "")
        .strip()
        .replace("\u00a0", "")
        .replace(" ", "")
        .replace("UZS", "")
        .replace("uzs", "")
        .replace("'", "")
    )
    if not cleaned:
        errors.append(ImportRowError(row=row, field=field_name, message="Value is required"))
        return None
    try:
        number = float(cleaned.replace(",", "."))
    except ValueError:
        errors.append(
            ImportRowError(row=row, field=field_name, message=f"'{value}' is not a number")
        )
        return None
    if number < 0:
        errors.append(ImportRowError(row=row, field=field_name, message="Cannot be negative"))
        return None
    return int(round(number))


def _parse_float(value: str, field_name: str, row: int, errors: list[ImportRowError]) -> float | None:
    cleaned = (value or "").strip().replace("\u00a0", "").replace(" ", "")
    if not cleaned:
        return None
    try:
        number = float(cleaned.replace(",", "."))
    except ValueError:
        errors.append(
            ImportRowError(row=row, field=field_name, message=f"'{value}' is not a number")
        )
        return None
    if number < 0:
        errors.append(ImportRowError(row=row, field=field_name, message="Cannot be negative"))
        return None
    return number


def read_csv(raw: bytes) -> tuple[list[ParsedRow], list[ImportRowError], int]:
    """Parse and validate a CSV file. Returns (rows, errors, rows_received)."""
    try:
        text = raw.decode("utf-8-sig")
    except UnicodeDecodeError:
        try:
            text = raw.decode("cp1251")
        except UnicodeDecodeError:
            raise ImportError_("The file must be UTF-8 or Windows-1251 encoded CSV text.")

    sample = text[:4096]
    try:
        dialect = csv.Sniffer().sniff(sample, delimiters=",;\t")
    except csv.Error:
        dialect = csv.excel

    reader = csv.DictReader(io.StringIO(text), dialect=dialect)
    if not reader.fieldnames:
        raise ImportError_("The file is empty. Add a header row and at least one price.")

    mapping = _canonical_keys(list(reader.fieldnames))
    present = set(mapping.values())
    missing = [column for column in REQUIRED_COLUMNS if column not in present]
    if missing:
        raise ImportError_(
            "Missing required column(s): "
            + ", ".join(missing)
            + ". Required columns are: product, supplier, unit_price."
        )

    rows: list[ParsedRow] = []
    errors: list[ImportRowError] = []
    received = 0

    for index, raw_row in enumerate(reader, start=2):  # row 1 is the header
        values = {
            mapping[key]: (value or "").strip()
            for key, value in raw_row.items()
            if key in mapping and key is not None
        }
        if not any(values.values()):
            continue  # blank line
        received += 1
        line_errors: list[ImportRowError] = []

        product_name = values.get("product", "").strip()
        supplier_name = values.get("supplier", "").strip()
        if not product_name:
            line_errors.append(
                ImportRowError(row=index, field="product", message="Product name is required")
            )
        if not supplier_name:
            line_errors.append(
                ImportRowError(row=index, field="supplier", message="Supplier name is required")
            )

        unit_price = _parse_int(values.get("unit_price", ""), "unit_price", index, line_errors)
        if unit_price is not None and unit_price <= 0:
            line_errors.append(
                ImportRowError(row=index, field="unit_price", message="Must be greater than 0")
            )

        delivery_cost = _parse_int(values.get("delivery_cost", "0") or "0", "delivery_cost", index, line_errors)
        minimum_order = _parse_float(
            values.get("minimum_order_quantity", "") or "", "minimum_order_quantity", index, line_errors
        )
        available = _parse_float(
            values.get("available_quantity", "") or "", "available_quantity", index, line_errors
        )
        status_value = (values.get("status", "") or "in_stock").strip().lower() or "in_stock"
        if status_value not in OFFER_STATUSES:
            line_errors.append(
                ImportRowError(
                    row=index,
                    field="status",
                    message=f"status must be one of {', '.join(OFFER_STATUSES)}",
                )
            )
        if minimum_order is not None and minimum_order <= 0:
            line_errors.append(
                ImportRowError(
                    row=index, field="minimum_order_quantity", message="Must be greater than 0"
                )
            )

        if line_errors:
            errors.extend(line_errors)
            continue

        rows.append(
            ParsedRow(
                row=index,
                product=product_name,
                supplier=supplier_name,
                unit_price=int(unit_price or 0),
                delivery_cost=int(delivery_cost or 0),
                minimum_order_quantity=float(minimum_order or 1.0),
                available_quantity=float(available or 0.0),
                status=status_value,
                category=(values.get("category") or DEFAULT_CATEGORY).strip() or DEFAULT_CATEGORY,
                unit=(values.get("unit") or DEFAULT_UNIT).strip() or DEFAULT_UNIT,
                phone=(values.get("phone") or "").strip() or None,
                location=(values.get("location") or "").strip() or None,
            )
        )

    return rows, errors, received


def _get_or_create_product(db: Session, row: ParsedRow, report: ImportReport) -> Product:
    product = db.scalar(select(Product).where(func.lower(Product.name) == row.product.lower()))
    if product is not None:
        return product
    product = Product(
        name=row.product,
        category=row.category,
        unit=row.unit,
        description=None,
        image_url=None,
        is_demo=False,
    )
    db.add(product)
    db.flush()
    report.products_created += 1
    return product


def _get_or_create_supplier(
    db: Session, row: ParsedRow, report: ImportReport, warnings: list[str]
) -> Supplier | None:
    supplier = db.scalar(
        select(Supplier).where(func.lower(Supplier.name) == row.supplier.lower())
    )
    if supplier is not None:
        return supplier
    if not row.phone:
        warnings.append(
            f"Row {row.row}: supplier '{row.supplier}' is new - add a phone column to import "
            "their contact details."
        )
    if not row.location:
        warnings.append(
            f"Row {row.row}: supplier '{row.supplier}' is new - add a location column to import "
            "their city."
        )
    supplier = Supplier(
        name=row.supplier,
        phone=row.phone or "Not provided",
        location=row.location or "Not specified",
        description=None,
        categories=None,
        rating=4.0,
        delivery_days=1,
        is_verified=False,
        is_demo=False,
    )
    db.add(supplier)
    db.flush()
    report.suppliers_created += 1
    return supplier


def import_prices(
    db: Session,
    raw: bytes,
    dry_run: bool = False,
    language: str = "en",
    max_rows: int = 5000,
) -> ImportOutcome:
    rows, errors, received = read_csv(raw)
    if len(rows) > max_rows:
        raise ImportError_(f"A single import is limited to {max_rows} rows.")

    report = ImportReport(
        dry_run=dry_run,
        rows_received=received,
        rows_failed=len({error.row for error in errors}),
        rows_valid=len(rows),
        errors=errors[:200],
        preview=[
            ImportPreviewRow(
                row=row.row,
                product=row.product,
                supplier=row.supplier,
                unit_price=row.unit_price,
                delivery_cost=row.delivery_cost,
                minimum_order_quantity=row.minimum_order_quantity,
                available_quantity=row.available_quantity,
                status=row.status,
            )
            for row in rows[:25]
        ],
    )

    warnings: list[str] = []
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    try:
        for row in rows:
            product = _get_or_create_product(db, row, report)
            supplier = _get_or_create_supplier(db, row, report, warnings)
            if supplier is None:
                continue
            offer = db.scalar(
                select(Offer).where(
                    Offer.product_id == product.id, Offer.supplier_id == supplier.id
                )
            )
            if offer is None:
                offer = Offer(
                    product_id=product.id,
                    supplier_id=supplier.id,
                    unit_price=row.unit_price,
                    delivery_cost=row.delivery_cost,
                    minimum_order_quantity=row.minimum_order_quantity,
                    available_quantity=row.available_quantity,
                    status=row.status,
                    is_demo=False,
                    updated_at=now,
                )
                db.add(offer)
                db.flush()
                report.offers_created += 1
            else:
                offer.unit_price = row.unit_price
                offer.delivery_cost = row.delivery_cost
                offer.minimum_order_quantity = row.minimum_order_quantity
                offer.available_quantity = row.available_quantity
                offer.status = row.status
                offer.is_demo = False
                offer.updated_at = now
                db.flush()
                report.offers_updated += 1

            db.add(
                PriceHistory(
                    product_id=product.id,
                    offer_id=offer.id,
                    price=row.unit_price,
                    recorded_at=now,
                )
            )

        db.flush()
        if dry_run:
            db.rollback()
            report.dataset = dataset_status(db, language)
        else:
            db.commit()
            report.dataset = dataset_status(db, language)
    except Exception:
        db.rollback()
        raise

    return ImportOutcome(report=report, committed=not dry_run, warnings=warnings[:50])
