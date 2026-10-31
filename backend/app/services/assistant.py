"""Transparent rule-based assistant.

No external AI model is connected. Every answer is derived from the same
deterministic pricing engine and the demo dataset, and says so.
"""
from __future__ import annotations

import re
from datetime import timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.i18n import localise, t
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


def suggestions(language: str) -> list[str]:
    return [t(language, item) for item in DEFAULT_SUGGESTIONS]


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


def _trend_answer(db: Session, product: Product, days: int = 30, language: str = "en") -> str:
    rows = list(
        db.scalars(
            select(PriceHistory)
            .where(PriceHistory.product_id == product.id)
            .order_by(PriceHistory.recorded_at.asc())
        )
    )
    if not rows:
        return t(
            language,
            "There is no recorded price history for {product} yet.",
            product=localise(language, product.name),
        )
    latest_date = rows[-1].recorded_at
    window_start = latest_date - timedelta(days=days)
    window = [r for r in rows if r.recorded_at >= window_start]
    if len(window) < 2:
        return t(
            language,
            "Not enough price history for {product} in the last {days} days.",
            product=localise(language, product.name),
            days=days,
        )
    first, last = window[0].price, window[-1].price
    change = last - first
    pct = change / first * 100 if first else 0
    direction = t(
        language,
        "increased" if change > 0 else "decreased" if change < 0 else "stayed flat",
    )
    low = min(window, key=lambda r: r.price)
    high = max(window, key=lambda r: r.price)
    return t(
        language,
        "Over the last {days} days the average {product} price {direction} "
        "from {first} UZS to {last} UZS per {unit} ({percent}%). The observed range was "
        "{low} - {high} UZS. This is a simulated demo series, so treat it as an "
        "illustration of the product, not a forecast.",
        days=days,
        product=localise(language, product.name),
        direction=direction,
        first=money(first),
        last=money(last),
        unit=localise(language, product.unit),
        percent=f"{pct:+.1f}",
        low=money(low.price),
        high=money(high.price),
    )


def answer(
    db: Session,
    message: str,
    product_id: int | None,
    quantity: float | None,
    language: str = "en",
) -> AssistantResponse:
    text = message.strip()
    lowered = text.lower()
    product = db.get(Product, product_id) if product_id else None
    if product is None:
        product = find_product(db, text)

    pname = localise(language, product.name) if product is not None else ""
    punit = localise(language, product.unit) if product is not None else ""

    def help_response() -> AssistantResponse:
        products = list(db.scalars(select(Product).order_by(Product.name)))
        catalogue = ", ".join(p.name for p in products)
        return AssistantResponse(
            answer=t(
                language,
                "I can compare supplier offers and calculate total purchasing costs including delivery. "
                "Try naming a product from the demo catalogue ({catalogue}) and a quantity, "
                "for example: '100 kg of potatoes'. I run on transparent business rules - "
                "no external AI model is connected.",
                catalogue=catalogue,
            ),
            intent="help",
            suggestions=suggestions(language),
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
            answer=t(
                language,
                "There are no supplier offers for {product} in the demo dataset yet.",
                product=pname,
            ),
            intent="empty",
            suggestions=suggestions(language),
        )

    if intent == "trend":
        return AssistantResponse(
            answer=_trend_answer(db, product, language=language),
            intent="trend",
            suggestions=[
                t(language, "Compare {product} for 100 {unit}", product=pname.lower(), unit=punit),
                t(language, "Which supplier is best for {product}?", product=pname.lower()),
            ],
        )

    if qty is None:
        qty = reference_quantity(product)

    comparison = build_comparison(
        ProductBrief.model_validate(product), [offer_input(o) for o in offers], qty, language
    )
    best: ScoredOffer | None = comparison.cheapest
    assigned_default = not unit_matched
    qty_note = (
        t(
            language,
            " (I assumed {quantity} {unit} - tell me the real quantity and I will recalculate.)",
            quantity=f"{qty:g}",
            unit=punit,
        )
        if assigned_default
        else ""
    )

    if best is None:
        reasons = "; ".join(f"{o.supplier_name}: {o.reason}" for o in comparison.offers)
        return AssistantResponse(
            answer=t(
                language,
                "I cannot find a supplier that can fulfil {quantity} {unit} of {product}. Reasons - {reasons}.",
                quantity=f"{qty:g}",
                unit=punit,
                product=pname,
                reasons=reasons,
            ),
            intent=intent,
            suggestions=[
                t(language, "Compare {product} for 20 {unit}", product=pname.lower(), unit=punit),
                t(language, "Show all suppliers"),
            ],
            referenced_offers=comparison.offers,
        )

    if intent == "savings":
        preamble = t(
            language,
            "At {quantity} {unit}{note}, {supplier} gives the lowest total cost of {total} UZS.",
            quantity=f"{qty:g}",
            unit=punit,
            note=qty_note,
            supplier=best.supplier_name,
            total=money(best.total_cost),
        ) + " "
        if comparison.potential_savings > 0:
            preamble += t(
                language,
                "Choosing it instead of the most expensive eligible offer saves {saved} UZS on this order.",
                saved=money(comparison.potential_savings),
            )
        else:
            preamble += t(language, "It is also the only eligible offer, so there is nothing to save against.")
        return AssistantResponse(
            answer=preamble + " " + comparison.explanation,
            intent="savings",
            suggestions=[
                t(language, "Compare {product} at a different quantity", product=pname.lower()),
                t(language, "Save this offer"),
            ],
            referenced_offers=comparison.offers[:3],
        )

    if intent == "suppliers":
        lines = []
        for offer in comparison.offers[:4]:
            verification = t(language, "verified" if offer.is_verified else "not verified")
            lines.append(
                t(
                    language,
                    "- {supplier} ({location}, {rating}/5, {verification}, {days} day delivery, {phone}): "
                    "{unit_price} UZS/{unit} + {delivery} UZS delivery",
                    supplier=offer.supplier_name,
                    location=offer.location,
                    rating=f"{offer.rating:.1f}",
                    verification=verification,
                    days=offer.delivery_days,
                    phone=offer.phone,
                    unit_price=money(offer.unit_price),
                    unit=punit,
                    delivery=money(offer.delivery_cost),
                )
                + (
                    t(
                        language,
                        " = {total} UZS for {quantity} {unit}",
                        total=money(offer.total_cost),
                        quantity=f"{qty:g}",
                        unit=punit,
                    )
                    if offer.eligible
                    else t(language, " - not eligible ({reason})", reason=offer.reason)
                )
            )
        return AssistantResponse(
            answer=(
                t(
                    language,
                    "Supplier options for {product} at {quantity} {unit}{note}:",
                    product=pname,
                    quantity=f"{qty:g}",
                    unit=punit,
                    note=qty_note,
                )
                + "\n"
                + "\n".join(lines)
                + "\n\n"
                + t(
                    language,
                    "Best total cost: {supplier} at {total} UZS. Contact details are fictional demo data.",
                    supplier=best.supplier_name,
                    total=money(best.total_cost),
                )
            ),
            intent="suppliers",
            suggestions=[
                t(language, "Compare {product} for 100 {unit}", product=pname.lower(), unit=punit),
                t(language, "Show price trend"),
            ],
            referenced_offers=comparison.offers[:4],
        )

    if intent == "availability":
        available = [o for o in comparison.offers if o.eligible]
        parts = [
            t(
                language,
                "{supplier}: {available} {unit} available, minimum order {minimum} {unit}, delivery in {days} day(s)",
                supplier=o.supplier_name,
                available=f"{o.available_quantity:g}",
                minimum=f"{o.minimum_order_quantity:g}",
                unit=punit,
                days=o.delivery_days,
            )
            for o in available
        ]
        return AssistantResponse(
            answer=(
                t(
                    language,
                    "At {quantity} {unit}{note}, {available} of {total} suppliers can fulfil your order.",
                    quantity=f"{qty:g}",
                    unit=punit,
                    note=qty_note,
                    available=len(available),
                    total=len(comparison.offers),
                )
                + "\n"
                + "\n".join(f"- {p}" for p in parts)
            ),
            intent="availability",
            suggestions=[
                t(language, "Which supplier is cheapest for {product}?", product=pname.lower()),
                t(language, "Show price trend"),
            ],
            referenced_offers=comparison.offers[:3],
        )

    # default: full comparison / recommendation
    direct = t(
        language,
        "For {quantity} {unit} of {product}{note}, the lowest total cost is {total} UZS from "
        "{supplier} ({unit_price} UZS/{unit} x {quantity} = {product_cost} UZS + {delivery} UZS delivery).",
        quantity=f"{qty:g}",
        unit=punit,
        product=pname,
        note=qty_note,
        total=money(best.total_cost),
        supplier=best.supplier_name,
        unit_price=money(best.unit_price),
        product_cost=money(best.product_cost),
        delivery=money(best.delivery_cost),
    ) + " "
    if comparison.cheapest and comparison.best_overall and comparison.cheapest.offer_id != comparison.best_overall.offer_id:
        direct += t(
            language,
            "If you value quality and delivery speed over the last few percent of price, "
            "{supplier} is the best overall option.",
            supplier=comparison.best_overall.supplier_name,
        )
    suggestion_list = [
        t(language, "Show the price trend for {product}", product=pname.lower()),
        t(language, "What if I order 250 {unit}?", unit=punit),
        t(language, "Save the cheapest offer"),
    ]
    return AssistantResponse(
        answer=direct + "\n\n" + comparison.explanation,
        intent=intent,
        suggestions=suggestion_list,
        referenced_offers=comparison.offers[:3],
    )
