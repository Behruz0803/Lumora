"""SQLAlchemy ORM models for PriceRadar."""
from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.session import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    full_name: Mapped[str] = mapped_column(String(120), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    business_name: Mapped[str | None] = mapped_column(String(160), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(40), nullable=True)
    language: Mapped[str] = mapped_column(String(8), default="en", nullable=False)
    notify_price_drops: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    notify_new_offers: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    notify_weekly_digest: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, nullable=False)

    saved_offers: Mapped[list[SavedOffer]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )


class Product(Base):
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(120), unique=True, index=True, nullable=False)
    category: Mapped[str] = mapped_column(String(80), index=True, nullable=False)
    unit: Mapped[str] = mapped_column(String(20), default="kg", nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    is_demo: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, nullable=False)

    offers: Mapped[list[Offer]] = relationship(
        back_populates="product", cascade="all, delete-orphan"
    )
    price_history: Mapped[list[PriceHistory]] = relationship(
        back_populates="product", cascade="all, delete-orphan"
    )

    __table_args__ = (CheckConstraint("length(name) > 0", name="ck_products_name_not_empty"),)


class Supplier(Base):
    __tablename__ = "suppliers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(160), unique=True, index=True, nullable=False)
    phone: Mapped[str] = mapped_column(String(40), nullable=False)
    location: Mapped[str] = mapped_column(String(120), index=True, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    categories: Mapped[str | None] = mapped_column(String(255), nullable=True)
    rating: Mapped[float] = mapped_column(Float, default=4.0, nullable=False)
    delivery_days: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_demo: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, nullable=False)

    offers: Mapped[list[Offer]] = relationship(
        back_populates="supplier", cascade="all, delete-orphan"
    )

    __table_args__ = (
        CheckConstraint("rating >= 0 AND rating <= 5", name="ck_suppliers_rating_range"),
        CheckConstraint("delivery_days >= 1", name="ck_suppliers_delivery_days_positive"),
    )


class Offer(Base):
    """A supplier's price for one product. Money is stored as whole UZS (integers)."""

    __tablename__ = "offers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    product_id: Mapped[int] = mapped_column(
        ForeignKey("products.id", ondelete="CASCADE"), index=True, nullable=False
    )
    supplier_id: Mapped[int] = mapped_column(
        ForeignKey("suppliers.id", ondelete="CASCADE"), index=True, nullable=False
    )
    unit_price: Mapped[int] = mapped_column(Integer, nullable=False)
    delivery_cost: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    minimum_order_quantity: Mapped[float] = mapped_column(Float, default=1.0, nullable=False)
    available_quantity: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="in_stock", index=True, nullable=False)
    is_demo: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=utcnow, onupdate=utcnow, nullable=False
    )

    product: Mapped[Product] = relationship(back_populates="offers")
    supplier: Mapped[Supplier] = relationship(back_populates="offers")
    price_history: Mapped[list[PriceHistory]] = relationship(
        back_populates="offer", cascade="all, delete-orphan"
    )

    __table_args__ = (
        UniqueConstraint("product_id", "supplier_id", name="uq_offers_product_supplier"),
        CheckConstraint("unit_price > 0", name="ck_offers_unit_price_positive"),
        CheckConstraint("delivery_cost >= 0", name="ck_offers_delivery_cost_non_negative"),
        CheckConstraint(
            "minimum_order_quantity > 0", name="ck_offers_moq_positive"
        ),
        CheckConstraint(
            "available_quantity >= 0", name="ck_offers_available_non_negative"
        ),
        CheckConstraint(
            "status IN ('in_stock', 'low_stock', 'out_of_stock')", name="ck_offers_status_values"
        ),
        Index("ix_offers_product_status", "product_id", "status"),
    )


class PriceHistory(Base):
    __tablename__ = "price_history"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    product_id: Mapped[int] = mapped_column(
        ForeignKey("products.id", ondelete="CASCADE"), index=True, nullable=False
    )
    offer_id: Mapped[int | None] = mapped_column(
        ForeignKey("offers.id", ondelete="CASCADE"), index=True, nullable=True
    )
    price: Mapped[int] = mapped_column(Integer, nullable=False)
    recorded_at: Mapped[datetime] = mapped_column(
        DateTime, default=utcnow, index=True, nullable=False
    )

    product: Mapped[Product] = relationship(back_populates="price_history")
    offer: Mapped[Offer | None] = relationship(back_populates="price_history")

    __table_args__ = (
        CheckConstraint("price > 0", name="ck_price_history_price_positive"),
        Index("ix_price_history_product_recorded", "product_id", "recorded_at"),
    )


class SavedOffer(Base):
    __tablename__ = "saved_offers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    offer_id: Mapped[int] = mapped_column(
        ForeignKey("offers.id", ondelete="CASCADE"), index=True, nullable=False
    )
    price_at_save: Mapped[int] = mapped_column(Integer, nullable=False)
    status_at_save: Mapped[str] = mapped_column(String(20), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, nullable=False)

    user: Mapped[User] = relationship(back_populates="saved_offers")
    offer: Mapped[Offer] = relationship()

    __table_args__ = (
        UniqueConstraint("user_id", "offer_id", name="uq_saved_offers_user_offer"),
    )
