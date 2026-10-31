"""Shared read/serialisation helpers so product, supplier and analytics endpoints
never duplicate aggregation logic."""
from __future__ import annotations

from collections import defaultdict
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.models import Offer, Product
from app.schemas import OfferOut, ProductOut, SupplierOut
from app.services.pricing import OfferInput, calculate_total_cost


def product_price_stats(db: Session, product_ids: list[int]) -> dict[int, dict]:
    """Average / min / max / availability stats per product, in a single query."""
    stats: dict[int, dict] = defaultdict(
        lambda: {
            "prices": [],
            "available_prices": [],
            "offer_count": 0,
            "available_supplier_count": 0,
            "updated_at": None,
        }
    )
    if not product_ids:
        return stats
    rows = db.execute(
        select(
            Offer.product_id,
            Offer.unit_price,
            Offer.status,
            Offer.available_quantity,
            Offer.updated_at,
        ).where(Offer.product_id.in_(product_ids))
    ).all()
    for product_id, unit_price, status_value, available_quantity, updated_at in rows:
        entry = stats[product_id]
        entry["prices"].append(unit_price)
        entry["offer_count"] += 1
        if status_value != "out_of_stock" and available_quantity > 0:
            entry["available_prices"].append(unit_price)
            entry["available_supplier_count"] += 1
        if entry["updated_at"] is None or (updated_at and updated_at > entry["updated_at"]):
            entry["updated_at"] = updated_at
    return stats


def _availability(entry: dict) -> str:
    if entry["available_supplier_count"] == 0:
        return "out_of_stock"
    if entry["available_supplier_count"] <= 2:
        return "low_stock"
    return "in_stock"


def product_to_out(product: Product, stats: dict[int, dict]) -> ProductOut:
    entry = stats.get(product.id)
    if not entry or not entry["prices"]:
        return ProductOut.model_validate(product)
    reference_prices = entry["available_prices"] or entry["prices"]
    return ProductOut(
        id=product.id,
        name=product.name,
        category=product.category,
        unit=product.unit,
        image_url=product.image_url,
        description=product.description,
        is_demo=product.is_demo,
        avg_price=int(round(sum(reference_prices) / len(reference_prices))),
        min_price=min(entry["prices"]),
        max_price=max(entry["prices"]),
        offer_count=entry["offer_count"],
        available_supplier_count=entry["available_supplier_count"],
        availability=_availability(entry),
        updated_at=entry["updated_at"],
    )


def load_products_out(db: Session, products: list[Product]) -> list[ProductOut]:
    stats = product_price_stats(db, [p.id for p in products])
    return [product_to_out(p, stats) for p in products]


def supplier_categories(supplier) -> list[str]:
    if not supplier.categories:
        return []
    return [c.strip() for c in supplier.categories.split(",") if c.strip()]


def supplier_to_out(supplier) -> SupplierOut:
    product_ids = {offer.product_id for offer in supplier.offers}
    return SupplierOut(
        id=supplier.id,
        name=supplier.name,
        location=supplier.location,
        phone=supplier.phone,
        rating=supplier.rating,
        delivery_days=supplier.delivery_days,
        is_verified=supplier.is_verified,
        description=supplier.description,
        categories=supplier_categories(supplier),
        is_demo=supplier.is_demo,
        offer_count=len(supplier.offers),
        product_count=len(product_ids),
        created_at=supplier.created_at,
    )


def offer_to_out(offer: Offer, quantity: float | None = None) -> OfferOut:
    out = OfferOut.model_validate(offer)
    if quantity and quantity > 0:
        costs = calculate_total_cost(offer.unit_price, quantity, offer.delivery_cost)
        out.product_cost = costs["product_cost"]
        out.total_cost = costs["total_cost"]
        out.cost_per_unit = costs["cost_per_unit"]
        out.eligible = (
            offer.status != "out_of_stock"
            and quantity >= offer.minimum_order_quantity
            and quantity <= offer.available_quantity
        )
    return out


def offer_input(offer: Offer) -> OfferInput:
    return OfferInput(
        offer_id=offer.id,
        supplier_id=offer.supplier_id,
        supplier_name=offer.supplier.name,
        location=offer.supplier.location,
        phone=offer.supplier.phone,
        rating=offer.supplier.rating,
        delivery_days=offer.supplier.delivery_days,
        is_verified=offer.supplier.is_verified,
        unit_price=offer.unit_price,
        delivery_cost=offer.delivery_cost,
        minimum_order_quantity=offer.minimum_order_quantity,
        available_quantity=offer.available_quantity,
        status=offer.status,
        updated_at=offer.updated_at,
    )


def offers_for_product(db: Session, product_id: int) -> list[Offer]:
    return list(
        db.scalars(
            select(Offer)
            .options(joinedload(Offer.supplier), joinedload(Offer.product))
            .where(Offer.product_id == product_id)
            .order_by(Offer.unit_price.asc())
        )
    )


def offers_with_relations(db: Session) -> list[Offer]:
    return list(
        db.scalars(
            select(Offer).options(joinedload(Offer.supplier), joinedload(Offer.product))
        )
    )


def reference_quantity(product: Product) -> float:
    """A representative purchase quantity used for headline savings figures."""
    return 100.0 if product.unit in {"kg", "l"} else 10.0
