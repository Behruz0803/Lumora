"""Product catalog endpoints."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps import Pagination, get_current_user
from app.database.session import get_db
from app.models import Offer, Product
from app.schemas import (
    CategoryOut,
    Message,
    OfferOut,
    Page,
    PriceHistoryOut,
    ProductCreate,
    ProductOut,
    ProductUpdate,
)
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


@router.post(
    "",
    response_model=ProductOut,
    status_code=status.HTTP_201_CREATED,
    summary="Add a real product to the catalogue (not demo data)",
)
def create_product(
    payload: ProductCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
) -> ProductOut:
    existing = db.scalar(
        select(Product).where(func.lower(Product.name) == payload.name.strip().lower())
    )
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A product with this name already exists.",
        )
    product = Product(
        name=payload.name.strip(),
        category=payload.category.strip(),
        unit=payload.unit.strip(),
        description=payload.description,
        image_url=payload.image_url,
        is_demo=False,
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    return ProductOut.model_validate(product)


@router.patch(
    "/{product_id}",
    response_model=ProductOut,
    summary="Edit a product (marking it as real data)",
)
def update_product(
    product_id: int,
    payload: ProductUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
) -> ProductOut:
    product = db.get(Product, product_id)
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    data = payload.model_dump(exclude_unset=True, exclude_none=True)
    if "name" in data:
        clash = db.scalar(
            select(Product).where(
                func.lower(Product.name) == str(data["name"]).strip().lower(),
                Product.id != product.id,
            )
        )
        if clash is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Another product already uses this name.",
            )
    for field_name, value in data.items():
        setattr(product, field_name, value.strip() if isinstance(value, str) else value)
    if data:
        product.is_demo = False
    db.commit()
    db.refresh(product)
    return ProductOut.model_validate(product)


@router.delete(
    "/{product_id}",
    response_model=Message,
    summary="Delete a product and its offers (demo rows cannot be deleted)",
)
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
) -> Message:
    product = db.get(Product, product_id)
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    if product.is_demo:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Demo products cannot be deleted; add real products instead.",
        )
    if db.scalar(select(func.count()).select_from(Offer).where(Offer.product_id == product.id)):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Delete this product's offers first.",
        )
    db.delete(product)
    db.commit()
    return Message(detail="Product deleted.")
