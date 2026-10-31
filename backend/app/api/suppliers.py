"""Supplier directory endpoints."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.api.deps import Pagination, get_current_user
from app.database.session import get_db
from app.models import Offer, Supplier
from app.schemas import (
    Message,
    OfferOut,
    Page,
    SupplierCreate,
    SupplierOut,
    SupplierUpdate,
)
from app.services.catalog import offer_to_out, supplier_categories, supplier_to_out

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


def _join_categories(values: list[str] | None) -> str | None:
    if not values:
        return None
    cleaned = [value.strip() for value in values if value and value.strip()]
    return ", ".join(cleaned) or None


@router.post(
    "",
    response_model=SupplierOut,
    status_code=status.HTTP_201_CREATED,
    summary="Add a real supplier (not demo data)",
)
def create_supplier(
    payload: SupplierCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
) -> SupplierOut:
    existing = db.scalar(
        select(Supplier).where(func.lower(Supplier.name) == payload.name.strip().lower())
    )
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A supplier with this name already exists.",
        )
    supplier = Supplier(
        name=payload.name.strip(),
        phone=payload.phone.strip(),
        location=payload.location.strip(),
        description=payload.description,
        categories=_join_categories(payload.categories),
        rating=payload.rating,
        delivery_days=payload.delivery_days,
        is_verified=payload.is_verified,
        is_demo=False,
    )
    db.add(supplier)
    db.commit()
    db.refresh(supplier)
    return SupplierOut(
        id=supplier.id,
        name=supplier.name,
        phone=supplier.phone,
        location=supplier.location,
        description=supplier.description,
        categories=supplier_categories(supplier),
        rating=supplier.rating,
        delivery_days=supplier.delivery_days,
        is_verified=supplier.is_verified,
        is_demo=supplier.is_demo,
        offer_count=0,
        product_count=0,
        created_at=supplier.created_at,
    )


@router.patch(
    "/{supplier_id}",
    response_model=SupplierOut,
    summary="Edit a supplier (marking it as real data)",
)
def update_supplier(
    supplier_id: int,
    payload: SupplierUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
) -> SupplierOut:
    supplier = db.get(Supplier, supplier_id)
    if supplier is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Supplier not found")

    data = payload.model_dump(exclude_unset=True, exclude_none=True)
    if "name" in data:
        clash = db.scalar(
            select(Supplier).where(
                func.lower(Supplier.name) == str(data["name"]).strip().lower(),
                Supplier.id != supplier.id,
            )
        )
        if clash is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Another supplier already uses this name.",
            )
    if "categories" in data:
        supplier.categories = _join_categories(data.pop("categories"))
    for field_name, value in data.items():
        setattr(supplier, field_name, value.strip() if isinstance(value, str) else value)
    supplier.is_demo = False
    db.commit()
    db.refresh(supplier)
    supplier = db.scalar(
        select(Supplier).options(selectinload(Supplier.offers)).where(Supplier.id == supplier.id)
    )
    return supplier_to_out(supplier)


@router.delete(
    "/{supplier_id}",
    response_model=Message,
    summary="Delete a supplier you added (demo suppliers are protected)",
)
def delete_supplier(
    supplier_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
) -> Message:
    supplier = db.get(Supplier, supplier_id)
    if supplier is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Supplier not found")
    if supplier.is_demo:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Demo suppliers cannot be deleted; add real suppliers instead.",
        )
    if db.scalar(select(func.count()).select_from(Offer).where(Offer.supplier_id == supplier.id)):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Delete this supplier's offers first.",
        )
    db.delete(supplier)
    db.commit()
    return Message(detail="Supplier deleted.")
