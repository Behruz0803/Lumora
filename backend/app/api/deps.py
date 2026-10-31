"""Shared FastAPI dependencies."""
from __future__ import annotations

from fastapi import Depends, HTTPException, Query, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.security import decode_access_token
from app.database.session import get_db
from app.models import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)


def get_current_user(
    token: str | None = Depends(oauth2_scheme), db: Session = Depends(get_db)
) -> User:
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials. Please sign in again.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        raise credentials_error
    subject = decode_access_token(token)
    if not subject:
        raise credentials_error
    try:
        user_id = int(subject)
    except ValueError:
        raise credentials_error
    user = db.get(User, user_id)
    if user is None:
        raise credentials_error
    return user


class Pagination:
    def __init__(
        self,
        page: int = Query(1, ge=1, le=10_000, description="1-based page number"),
        page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    ):
        self.page = page
        self.page_size = page_size
        self.offset = (page - 1) * page_size

    def pages(self, total: int) -> int:
        return max(1, -(-total // self.page_size)) if total else 0
