"""Product catalog endpoints."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps import Pagination
from app.database.session import get_db
from app.models import Product
from app.schemas import CategoryOut, OfferOut, Page, PriceHistoryOut, ProductOut
from app.services.analytics import category_breakdown, price_history
from app.services.catalog import load_products_out, offer_to_out, offers_for_product

router = APIRouter(prefix="/products", tags=["Products"])

SORTS = {"name", "name_desc", "price_asc", "price_desc", "suppliers", "updated"}


@router.get("", response_model=Page[ProductOut], summary="List products with search, filters and sorting")
def list_products(
    db: Session = Depends(get_db),
    pagination: Pagination = Depends(),
    search: str | None = Query(None, max_length=100, description="Match name, category or description"),
    category: str | None = Query(None, max_length=80),
    availability: str | None = Query(None, pattern="^(in_stock|low_stock|out_of_stock)$"),
    sort: str = Query("name", description=f"One of: {', '.join(sorted(SORTS))}"),
) -> Page[ProductOut]:
    if sort not in SORTS:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid sort value. Use one of: {', '.join(sorted(SORTS))}",
        )

    stmt = select(Product)
    if search:
        term = f"%{search.strip().lower()}%"
        stmt = stmt.where(
            func.lower(Product.name).like(term)
            | func.lower(Product.category).like(term)
            | func.lower(func.coalesce(Product.description, "")).like(term)
        )
    if category and category.lower() != "all":
        stmt = stmt.where(func.lower(Product.category) == category.strip().lower())

    products = list(db.scalars(stmt))
    items = load_products_out(db, products)

    if availability in {"in_stock", "low_stock", "out_of_stock"}:
        items = [i for i in items if i.availability == availability]

    if sort == "name":
        items.sort(key=lambda p: p.name.lower())
    elif sort == "name_desc":
        items.sort(key=lambda p: p.name.lower(), reverse=True)
    elif sort == "price_asc":
        items.sort(key=lambda p: (p.avg_price is None, p.avg_price or 0))
    elif sort == "price_desc":
        items.sort(key=lambda p: (p.avg_price is None, -(p.avg_price or 0)))
    elif sort == "suppliers":
        items.sort(key=lambda p: (-p.available_supplier_count, p.name.lower()))
    elif sort == "updated":
        items.sort(key=lambda p: (p.updated_at is None, -(p.updated_at.timestamp() if p.updated_at else 0)))

    total = len(items)
    page_items = items[pagination.offset : pagination.offset + pagination.page_size]
    return Page[ProductOut](
        items=page_items,
        total=total,
        page=pagination.page,
        page_size=pagination.page_size,
        pages=pagination.pages(total),
    )


@router.get("/categories", response_model=list[CategoryOut], summary="Categories with average prices")
def list_categories(db: Session = Depends(get_db)) -> list[CategoryOut]:
    return category_breakdown(db)


@router.get("/{product_id}", response_model=ProductOut)
def get_product(product_id: int, db: Session = Depends(get_db)) -> ProductOut:
    product = db.get(Product, product_id)
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    return load_products_out(db, [product])[0]


@router.get("/{product_id}/offers", response_model=list[OfferOut])
def get_product_offers(
    product_id: int,
    db: Session = Depends(get_db),
    quantity: float | None = Query(None, gt=0, le=1_000_000),
    sort: str = Query("price", pattern="^(price|total|quality|delivery)$"),
) -> list[OfferOut]:
    product = db.get(Product, product_id)
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    offers = offers_for_product(db, product_id)
    items = [offer_to_out(offer, quantity) for offer in offers]

    if sort == "total" and quantity:
        items.sort(key=lambda o: (o.eligible is False, o.total_cost or 0))
    elif sort == "quality":
        items.sort(key=lambda o: (-(o.supplier.rating if o.supplier else 0), o.unit_price))
    elif sort == "delivery":
        items.sort(key=lambda o: (o.supplier.delivery_days if o.supplier else 99, o.delivery_cost))
    else:
        items.sort(key=lambda o: (o.status == "out_of_stock", o.unit_price))
    return items


@router.get("/{product_id}/price-history", response_model=PriceHistoryOut)
def get_product_price_history(
    product_id: int,
    db: Session = Depends(get_db),
    days: int = Query(90, ge=7, le=365),
) -> PriceHistoryOut:
    return price_history(db, product_id, days)
