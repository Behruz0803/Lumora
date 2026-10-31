"""PriceRadar FastAPI application."""
from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError

from app.api import analytics, assistant, auth, offers, products, recommendations, saved_offers, suppliers
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


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    """Return a readable message alongside the detailed field errors."""
    errors = exc.errors()
    first = errors[0] if errors else {}
    field = ".".join(str(p) for p in first.get("loc", []) if p not in ("body", "query", "path"))
    message = first.get("msg", "Invalid request")
    detail = f"{field}: {message}".lstrip(": ") if field else message
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
