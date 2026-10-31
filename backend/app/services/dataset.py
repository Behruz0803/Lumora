"""Dataset transparency helpers.

PriceRadar ships with a fictional demo dataset, but real supplier prices can be
imported on top of it. Every catalogue row carries ``is_demo``, so the API can
always tell the user *which* numbers are real market data and which are only a
demonstration.

Rules used here:

* ``demo``  - no real offer has been imported yet.
* ``mixed`` - real prices exist, but demo rows are still visible next to them.
* ``real``  - every price in the catalogue came from an import.
"""
from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.i18n import t
from app.models import Offer, Product, Supplier
from app.schemas import DatasetStatus

DISCLAIMERS = {
    "demo": (
        "Demo dataset: prices, suppliers and trends are fictional and for "
        "product demonstration only - not real market data."
    ),
    "mixed": (
        "Partially real data: imported supplier prices are real, but demo rows "
        "are still mixed in. Rows labelled as demo are fictional examples."
    ),
    "real": (
        "Prices, delivery costs and availability come from supplier price lists "
        "imported into PriceRadar. Confirm the final terms with the supplier "
        "before ordering."
    ),
}


def _counts(db: Session, model) -> tuple[int, int]:
    total = db.scalar(select(func.count()).select_from(model)) or 0
    real = db.scalar(select(func.count()).select_from(model).where(model.is_demo.is_(False))) or 0
    return total, real


def data_source_for(offers: list[Offer] | None = None) -> str:
    """Classify a set of offers: all demo, all real, or a mix."""
    if not offers:
        return "demo"
    demo = sum(1 for offer in offers if offer.is_demo)
    if demo == len(offers):
        return "demo"
    if demo == 0:
        return "real"
    return "mixed"


def disclaimer_for(language: str, data_source: str) -> str:
    return t(language, DISCLAIMERS.get(data_source, DISCLAIMERS["demo"]))


def dataset_status(db: Session, language: str = "en") -> DatasetStatus:
    products_total, products_real = _counts(db, Product)
    suppliers_total, suppliers_real = _counts(db, Supplier)
    offers_total, offers_real = _counts(db, Offer)

    if offers_real == 0:
        data_source = "demo"
    elif offers_real == offers_total:
        data_source = "real"
    else:
        data_source = "mixed"

    last_real = db.scalar(select(func.max(Offer.updated_at)).where(Offer.is_demo.is_(False)))

    return DatasetStatus(
        data_source=data_source,
        has_real_data=offers_real > 0,
        products_total=products_total,
        products_real=products_real,
        products_demo=products_total - products_real,
        suppliers_total=suppliers_total,
        suppliers_real=suppliers_real,
        suppliers_demo=suppliers_total - suppliers_real,
        offers_total=offers_total,
        offers_real=offers_real,
        offers_demo=offers_total - offers_real,
        real_data_updated_at=last_real,
        disclaimer=disclaimer_for(language, data_source),
    )


def data_source_for_product(db: Session, product_id: int) -> str:
    flags = list(db.scalars(select(Offer.is_demo).where(Offer.product_id == product_id)))
    if not flags:
        return "demo"
    if all(flags):
        return "demo"
    if any(flags):
        return "mixed"
    return "real"
