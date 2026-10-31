"""Rule-based assistant endpoint."""
from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.schemas import AssistantRequest, AssistantResponse
from app.services.assistant import answer

router = APIRouter(prefix="/assistant", tags=["AI Assistant"])


@router.post(
    "/chat",
    response_model=AssistantResponse,
    summary="Ask the rule-based purchasing assistant a question",
)
def chat(payload: AssistantRequest, db: Session = Depends(get_db)) -> AssistantResponse:
    return answer(db, payload.message, payload.product_id, payload.quantity)
