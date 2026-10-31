"""Saved offers endpoints (per-user, authenticated)."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from app.api.deps import get_current_user
from app.database.session import get_db
from app.models import Offer, SavedOffer, User
from app.schemas import SavedOfferCreate, SavedOfferOut
from app.services.catalog import offer_to_out

router = APIRouter(prefix="/saved-offers", tags=["Saved offers"])


def _to_out(saved: SavedOffer) -> SavedOfferOut:
    current_price = saved.offer.unit_price
    change = current_price - saved.price_at_save
    pct = round(change / saved.price_at_save * 100, 2) if saved.price_at_save else 0.0
    return SavedOfferOut(
        id=saved.id,
        offer_id=saved.offer_id,
        created_at=saved.created_at,
        price_at_save=saved.price_at_save,
        status_at_save=saved.status_at_save,
        price_change=change,
        price_change_pct=pct,
        status_changed=saved.status_at_save != saved.offer.status,
        offer=offer_to_out(saved.offer),
    )


@router.get("", response_model=list[SavedOfferOut], summary="List the current user's saved offers")
def list_saved_offers(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
) -> list[SavedOfferOut]:
    saved = list(
        db.scalars(
            select(SavedOffer)
            .options(
                joinedload(SavedOffer.offer).joinedload(Offer.product),
                joinedload(SavedOffer.offer).joinedload(Offer.supplier),
            )
            .where(SavedOffer.user_id == current_user.id)
            .order_by(SavedOffer.created_at.desc())
        )
    )
    return [_to_out(s) for s in saved]


@router.post("", response_model=SavedOfferOut, status_code=status.HTTP_201_CREATED)
def save_offer(
    payload: SavedOfferCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> SavedOfferOut:
    offer = db.scalar(
        select(Offer)
        .options(joinedload(Offer.product), joinedload(Offer.supplier))
        .where(Offer.id == payload.offer_id)
    )
    if offer is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Offer not found")
    existing = db.scalar(
        select(SavedOffer).where(
            SavedOffer.user_id == current_user.id, SavedOffer.offer_id == payload.offer_id
        )
    )
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Offer is already saved")
    saved = SavedOffer(
        user_id=current_user.id,
        offer_id=offer.id,
        price_at_save=offer.unit_price,
        status_at_save=offer.status,
    )
    db.add(saved)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Offer is already saved")
    db.refresh(saved)
    saved.offer = offer
    return _to_out(saved)


@router.delete("/{saved_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_saved_offer(
    saved_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Response:
    saved = db.get(SavedOffer, saved_id)
    if saved is None or saved.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Saved offer not found")
    db.delete(saved)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
