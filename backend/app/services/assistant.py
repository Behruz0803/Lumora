"""Transparent rule-based assistant.

No external AI model is connected. Every answer is derived from the same
deterministic pricing engine and the demo dataset, and says so.
"""
from __future__ import annotations

import re
from datetime import timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import PriceHistory, Product
from app.schemas import AssistantResponse, ProductBrief
from app.services.catalog import offer_input, offers_for_product, reference_quantity
from app.services.pricing import ScoredOffer, build_comparison, round_qty

SYNONYMS = {
    "potato": "Potatoes",
    "potatoes": "Potatoes",
    "tomato": "Tomatoes",
    "tomatoes": "Tomatoes",
    "onion": "Onions",
    "onions": "Onions",
    "rice": "Rice",
    "flour": "Flour",
    "oil": "Cooking oil",
    "sunflower oil": "Cooking oil",
    "cooking oil": "Cooking oil",
    "sugar": "Sugar",
    "egg": "Eggs",
    "eggs": "Eggs",
}

UNIT_WORDS = {
    "kg": "kg",
    "kgs": "kg",
    "kilo": "kg",
    "kilos": "kg",
    "kilogram": "kg",
    "kilograms": "kg",
    "l": "l",
    "liter": "l",
    "liters": "l",
    "litre": "l",
    "litres": "l",
    "tray": "tray",
    "trays": "tray",
    "unit": "unit",
    "units": "unit",
}

QUANTITY_RE = re.compile(
    r"(\d+(?:[.,]\d+)?)\s*(kg|kgs|kilo|kilos|kilogram|kilograms|l|liter|liters|litre|litres|"
    r"tray|trajs|trays|unit|units)?",
    re.IGNORECASE,
)

DEFAULT_SUGGESTIONS = [
    "Compare potatoes for 100 kg",
    "What is the cheapest way to buy 50 kg of rice?",
    "Which supplier should I choose for 20 kg of tomatoes?",
    "Show the price trend for cooking oil",
]


def money(value: float | int) -> str:
    return f"{int(round(value)):,}".replace(",", " ")


def find_product(db: Session, message: str) -> Product | None:
    text = message.lower()
    products = list(db.scalars(select(Product)))
    for product in products:
        if product.name.lower() in text:
            return product
    for word, name in SYNONYMS.items():
        if re.search(rf"\b{re.escape(word)}\b", text):
            match = next((p for p in products if p.name == name), None)
            if match:
                return match
    return None


def find_quantity(message: str, product: Product) -> tuple[float | None, bool]:
    """Return (quantity, matched_unit). Ignores numbers that are clearly prices."""
    text = message.replace(",", ".")
    for match in QUANTITY_RE.finditer(text):
        raw, unit = match.group(1), (match.group(2) or "").lower()
        # skip numbers that look like money (e.g. "450000" or "4 000")
        if "." not in raw and len(raw) >= 5:
            continue
        value = float(raw)
        if value <= 0:
            continue
        if unit and UNIT_WORDS.get(unit) != product.unit and UNIT_WORDS.get(unit) != "unit":
            continue
        return round_qty(value), True
    return None, False


def _trend_answer(db: Session, product: Product, days: int = 30) -> str:
    rows = list(
        db.scalars(
            select(PriceHistory)
            .where(PriceHistory.product_id == product.id)
            .order_by(PriceHistory.recorded_at.asc())
        )
    )
    if not rows:
        return f"There is no recorded price history for {product.name} yet."
    latest_date = rows[-1].recorded_at
    window_start = latest_date - timedelta(days=days)
    window = [r for r in rows if r.recorded_at >= window_start]
    if len(window) < 2:
        return f"Not enough price history for {product.name} in the last {days} days."
    first, last = window[0].price, window[-1].price
    change = last - first
    pct = change / first * 100 if first else 0
    direction = "increased" if change > 0 else "decreased" if change < 0 else "stayed flat"
    low = min(window, key=lambda r: r.price)
    high = max(window, key=lambda r: r.price)
    return (
        f"Over the last {days} days the average {product.name} price {direction} "
        f"from {money(first)} UZS to {money(last)} UZS per {product.unit} "
        f"({pct:+.1f}%). The observed range was {money(low.price)} - {money(high.price)} UZS. "
        "This is a simulated demo series, so treat it as an illustration of the product, not a forecast."
    )


def answer(db: Session, message: str, product_id: int | None, quantity: float | None) -> AssistantResponse:
    text = message.strip()
    lowered = text.lower()
    product = db.get(Product, product_id) if product_id else None
    if product is None:
        product = find_product(db, text)

    def help_response() -> AssistantResponse:
        products = list(db.scalars(select(Product).order_by(Product.name)))
        catalogue = ", ".join(p.name for p in products)
        return AssistantResponse(
            answer=(
                "I can compare supplier offers and calculate total purchasing costs including delivery. "
                f"Try naming a product from the demo catalogue ({catalogue}) and a quantity, "
                "for example: '100 kg of potatoes'. I run on transparent business rules - "
                "no external AI model is connected."
            ),
            intent="help",
            suggestions=DEFAULT_SUGGESTIONS,
        )

    if product is None:
        return help_response()

    qty, unit_matched = find_quantity(text, product)
    if quantity and quantity > 0:
        qty = float(quantity)
        unit_matched = True

    trend_words = ("trend", "history", "historically", "increase", "decrease", "rise", "fell", "last month", "forecast")
    savings_words = ("save", "saving", "savings", "discount")
    supplier_words = ("supplier", "suppliers", "who", "contact", "phone", "call", "verified")
    stock_words = ("stock", "available", "availability", "delivery time", "how fast")

    intent = "compare"
    if any(w in lowered for w in trend_words):
        intent = "trend"
    elif any(w in lowered for w in savings_words):
        intent = "savings"
    elif any(w in lowered for w in supplier_words):
        intent = "suppliers"
    elif any(w in lowered for w in stock_words):
        intent = "availability"

    offers = offers_for_product(db, product.id)
    if not offers:
        return AssistantResponse(
            answer=f"There are no supplier offers for {product.name} in the demo dataset yet.",
            intent="empty",
            suggestions=DEFAULT_SUGGESTIONS,
        )

    if intent == "trend":
        return AssistantResponse(
            answer=_trend_answer(db, product),
            intent="trend",
            suggestions=[
                f"Compare {product.name.lower()} for 100 {product.unit}",
                f"Which supplier is best for {product.name.lower()}?",
            ],
        )

    if qty is None:
        qty = reference_quantity(product)

    comparison = build_comparison(ProductBrief.model_validate(product), [offer_input(o) for o in offers], qty)
    best: ScoredOffer | None = comparison.cheapest
    assigned_default = not unit_matched
    qty_note = (
        f" (I assumed {qty:g} {product.unit} - tell me the real quantity and I will recalculate.)"
        if assigned_default
        else ""
    )

    if best is None:
        reasons = "; ".join(f"{o.supplier_name}: {o.reason}" for o in comparison.offers)
        return AssistantResponse(
            answer=(
                f"I cannot find a supplier that can fulfil {qty:g} {product.unit} of {product.name}. "
                f"Reasons - {reasons}."
            ),
            intent=intent,
            suggestions=[f"Compare {product.name.lower()} for 20 {product.unit}", "Show all suppliers"],
            referenced_offers=comparison.offers,
        )

    if intent == "savings":
        preamble = (
            f"At {qty:g} {product.unit}{qty_note}, {best.supplier_name} gives the lowest total cost of "
            f"{money(best.total_cost)} UZS. "
        )
        if comparison.potential_savings > 0:
            preamble += (
                f"Choosing it instead of the most expensive eligible offer saves "
                f"{money(comparison.potential_savings)} UZS on this order."
            )
        else:
            preamble += "It is also the only eligible offer, so there is nothing to save against."
        return AssistantResponse(
            answer=preamble + " " + comparison.explanation,
            intent="savings",
            suggestions=[f"Compare {product.name.lower()} at a different quantity", "Save this offer"],
            referenced_offers=comparison.offers[:3],
        )

    if intent == "suppliers":
        lines = []
        for offer in comparison.offers[:4]:
            verification = "verified" if offer.is_verified else "not verified"
            lines.append(
                f"- {offer.supplier_name} ({offer.location}, {offer.rating:.1f}/5, {verification}, "
                f"{offer.delivery_days} day delivery, {offer.phone}): "
                f"{money(offer.unit_price)} UZS/{product.unit} + {money(offer.delivery_cost)} UZS delivery"
                + (f" = {money(offer.total_cost)} UZS for {qty:g} {product.unit}" if offer.eligible
                   else f" - not eligible ({offer.reason.lower()})")
            )
        return AssistantResponse(
            answer=(
                f"Supplier options for {product.name} at {qty:g} {product.unit}{qty_note}:\n"
                + "\n".join(lines)
                + f"\n\nBest total cost: {best.supplier_name} at {money(best.total_cost)} UZS. "
                "Contact details are fictional demo data."
            ),
            intent="suppliers",
            suggestions=[f"Compare {product.name.lower()} for 100 {product.unit}", "Show price trend"],
            referenced_offers=comparison.offers[:4],
        )

    if intent == "availability":
        available = [o for o in comparison.offers if o.eligible]
        parts = [
            f"{o.supplier_name}: {o.available_quantity:g} {product.unit} available, "
            f"minimum order {o.minimum_order_quantity:g} {product.unit}, delivery in {o.delivery_days} day(s)"
            for o in available
        ]
        return AssistantResponse(
            answer=(
                f"At {qty:g} {product.unit}{qty_note}, {len(available)} of {len(comparison.offers)} "
                f"suppliers can fulfil your order.\n" + "\n".join(f"- {p}" for p in parts)
            ),
            intent="availability",
            suggestions=[f"Which supplier is cheapest for {product.name.lower()}?", "Show price trend"],
            referenced_offers=comparison.offers[:3],
        )

    # default: full comparison / recommendation
    direct = (
        f"For {qty:g} {product.unit} of {product.name}{qty_note}, the lowest total cost is "
        f"{money(best.total_cost)} UZS from {best.supplier_name} "
        f"({money(best.unit_price)} UZS/{product.unit} x {qty:g} = {money(best.product_cost)} UZS "
        f"+ {money(best.delivery_cost)} UZS delivery). "
    )
    if comparison.cheapest and comparison.best_overall and comparison.cheapest.offer_id != comparison.best_overall.offer_id:
        direct += (
            f"If you value quality and delivery speed over the last few percent of price, "
            f"{comparison.best_overall.supplier_name} is the best overall option."
        )
    suggestions = [
        f"Show the price trend for {product.name.lower()}",
        f"What if I order 250 {product.unit}?",
        "Save the cheapest offer",
    ]
    return AssistantResponse(
        answer=direct + "\n\n" + comparison.explanation,
        intent=intent,
        suggestions=suggestions,
        referenced_offers=comparison.offers[:3],
    )
