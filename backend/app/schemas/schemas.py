"""Pydantic request/response schemas."""
from __future__ import annotations

from datetime import datetime
from typing import Generic, TypeVar

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

T = TypeVar("T")

OFFER_STATUSES = ("in_stock", "low_stock", "out_of_stock")


class Page(BaseModel, Generic[T]):
    items: list[T]
    total: int
    page: int
    page_size: int
    pages: int


class Message(BaseModel):
    detail: str


# --------------------------------------------------------------------------- auth
class UserRegister(BaseModel):
    full_name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    business_name: str | None = Field(default=None, max_length=160)

    @field_validator("full_name")
    @classmethod
    def strip_name(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Full name cannot be empty")
        return v


class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str
    email: EmailStr
    business_name: str | None = None
    phone: str | None = None
    language: str = "en"
    notify_price_drops: bool = True
    notify_new_offers: bool = False
    notify_weekly_digest: bool = True
    created_at: datetime


class UserUpdate(BaseModel):
    full_name: str | None = Field(default=None, min_length=2, max_length=120)
    business_name: str | None = Field(default=None, max_length=160)
    phone: str | None = Field(default=None, max_length=40)
    language: str | None = Field(default=None, pattern="^(en|ru|uz)$")
    notify_price_drops: bool | None = None
    notify_new_offers: bool | None = None
    notify_weekly_digest: bool | None = None


class PasswordChange(BaseModel):
    current_password: str = Field(min_length=1)
    new_password: str = Field(min_length=8, max_length=128)


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# ------------------------------------------------------------------------ products
class ProductBrief(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    category: str
    unit: str
    image_url: str | None = None


class ProductOut(ProductBrief):
    description: str | None = None
    is_demo: bool = True
    avg_price: int | None = None
    min_price: int | None = None
    max_price: int | None = None
    offer_count: int = 0
    available_supplier_count: int = 0
    availability: str = "out_of_stock"
    updated_at: datetime | None = None


class CategoryOut(BaseModel):
    category: str
    product_count: int
    avg_price: int | None = None
    offer_count: int = 0


# ----------------------------------------------------------------------- suppliers
class SupplierBrief(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    location: str
    phone: str
    rating: float
    delivery_days: int
    is_verified: bool


class SupplierOut(SupplierBrief):
    description: str | None = None
    categories: list[str] = []
    is_demo: bool = True
    offer_count: int = 0
    product_count: int = 0
    created_at: datetime


# -------------------------------------------------------------------------- offers
class OfferOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    product_id: int
    supplier_id: int
    unit_price: int
    delivery_cost: int
    minimum_order_quantity: float
    available_quantity: float
    status: str
    is_demo: bool = True
    updated_at: datetime
    product: ProductBrief | None = None
    supplier: SupplierBrief | None = None
    # Optional, only filled when a quantity is supplied by the client
    product_cost: int | None = None
    total_cost: int | None = None
    cost_per_unit: float | None = None
    eligible: bool | None = None


class OfferCreate(BaseModel):
    product_id: int = Field(gt=0)
    supplier_id: int = Field(gt=0)
    unit_price: int = Field(gt=0, le=1_000_000_000)
    delivery_cost: int = Field(ge=0, le=1_000_000_000)
    minimum_order_quantity: float = Field(gt=0, le=1_000_000)
    available_quantity: float = Field(ge=0, le=1_000_000)
    status: str = "in_stock"

    @field_validator("status")
    @classmethod
    def valid_status(cls, v: str) -> str:
        if v not in OFFER_STATUSES:
            raise ValueError(f"status must be one of {', '.join(OFFER_STATUSES)}")
        return v


# --------------------------------------------------------------- recommendations
class ScoredOffer(BaseModel):
    offer_id: int
    supplier_id: int
    supplier_name: str
    location: str
    phone: str
    rating: float
    delivery_days: int
    is_verified: bool
    unit_price: int
    delivery_cost: int
    minimum_order_quantity: float
    available_quantity: float
    status: str
    quantity: float
    product_cost: int
    total_cost: int
    cost_per_unit: float
    eligible: bool
    reason: str
    updated_at: datetime
    score: float | None = None
    rank: int | None = None
    is_cheapest: bool = False
    is_best_overall: bool = False
    difference_vs_best: int | None = None


class CompareRequest(BaseModel):
    product_id: int = Field(gt=0)
    quantity: float = Field(gt=0, le=1_000_000)


class CompareResponse(BaseModel):
    product: ProductBrief
    quantity: float
    unit: str
    offers: list[ScoredOffer]
    recommended: ScoredOffer | None = None
    cheapest: ScoredOffer | None = None
    best_overall: ScoredOffer | None = None
    eligible_count: int = 0
    rejected_count: int = 0
    highest_eligible_total: int | None = None
    potential_savings: int = 0
    explanation: str
    data_source: str = "demo"
    disclaimer: str = (
        "Demo dataset: prices, suppliers and trends are fictional and for "
        "product demonstration only - not real market data."
    )


# ----------------------------------------------------------------------- analytics
class PricePoint(BaseModel):
    date: str
    price: float


class SupplierSeries(BaseModel):
    supplier_id: int
    supplier_name: str
    points: list[PricePoint]


class PriceHistoryOut(BaseModel):
    product_id: int
    product_name: str
    unit: str
    days: int
    points: list[PricePoint]
    supplier_series: list[SupplierSeries]
    min_price: float | None = None
    max_price: float | None = None
    avg_price: float | None = None
    change_pct: float | None = None
    data_source: str = "demo"


class PriceChange(BaseModel):
    product_id: int
    product_name: str
    category: str
    unit: str
    old_price: int
    new_price: int
    change_pct: float
    supplier_name: str
    changed_at: datetime


class TrendPoint(BaseModel):
    date: str
    avg_price: float


class OverviewOut(BaseModel):
    total_products: int
    active_suppliers: int
    total_offers: int
    avg_market_price: int
    potential_savings: int
    savings_pct: float
    price_changes: list[PriceChange]
    trend: list[TrendPoint]
    top_categories: list[CategoryOut]
    recent_offers: list[OfferOut]
    data_source: str = "demo"
    disclaimer: str = (
        "Demo dataset: prices, suppliers and trends are fictional and for "
        "product demonstration only - not real market data."
    )


# -------------------------------------------------------------------- saved offers
class SavedOfferOut(BaseModel):
    id: int
    offer_id: int
    created_at: datetime
    price_at_save: int
    status_at_save: str
    price_change: int
    price_change_pct: float
    status_changed: bool
    offer: OfferOut


class SavedOfferCreate(BaseModel):
    offer_id: int = Field(gt=0)


# ------------------------------------------------------------------------ assistant
class AssistantRequest(BaseModel):
    message: str = Field(min_length=1, max_length=1000)
    product_id: int | None = None
    quantity: float | None = Field(default=None, gt=0, le=1_000_000)


class AssistantResponse(BaseModel):
    answer: str
    intent: str
    suggestions: list[str] = []
    referenced_offers: list[ScoredOffer] = []
    engine: str = "rule-based"
    disclaimer: str = (
        "Answers are generated by a transparent rule-based engine using the "
        "PriceRadar demo dataset. No external AI model is connected."
    )
