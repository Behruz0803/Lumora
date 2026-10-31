"""Market analytics aggregation (all figures derived from the demo dataset)."""
from __future__ import annotations

from collections import defaultdict
from datetime import timedelta

from fastapi import HTTPException, status
from sqlalchemy import distinct, func, select
from sqlalchemy.orm import Session, joinedload

from app.models import Offer, PriceHistory, Product, utcnow
from app.schemas import (
    CategoryOut,
    OverviewOut,
    PriceChange,
    PriceHistoryOut,
    PricePoint,
    SupplierSeries,
    TrendPoint,
)
from app.services.catalog import (
    load_products_out,
    offer_input,
    offer_to_out,
    offers_with_relations,
    reference_quantity,
)
from app.services.pricing import evaluate_offers


def _daily_average(rows: list[PriceHistory]) -> list[PricePoint]:
    buckets: dict[str, list[int]] = defaultdict(list)
    for row in rows:
        buckets[row.recorded_at.strftime("%Y-%m-%d")].append(row.price)
    return [
        PricePoint(date=day, price=round(sum(values) / len(values), 2))
        for day, values in sorted(buckets.items())
    ]


def price_history(db: Session, product_id: int, days: int = 90) -> PriceHistoryOut:
    product = db.get(Product, product_id)
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    cutoff = utcnow() - timedelta(days=days)
    rows = list(
        db.scalars(
            select(PriceHistory)
            .options(joinedload(PriceHistory.offer).joinedload(Offer.supplier))
            .where(PriceHistory.product_id == product_id, PriceHistory.recorded_at >= cutoff)
            .order_by(PriceHistory.recorded_at.asc())
        )
    )

    points = _daily_average(rows)
    per_offer: dict[int, list[PriceHistory]] = defaultdict(list)
    supplier_ids: dict[int, int] = {}
    names: dict[int, str] = {}
    for row in rows:
        if row.offer_id is None:
            continue
        per_offer[row.offer_id].append(row)
        if row.offer is not None:
            names[row.offer_id] = row.offer.supplier.name
            supplier_ids[row.offer_id] = row.offer.supplier_id

    series = [
        SupplierSeries(
            supplier_id=supplier_ids.get(offer_id, 0),
            supplier_name=names.get(offer_id, "Unknown supplier"),
            points=_daily_average(items),
        )
        for offer_id, items in sorted(per_offer.items(), key=lambda kv: names.get(kv[0], ""))
    ]

    prices = [p.price for p in points]
    change_pct = None
    if len(prices) >= 2 and prices[0]:
        change_pct = round((prices[-1] - prices[0]) / prices[0] * 100, 2)

    return PriceHistoryOut(
        product_id=product.id,
        product_name=product.name,
        unit=product.unit,
        days=days,
        points=points,
        supplier_series=series,
        min_price=min(prices) if prices else None,
        max_price=max(prices) if prices else None,
        avg_price=round(sum(prices) / len(prices), 2) if prices else None,
        change_pct=change_pct,
    )


def recent_price_changes(db: Session, days: int = 45, limit: int = 8) -> list[PriceChange]:
    cutoff = utcnow() - timedelta(days=days)
    rows = list(
        db.scalars(
            select(PriceHistory)
            .options(
                joinedload(PriceHistory.product),
                joinedload(PriceHistory.offer).joinedload(Offer.supplier),
            )
            .where(PriceHistory.recorded_at >= cutoff)
            .order_by(PriceHistory.recorded_at.asc(), PriceHistory.id.asc())
        )
    )
    grouped: dict[int, list[PriceHistory]] = defaultdict(list)
    for row in rows:
        if row.offer_id is not None:
            grouped[row.offer_id].append(row)

    changes: list[PriceChange] = []
    for items in grouped.values():
        if len(items) < 2:
            continue
        latest = items[-1]
        previous = next((r for r in reversed(items[:-1]) if r.price != latest.price), None)
        if previous is None or previous.price == 0:
            continue
        product = latest.product
        supplier = latest.offer.supplier if latest.offer else None
        changes.append(
            PriceChange(
                product_id=product.id,
                product_name=product.name,
                category=product.category,
                unit=product.unit,
                old_price=previous.price,
                new_price=latest.price,
                change_pct=round((latest.price - previous.price) / previous.price * 100, 2),
                supplier_name=supplier.name if supplier else "Unknown supplier",
                changed_at=latest.recorded_at,
            )
        )
    changes.sort(key=lambda c: c.changed_at, reverse=True)
    return changes[:limit]


def category_breakdown(db: Session) -> list[CategoryOut]:
    products = list(db.scalars(select(Product).order_by(Product.name)))
    product_out = load_products_out(db, products)
    buckets: dict[str, list] = defaultdict(list)
    for item in product_out:
        buckets[item.category].append(item)

    result: list[CategoryOut] = []
    for category, items in buckets.items():
        prices = [i.avg_price for i in items if i.avg_price]
        result.append(
            CategoryOut(
                category=category,
                product_count=len(items),
                avg_price=int(round(sum(prices) / len(prices))) if prices else None,
                offer_count=sum(i.offer_count for i in items),
            )
        )
    result.sort(key=lambda c: (-c.offer_count, c.category))
    return result


def market_trend(db: Session, days: int = 30) -> list[TrendPoint]:
    cutoff = utcnow() - timedelta(days=days)
    rows = list(db.scalars(select(PriceHistory).where(PriceHistory.recorded_at >= cutoff)))
    return [
        TrendPoint(date=p.date, avg_price=round(p.price, 2)) for p in _daily_average(rows)
    ]


def potential_savings(db: Session) -> tuple[int, float]:
    """Sum of per-product savings between the cheapest and the most expensive
    eligible supplier at a representative purchase quantity."""
    by_product: dict[int, list[Offer]] = defaultdict(list)
    for offer in offers_with_relations(db):
        by_product[offer.product_id].append(offer)

    savings = 0
    naive_total = 0
    for product_id, offers in by_product.items():
        product = offers[0].product
        quantity = reference_quantity(product)
        evaluated = [o for o in evaluate_offers([offer_input(o) for o in offers], quantity) if o.eligible]
        if len(evaluated) < 2:
            continue
        totals = [o.total_cost for o in evaluated]
        savings += max(totals) - min(totals)
        naive_total += max(totals)
    pct = round(savings / naive_total * 100, 1) if naive_total else 0.0
    return savings, pct


def overview(db: Session) -> OverviewOut:
    products = list(db.scalars(select(Product)))
    product_out = load_products_out(db, products)
    average_prices = [p.avg_price for p in product_out if p.avg_price]
    savings, savings_pct = potential_savings(db)

    active_suppliers = int(
        db.scalar(
            select(func.count(distinct(Offer.supplier_id))).where(Offer.status != "out_of_stock")
        )
        or 0
    )
    total_offers = int(db.scalar(select(func.count(Offer.id))) or 0)

    recent_offers = list(
        db.scalars(
            select(Offer)
            .options(joinedload(Offer.product), joinedload(Offer.supplier))
            .order_by(Offer.updated_at.desc())
            .limit(6)
        )
    )

    return OverviewOut(
        total_products=len(products),
        active_suppliers=active_suppliers,
        total_offers=total_offers,
        avg_market_price=int(round(sum(average_prices) / len(average_prices))) if average_prices else 0,
        potential_savings=savings,
        savings_pct=savings_pct,
        price_changes=recent_price_changes(db, limit=6),
        trend=market_trend(db, days=30),
        top_categories=category_breakdown(db)[:5],
        recent_offers=[offer_to_out(o) for o in recent_offers],
    )
