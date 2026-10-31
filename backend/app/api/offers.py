"""Offer endpoints."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from app.api.deps import Pagination, get_current_user
from app.database.session import get_db
from app.models import Offer, PriceHistory, Product, Supplier, User, utcnow
from app.schemas import OfferCreate, OfferOut, Page
from app.services.catalog import offer_to_out

router = APIRouter(prefix="/offers", tags=["Offers"])


@router.get("", response_model=Page[OfferOut], summary="List offers with filters and sorting")
def list_offers(
    db: Session = Depends(get_db),
    pagination: Pagination = Depends(),
    product_id: int | None = Query(None, gt=0),
    supplier_id: int | None = Query(None, gt=0),
    category: str | None = Query(None, max_length=80),
    offer_status: str | None = Query(None, alias="status", pattern="^(in_stock|low_stock|out_of_stock)$"),
    max_price: int | None = Query(None, gt=0),
    quantity: float | None = Query(None, gt=0, le=1_000_000),
    sort: str = Query("price", pattern="^(price|price_desc|total|updated|rating)$"),
) -> Page[OfferOut]:
    stmt = (
        select(Offer)
        .options(joinedload(Offer.product), joinedload(Offer.supplier))
        .join(Product, Offer.product_id == Product.id)
    )
    if product_id:
        stmt = stmt.where(Offer.product_id == product_id)
    if supplier_id:
        stmt = stmt.where(Offer.supplier_id == supplier_id)
    if category and category.lower() != "all":
        stmt = stmt.where(Product.category == category)
    if offer_status:
        stmt = stmt.where(Offer.status == offer_status)
    if max_price:
        stmt = stmt.where(Offer.unit_price <= max_price)

    offers = list(db.scalars(stmt))
    items = [offer_to_out(offer, quantity) for offer in offers]

    if sort == "price":
        items.sort(key=lambda o: (o.status == "out_of_stock", o.unit_price))
    elif sort == "price_desc":
        items.sort(key=lambda o: -o.unit_price)
    elif sort == "updated":
        items.sort(key=lambda o: -o.updated_at.timestamp())
    elif sort == "rating":
        items.sort(key=lambda o: (-(o.supplier.rating if o.supplier else 0), o.unit_price))
    elif sort == "total" and quantity:
        items.sort(key=lambda o: (o.eligible is False, o.total_cost or 0))

    total = len(items)
    page_items = items[pagination.offset : pagination.offset + pagination.page_size]
    return Page[OfferOut](
        items=page_items,
        total=total,
        page=pagination.page,
        page_size=pagination.page_size,
        pages=pagination.pages(total),
    )


@router.post("", response_model=OfferOut, status_code=status.HTTP_201_CREATED)
def create_offer(
    payload: OfferCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> OfferOut:
    if db.get(Product, payload.product_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    if db.get(Supplier, payload.supplier_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Supplier not found")
    existing = db.scalar(
        select(Offer).where(
            Offer.product_id == payload.product_id, Offer.supplier_id == payload.supplier_id
        )
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This supplier already has an offer for this product. Edit the existing offer instead.",
        )

    offer = Offer(**payload.model_dump(), is_demo=False, updated_at=utcnow())
    db.add(offer)
    try:
        db.flush()
        db.add(
            PriceHistory(
                product_id=offer.product_id,
                offer_id=offer.id,
                price=offer.unit_price,
                recorded_at=utcnow(),
            )
        )
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Offer already exists")
    db.refresh(offer)
    return offer_to_out(offer)


@router.get("/{offer_id}", response_model=OfferOut)
def get_offer(
    offer_id: int,
    db: Session = Depends(get_db),
    quantity: float | None = Query(None, gt=0, le=1_000_000),
) -> OfferOut:
    offer = db.scalar(
        select(Offer)
        .options(joinedload(Offer.product), joinedload(Offer.supplier))
        .where(Offer.id == offer_id)
    )
    if offer is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Offer not found")
    return offer_to_out(offer, quantity)
