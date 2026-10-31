"""PriceRadar FastAPI application."""
from __future__ import annotations

import logging
import math
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError

from app.api import (
    analytics,
    assistant,
    auth,
    imports,
    offers,
    products,
    recommendations,
    saved_offers,
    suppliers,
)
from app.core.config import settings
from app.database.init_db import init_database

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
logger = logging.getLogger("priceradar")


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_database()
    logger.info("PriceRadar API ready (database: %s)", settings.sqlalchemy_url.split("://")[0])
    yield


app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    description=(
        "B2B market intelligence and price comparison API for Uzbekistan.\n\n"
        "**All seeded prices, suppliers and trends are fictional demo data.** "
        "Total cost is always computed as `unit price x quantity + delivery cost`, "
        "and offers that cannot fulfil the requested quantity are never recommended."
    ),
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_origin_regex=settings.cors_origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _json_safe(value):
    """Coerce a value into something `json.dumps(..., allow_nan=False)` accepts.

    Starlette serialises responses with allow_nan=False, so the ``inf``/``nan``
    floats Pydantic echoes for out-of-range numbers would raise a ValueError and
    turn a 422 into a 500 (with a dropped connection).
    """
    if isinstance(value, float):
        return value if math.isfinite(value) else str(value)
    if isinstance(value, (str, int, bool)) or value is None:
        return value
    if isinstance(value, dict):
        return {str(key): _json_safe(item) for key, item in value.items()}
    if isinstance(value, (list, tuple, set)):
        return [_json_safe(item) for item in value]
    return str(value)


def _json_safe_errors(errors: list[dict]) -> list[dict]:
    """Make Pydantic error dicts JSON-serialisable.

    For custom validators Pydantic puts the raised exception in ``ctx``
    (e.g. ``{"error": ValueError("...")}``) and arbitrary values in ``input``.
    Passing those straight to JSONResponse raises a TypeError and FastAPI would
    return a 500 instead of a 422, so everything is coerced to JSON-safe values.
    """
    safe: list[dict] = []
    for error in errors:
        item: dict = {"type": str(error.get("type", "value_error"))}
        item["loc"] = [str(part) for part in error.get("loc", [])]
        item["msg"] = str(error.get("msg", "Invalid request"))
        if "input" in error:
            item["input"] = _json_safe(error["input"])
        ctx = error.get("ctx")
        if isinstance(ctx, dict):
            item["ctx"] = {str(key): _json_safe(ctx_value) for key, ctx_value in ctx.items()}
        safe.append(item)
    return safe


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    """Return a readable message alongside the detailed field errors."""
    errors = _json_safe_errors(list(exc.errors()))
    first = errors[0] if errors else {}
    field = ".".join(p for p in first.get("loc", []) if p not in ("body", "query", "path"))
    message = first.get("msg", "Invalid request")
    # Pydantic prefixes custom validator messages with "Value error, "
    detail = message.removeprefix("Value error, ").strip()
    detail = f"{field}: {detail}" if field else detail
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": detail, "errors": errors},
    )


@app.exception_handler(SQLAlchemyError)
async def database_exception_handler(request: Request, exc: SQLAlchemyError) -> JSONResponse:
    logger.exception("Database error on %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "A database error occurred. Please try again."},
    )


@app.get("/api/health", tags=["System"], summary="Health check")
def health() -> dict:
    return {"status": "ok", "service": settings.app_name, "version": app.version}


for api_router in (
    auth.router,
    products.router,
    suppliers.router,
    offers.router,
    analytics.router,
    saved_offers.router,
    recommendations.router,
    assistant.router,
    imports.router,
):
    app.include_router(api_router, prefix=settings.api_prefix)


@app.get("/", include_in_schema=False)
def root() -> dict:
    return {
        "name": settings.app_name,
        "docs": "/docs",
        "health": f"{settings.api_prefix}/health",
        "disclaimer": "All PriceRadar data is fictional demo data.",
    }
