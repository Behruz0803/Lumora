"""Total-cost calculation and deterministic recommendation engine.

Business rule (per product spec):
    Total Cost = (Unit Price x Quantity) + Delivery Cost

All money values are whole UZS. Quantities can be fractional (e.g. 2.5 kg).
The engine is intentionally dependency-free so it can be unit tested without a DB.
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal, ROUND_HALF_UP

from app.core.i18n import localise, t
from app.schemas.schemas import CompareResponse, ProductBrief, ScoredOffer


class PricingError(ValueError):
    """Raised when inputs cannot produce a meaningful cost calculation."""


def round_money(value: Decimal | float | int) -> int:
    """Round to the nearest whole UZS using half-up (banker's rounding is wrong for prices)."""
    return int(Decimal(str(value)).quantize(Decimal("1"), rounding=ROUND_HALF_UP))


def round_qty(value: float, places: int = 3) -> float:
    return float(Decimal(str(value)).quantize(Decimal(f"1.{'0' * places}"), rounding=ROUND_HALF_UP))


def calculate_total_cost(unit_price: int, quantity: float, delivery_cost: int) -> dict:
    """Return product cost, delivery cost, total cost and delivered cost per unit."""
    if unit_price <= 0:
        raise PricingError("Unit price must be greater than zero")
    if quantity <= 0:
        raise PricingError("Quantity must be greater than zero")
    if delivery_cost < 0:
        raise PricingError("Delivery cost cannot be negative")

    product_cost = round_money(Decimal(str(unit_price)) * Decimal(str(quantity)))
    total_cost = product_cost + int(delivery_cost)
    cost_per_unit = float(
        (Decimal(total_cost) / Decimal(str(quantity))).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    )
    return {
        "product_cost": product_cost,
        "delivery_cost": int(delivery_cost),
        "total_cost": total_cost,
        "cost_per_unit": cost_per_unit,
    }


@dataclass
class OfferInput:
    """Plain snapshot of an offer, decoupled from the ORM."""

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
    updated_at: datetime


def _fmt_money(value: int | float) -> str:
    return f"{int(round(value)):,}".replace(",", " ")


def _fmt_qty(value: float) -> str:
    return f"{value:g}"


def eligibility_reason(offer: OfferInput, quantity: float, language: str = "en") -> tuple[bool, str]:
    """Decide whether an offer can fulfil the requested quantity, and explain why not."""
    if offer.unit_price <= 0:
        return False, t(language, "Invalid price data")
    if offer.status == "out_of_stock":
        return False, t(language, "Currently out of stock")
    if offer.available_quantity <= 0:
        return False, t(language, "No stock available")
    if quantity < offer.minimum_order_quantity:
        return (
            False,
            t(
                language,
                "Minimum order is {minimum} units (requested {requested})",
                minimum=_fmt_qty(offer.minimum_order_quantity),
                requested=_fmt_qty(quantity),
            ),
        )
    if quantity > offer.available_quantity:
        return (
            False,
            t(
                language,
                "Only {available} units available (requested {requested})",
                available=_fmt_qty(offer.available_quantity),
                requested=_fmt_qty(quantity),
            ),
        )
    if offer.status == "low_stock":
        return True, t(
            language,
            "Eligible - low stock ({available} units left)",
            available=_fmt_qty(offer.available_quantity),
        )
    return True, t(language, "Eligible - in stock")


def score_offer(offer: OfferInput, total_cost: int) -> float:
    """Quality/delivery adjusted score used to pick the 'best overall' offer.

    Lower is better. The cheapest total always wins unless another offer is
    meaningfully better on rating, verification or delivery speed.
    """
    quality_premium = (5.0 - max(0.0, min(5.0, offer.rating))) * 0.015  # up to +6%
    delivery_premium = min(offer.delivery_days, 7) * 0.004  # up to +2.8%
    unverified_premium = 0.0 if offer.is_verified else 0.01
    delivery_share = (offer.delivery_cost / total_cost) if total_cost else 0.0
    score = total_cost * (1 + quality_premium + delivery_premium + unverified_premium)
    score += offer.delivery_cost * 0.02  # small extra weight on logistics overhead
    score += delivery_share * 1000  # break near-ties by delivery share
    return round(score, 2)


def evaluate_offers(offers: list[OfferInput], quantity: float, language: str = "en") -> list[ScoredOffer]:
    if quantity <= 0:
        raise PricingError("Quantity must be greater than zero")

    scored: list[ScoredOffer] = []
    for offer in offers:
        eligible, reason = eligibility_reason(offer, quantity, language)
        costs = calculate_total_cost(offer.unit_price, quantity, offer.delivery_cost)
        score = score_offer(offer, costs["total_cost"]) if eligible else None
        scored.append(
            ScoredOffer(
                offer_id=offer.offer_id,
                supplier_id=offer.supplier_id,
                supplier_name=offer.supplier_name,
                location=offer.location,
                phone=offer.phone,
                rating=round(float(offer.rating), 2),
                delivery_days=offer.delivery_days,
                is_verified=offer.is_verified,
                unit_price=offer.unit_price,
                delivery_cost=offer.delivery_cost,
                minimum_order_quantity=offer.minimum_order_quantity,
                available_quantity=offer.available_quantity,
                status=offer.status,
                quantity=round_qty(quantity),
                product_cost=costs["product_cost"],
                total_cost=costs["total_cost"],
                cost_per_unit=costs["cost_per_unit"],
                eligible=eligible,
                reason=reason,
                updated_at=offer.updated_at,
                score=score,
            )
        )

    # Rank eligible offers by total cost, then rating, then id for stability.
    eligible_offers = [o for o in scored if o.eligible]
    eligible_offers.sort(key=lambda o: (o.total_cost, -o.rating, o.offer_id))
    for index, offer in enumerate(eligible_offers, start=1):
        offer.rank = index

    if eligible_offers:
        cheapest = eligible_offers[0]
        cheapest.is_cheapest = True
        best_overall = min(
            eligible_offers, key=lambda o: (o.score if o.score is not None else float("inf"), o.total_cost, o.offer_id)
        )
        best_overall.is_best_overall = True
        for offer in eligible_offers:
            offer.difference_vs_best = offer.total_cost - cheapest.total_cost

    # Ineligible offers keep a None rank but are ordered by total cost for readability.
    ineligible = sorted([o for o in scored if not o.eligible], key=lambda o: o.total_cost)
    return eligible_offers + ineligible


def build_comparison(
    product: ProductBrief,
    offers: list[OfferInput],
    quantity: float,
    language: str = "en",
) -> CompareResponse:
    ranked = evaluate_offers(offers, quantity, language)
    eligible = [o for o in ranked if o.eligible]
    rejected = [o for o in ranked if not o.eligible]
    cheapest = next((o for o in ranked if o.is_cheapest), None)
    best_overall = next((o for o in ranked if o.is_best_overall), None)
    highest_total = max((o.total_cost for o in eligible), default=None)

    return CompareResponse(
        product=product,
        quantity=round_qty(quantity),
        unit=product.unit,
        offers=ranked,
        recommended=cheapest,
        cheapest=cheapest,
        best_overall=best_overall,
        eligible_count=len(eligible),
        rejected_count=len(rejected),
        highest_eligible_total=highest_total,
        potential_savings=(highest_total - cheapest.total_cost) if (cheapest and highest_total) else 0,
        explanation=explain(product, quantity, ranked, cheapest, best_overall, len(rejected), language),
    )


def explain(
    product: ProductBrief,
    quantity: float,
    ranked: list[ScoredOffer],
    cheapest: ScoredOffer | None,
    best_overall: ScoredOffer | None,
    rejected_count: int,
    language: str = "en",
) -> str:
    unit = localise(language, product.unit)
    product_name = localise(language, product.name)
    qty = _fmt_qty(quantity)
    if cheapest is None:
        base = t(
            language,
            "No supplier can currently fulfil {quantity} {unit} of {product}. "
            "All offers are out of stock, below the minimum order quantity, or short on stock.",
            quantity=qty,
            unit=unit,
            product=product_name,
        )
        if ranked:
            closest = ranked[0]
            base += " " + t(
                language,
                "The closest option is {supplier} ({reason}).",
                supplier=closest.supplier_name,
                reason=closest.reason,
            )
        return base

    lines = [
        t(
            language,
            "Recommended: {supplier} - {quantity} {unit} x {unit_price} UZS = {product_cost} UZS "
            "product cost + {delivery} UZS delivery = {total} UZS total "
            "({per_unit} UZS per {unit} delivered).",
            supplier=cheapest.supplier_name,
            quantity=qty,
            unit=unit,
            unit_price=_fmt_money(cheapest.unit_price),
            product_cost=_fmt_money(cheapest.product_cost),
            delivery=_fmt_money(cheapest.delivery_cost),
            total=_fmt_money(cheapest.total_cost),
            per_unit=_fmt_money(cheapest.cost_per_unit),
        )
    ]

    runner_up = next(
        (o for o in ranked if o.eligible and o.offer_id != cheapest.offer_id), None
    )
    if runner_up:
        diff = runner_up.total_cost - cheapest.total_cost
        pct = (diff / runner_up.total_cost * 100) if runner_up.total_cost else 0
        lines.append(
            t(
                language,
                "It is {difference} UZS ({percent}%) cheaper than the next option, {supplier} ({total} UZS).",
                difference=_fmt_money(diff),
                percent=f"{pct:.1f}",
                supplier=runner_up.supplier_name,
                total=_fmt_money(runner_up.total_cost),
            )
        )
    else:
        lines.append(
            t(
                language,
                "It is the only offer that can fulfil this quantity, so there is no alternative to compare against.",
            )
        )

    if cheapest.delivery_cost == 0:
        lines.append(
            t(
                language,
                "This supplier includes free delivery, which is why the higher unit price still wins on total cost.",
            )
        )
    elif cheapest.unit_price > min(o.unit_price for o in ranked if o.eligible):
        lines.append(
            t(
                language,
                "Its unit price is not the lowest, but free or cheaper delivery makes the total cost the lowest.",
            )
        )

    others = [o for o in ranked if o.eligible and o.offer_id != cheapest.offer_id]
    if others:
        breakdown = "; ".join(
            f"{o.supplier_name} - {_fmt_money(o.total_cost)} UZS"
            + (
                " " + t(language, "(free delivery)")
                if o.delivery_cost == 0
                else " " + t(language, "({delivery} UZS delivery)", delivery=_fmt_money(o.delivery_cost))
            )
            for o in others
        )
        lines.append(t(language, "Other eligible options: {breakdown}.", breakdown=breakdown))

    if len(others) >= 1:
        most_expensive = max(others, key=lambda o: o.total_cost)
        saved = most_expensive.total_cost - cheapest.total_cost
        if saved > 0:
            lines.append(
                t(
                    language,
                    "Compared with the most expensive eligible option ({supplier}, {total} UZS), "
                    "choosing {best} saves {saved} UZS on this order.",
                    supplier=most_expensive.supplier_name,
                    total=_fmt_money(most_expensive.total_cost),
                    best=cheapest.supplier_name,
                    saved=_fmt_money(saved),
                )
            )

    if best_overall and best_overall.offer_id != cheapest.offer_id:
        premium = best_overall.total_cost - cheapest.total_cost
        if premium > 0:
            lines.append(
                t(
                    language,
                    "Best overall on quality and delivery is {supplier} ({rating}/5 rating, "
                    "{days} day delivery) at {total} UZS, a {premium} UZS premium.",
                    supplier=best_overall.supplier_name,
                    rating=f"{best_overall.rating:.1f}",
                    days=best_overall.delivery_days,
                    total=_fmt_money(best_overall.total_cost),
                    premium=_fmt_money(premium),
                )
            )
        else:
            lines.append(
                t(
                    language,
                    "Best overall on quality and delivery is {supplier} ({rating}/5 rating, "
                    "{days} day delivery) at {total} UZS.",
                    supplier=best_overall.supplier_name,
                    rating=f"{best_overall.rating:.1f}",
                    days=best_overall.delivery_days,
                    total=_fmt_money(best_overall.total_cost),
                )
            )

    if rejected_count:
        lines.append(
            t(
                language,
                "{count} offer(s) were excluded because they cannot fulfil the requested quantity "
                "or are out of stock.",
                count=rejected_count,
            )
        )
    return " ".join(lines)
