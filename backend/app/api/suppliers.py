"""Supplier directory endpoints."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.api.deps import Pagination
from app.database.session import get_db
from app.models import Offer, Supplier
from app.schemas import OfferOut, Page, SupplierOut
from app.services.catalog import offer_to_out, supplier_to_out

router = APIRouter(prefix="/suppliers", tags=["Suppliers"])

SORTS = {"name", "rating", "delivery", "offers"}


@router.get("", response_model=Page[SupplierOut], summary="Supplier directory with search and filters")
def list_suppliers(
    db: Session = Depends(get_db),
    pagination: Pagination = Depends(),
    search: str | None = Query(None, max_length=100),
    location: str | None = Query(None, max_length=120),
    verified: bool | None = Query(None),
    category: str | None = Query(None, max_length=80),
    sort: str = Query("rating", description=f"One of: {', '.join(sorted(SORTS))}"),
) -> Page[SupplierOut]:
    if sort not in SORTS:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid sort value. Use one of: {', '.join(sorted(SORTS))}",
        )

    stmt = select(Supplier).options(selectinload(Supplier.offers))
    if search:
        term = f"%{search.strip().lower()}%"
        stmt = stmt.where(
            func.lower(Supplier.name).like(term)
            | func.lower(Supplier.location).like(term)
            | func.lower(func.coalesce(Supplier.categories, "")).like(term)
        )
    if location and location.lower() != "all":
        stmt = stmt.where(func.lower(Supplier.location) == location.strip().lower())
    if verified is not None:
        stmt = stmt.where(Supplier.is_verified.is_(verified))
    if category and category.lower() != "all":
        stmt = stmt.where(func.lower(func.coalesce(Supplier.categories, "")).like(f"%{category.strip().lower()}%"))

    suppliers = list(db.scalars(stmt))
    items = [supplier_to_out(s) for s in suppliers]

    if sort == "name":
        items.sort(key=lambda s: s.name.lower())
    elif sort == "rating":
        items.sort(key=lambda s: (-s.rating, -s.offer_count, s.name.lower()))
    elif sort == "delivery":
        items.sort(key=lambda s: (s.delivery_days, -s.rating))
    elif sort == "offers":
        items.sort(key=lambda s: (-s.offer_count, s.name.lower()))

    total = len(items)
    page_items = items[pagination.offset : pagination.offset + pagination.page_size]
    return Page[SupplierOut](
        items=page_items,
        total=total,
        page=pagination.page,
        page_size=pagination.page_size,
        pages=pagination.pages(total),
    )


@router.get("/locations", response_model=list[str], summary="Distinct supplier locations")
def list_locations(db: Session = Depends(get_db)) -> list[str]:
    return [row for row in db.scalars(select(Supplier.location).distinct().order_by(Supplier.location))]


@router.get("/{supplier_id}", response_model=SupplierOut)
def get_supplier(supplier_id: int, db: Session = Depends(get_db)) -> SupplierOut:
    supplier = db.get(Supplier, supplier_id, options=[selectinload(Supplier.offers)])
    if supplier is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Supplier not found")
    return supplier_to_out(supplier)


@router.get("/{supplier_id}/offers", response_model=list[OfferOut])
def get_supplier_offers(supplier_id: int, db: Session = Depends(get_db)) -> list[OfferOut]:
    supplier = db.get(Supplier, supplier_id)
    if supplier is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Supplier not found")
    offers = list(
        db.scalars(
            select(Offer)
            .options(selectinload(Offer.product), selectinload(Offer.supplier))
            .where(Offer.supplier_id == supplier_id)
            .order_by(Offer.product_id)
        )
    )
    return [offer_to_out(o) for o in offers]
