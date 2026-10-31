"""Analytics endpoints.

Every response states where its numbers come from (demo, mixed or real imported
data) so demo figures are never mistaken for real market research.
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps import response_language
from app.database.session import get_db
from app.models import Offer, Product, Supplier
from app.schemas import CategoryOut, OverviewOut, PriceChange, PriceHistoryOut, TrendPoint
from app.services import analytics as service
from app.services.dataset import data_source_for_product, dataset_status, disclaimer_for

router = APIRouter(prefix="/analytics", tags=["Analytics"])

DEMO_NOTE = (
    "Demo dataset: prices, suppliers and trends are fictional and for product "
    "demonstration only - not real market data."
)


class SupplierMix(BaseModel):
    total_suppliers: int
    verified_suppliers: int
    verified_pct: float
    avg_rating: float
    avg_delivery_days: float


class SupplyStats(BaseModel):
    total_offers: int
    in_stock_offers: int
    low_stock_offers: int
    out_of_stock_offers: int
    stock_health_pct: float
    total_available_volume: float


class DemandIndicator(BaseModel):
    category: str
    offer_count: int
    avg_price: int | None = None
    supply_status: str


class MarketOut(BaseModel):
    days: int
    trend: list[TrendPoint]
    categories: list[CategoryOut]
    price_changes: list[PriceChange]
    supply: SupplyStats
    suppliers: SupplierMix
    demand: list[DemandIndicator]
    data_source: str = "demo"
    disclaimer: str = DEMO_NOTE


@router.get("/overview", response_model=OverviewOut, summary="Dashboard overview figures")
def get_overview(
    db: Session = Depends(get_db),
    language: str = Depends(response_language),
) -> OverviewOut:
    result = service.overview(db)
    source = dataset_status(db, language).data_source
    result.data_source = source
    result.disclaimer = disclaimer_for(language, source)
    return result


@router.get("/price-history/{product_id}", response_model=PriceHistoryOut)
def get_price_history(
    product_id: int,
    db: Session = Depends(get_db),
    days: int = Query(90, ge=7, le=365),
    language: str = Depends(response_language),
) -> PriceHistoryOut:
    result = service.price_history(db, product_id, days)
    result.data_source = data_source_for_product(db, product_id)
    return result


@router.get("/categories", response_model=list[CategoryOut])
def get_categories(db: Session = Depends(get_db)) -> list[CategoryOut]:
    return service.category_breakdown(db)


@router.get("/market", response_model=MarketOut, summary="Supply, demand and trend indicators")
def get_market(
    db: Session = Depends(get_db),
    days: int = Query(30, ge=7, le=365),
    language: str = Depends(response_language),
) -> MarketOut:
    data_source = dataset_status(db, language).data_source
    total_offers = int(db.scalar(select(func.count(Offer.id))) or 0)
    in_stock = int(db.scalar(select(func.count(Offer.id)).where(Offer.status == "in_stock")) or 0)
    low_stock = int(db.scalar(select(func.count(Offer.id)).where(Offer.status == "low_stock")) or 0)
    out_stock = int(db.scalar(select(func.count(Offer.id)).where(Offer.status == "out_of_stock")) or 0)
    volume = float(db.scalar(select(func.sum(Offer.available_quantity))) or 0)

    total_suppliers = int(db.scalar(select(func.count(Supplier.id))) or 0)
    verified = int(db.scalar(select(func.count(Supplier.id)).where(Supplier.is_verified.is_(True))) or 0)
    avg_rating = float(db.scalar(select(func.avg(Supplier.rating))) or 0)
    avg_delivery = float(db.scalar(select(func.avg(Supplier.delivery_days))) or 0)

    categories = service.category_breakdown(db)
    status_rows = db.execute(
        select(Product.category, Offer.status).join(Product, Offer.product_id == Product.id)
    ).all()
    statuses_by_category: dict[str, list[str]] = {}
    for category_name, offer_status in status_rows:
        statuses_by_category.setdefault(category_name, []).append(offer_status)

    demand: list[DemandIndicator] = []
    for category in categories:
        statuses = statuses_by_category.get(category.category, [])
        healthy = sum(1 for s in statuses if s == "in_stock")
        ratio = healthy / len(statuses) if statuses else 0
        demand.append(
            DemandIndicator(
                category=category.category,
                offer_count=category.offer_count,
                avg_price=category.avg_price,
                supply_status="healthy" if ratio >= 0.7 else "tight" if ratio >= 0.4 else "constrained",
            )
        )

    return MarketOut(
        days=days,
        trend=service.market_trend(db, days=days),
        categories=categories,
        price_changes=service.recent_price_changes(db, days=max(days, 30), limit=10),
        supply=SupplyStats(
            total_offers=total_offers,
            in_stock_offers=in_stock,
            low_stock_offers=low_stock,
            out_of_stock_offers=out_stock,
            stock_health_pct=round(in_stock / total_offers * 100, 1) if total_offers else 0,
            total_available_volume=round(volume, 2),
        ),
        suppliers=SupplierMix(
            total_suppliers=total_suppliers,
            verified_suppliers=verified,
            verified_pct=round(verified / total_suppliers * 100, 1) if total_suppliers else 0,
            avg_rating=round(avg_rating, 2),
            avg_delivery_days=round(avg_delivery, 1),
        ),
        demand=sorted(demand, key=lambda d: -d.offer_count),
        data_source=data_source,
        disclaimer=disclaimer_for(language, data_source),
    )
