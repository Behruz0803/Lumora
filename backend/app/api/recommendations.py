"""Deterministic recommendation engine endpoint."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import response_language
from app.database.session import get_db
from app.models import Product
from app.schemas import CompareRequest, CompareResponse, ProductBrief
from app.services.catalog import offer_input, offers_for_product
from app.services.dataset import data_source_for, disclaimer_for
from app.core.i18n import t
from app.services.pricing import build_comparison

router = APIRouter(prefix="/recommendations", tags=["Recommendations"])


@router.post(
    "/compare",
    response_model=CompareResponse,
    summary="Compare all supplier offers for a product at a given quantity",
)
def compare(
    payload: CompareRequest,
    db: Session = Depends(get_db),
    language: str = Depends(response_language),
) -> CompareResponse:
    product = db.get(Product, payload.product_id)
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    offers = offers_for_product(db, product.id)
    if not offers:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=t(language, "No supplier offers exist for this product yet."),
        )

    result = build_comparison(
        ProductBrief.model_validate(product),
        [offer_input(o) for o in offers],
        float(payload.quantity),
        language,
    )
    source = data_source_for(offers)
    result.data_source = source
    result.disclaimer = disclaimer_for(language, source)
    return result
