"""Unit tests for total cost calculation and recommendation ranking."""
from __future__ import annotations

from datetime import datetime

import pytest

from app.schemas import ProductBrief
from app.services.pricing import (
    OfferInput,
    PricingError,
    build_comparison,
    calculate_total_cost,
    eligibility_reason,
    evaluate_offers,
    round_money,
)

POTATOES = ProductBrief(id=1, name="Potatoes", category="Vegetables", unit="kg")


def make_offer(**overrides) -> OfferInput:
    defaults = dict(
        offer_id=1,
        supplier_id=1,
        supplier_name="Supplier A",
        location="Tashkent",
        phone="+998 90 000 00 00",
        rating=4.5,
        delivery_days=1,
        is_verified=True,
        unit_price=4000,
        delivery_cost=50_000,
        minimum_order_quantity=50.0,
        available_quantity=1000.0,
        status="in_stock",
        updated_at=datetime(2026, 1, 1, 9, 0, 0),
    )
    defaults.update(overrides)
    return OfferInput(**defaults)


class TestTotalCost:
    def test_killer_flow_supplier_a(self):
        costs = calculate_total_cost(4000, 100, 50_000)
        assert costs["product_cost"] == 400_000
        assert costs["total_cost"] == 450_000
        assert costs["cost_per_unit"] == 4500.0

    def test_killer_flow_supplier_b(self):
        assert calculate_total_cost(3500, 100, 50_000)["total_cost"] == 400_000

    def test_killer_flow_supplier_c_free_delivery(self):
        costs = calculate_total_cost(4200, 100, 0)
        assert costs["total_cost"] == 420_000
        assert costs["cost_per_unit"] == 4200.0

    def test_free_delivery_beats_cheaper_unit_price_on_total(self):
        cheap_unit = calculate_total_cost(3500, 100, 50_000)["total_cost"]
        free_delivery = calculate_total_cost(3800, 100, 0)["total_cost"]
        assert free_delivery < cheap_unit

    def test_fractional_quantity_rounds_half_up(self):
        costs = calculate_total_cost(1234, 2.5, 0)
        assert costs["product_cost"] == 3085  # 3085.0
        assert costs["total_cost"] == 3085

    def test_fractional_rounding_case(self):
        assert round_money(2.5) == 3
        assert round_money(2.4) == 2

    @pytest.mark.parametrize(
        "unit_price,quantity,delivery",
        [(0, 10, 0), (-5, 10, 0), (100, 0, 0), (100, -1, 0), (100, 10, -1)],
    )
    def test_invalid_inputs_raise(self, unit_price, quantity, delivery):
        with pytest.raises(PricingError):
            calculate_total_cost(unit_price, quantity, delivery)

    def test_delivery_included_per_unit(self):
        costs = calculate_total_cost(1000, 10, 5000)
        assert costs["total_cost"] == 15_000
        assert costs["cost_per_unit"] == 1500.0


class TestEligibility:
    def test_out_of_stock_rejected_even_if_cheapest(self):
        offer = make_offer(unit_price=1000, available_quantity=0, status="out_of_stock")
        eligible, reason = eligibility_reason(offer, 100)
        assert eligible is False
        assert "out of stock" in reason.lower()

    def test_below_minimum_order_quantity_rejected(self):
        offer = make_offer(minimum_order_quantity=200)
        eligible, reason = eligibility_reason(offer, 100)
        assert eligible is False
        assert "minimum order" in reason.lower()

    def test_insufficient_stock_rejected(self):
        offer = make_offer(available_quantity=50)
        eligible, reason = eligibility_reason(offer, 100)
        assert eligible is False
        assert "available" in reason.lower()

    def test_low_stock_still_eligible(self):
        offer = make_offer(status="low_stock", available_quantity=150)
        eligible, reason = eligibility_reason(offer, 100)
        assert eligible is True
        assert "low stock" in reason.lower()

    def test_exact_stock_is_eligible(self):
        offer = make_offer(available_quantity=100)
        assert eligibility_reason(offer, 100)[0] is True


class TestRanking:
    def offers(self) -> list[OfferInput]:
        return [
            make_offer(offer_id=1, supplier_id=1, supplier_name="Supplier A", unit_price=4000, delivery_cost=50_000),
            make_offer(offer_id=2, supplier_id=2, supplier_name="Supplier B", unit_price=3500, delivery_cost=50_000),
            make_offer(offer_id=3, supplier_id=3, supplier_name="Supplier C", unit_price=4200, delivery_cost=0),
        ]

    def test_cheapest_is_lowest_total_cost_not_lowest_unit_price(self):
        ranked = evaluate_offers(self.offers(), 100)
        assert [o.supplier_name for o in ranked] == ["Supplier B", "Supplier C", "Supplier A"]
        assert ranked[0].total_cost == 400_000
        assert ranked[0].is_cheapest is True
        assert ranked[0].rank == 1

    def test_ranking_ignores_unit_price_order(self):
        ranked = evaluate_offers(self.offers(), 100)
        assert ranked[2].unit_price == 4000  # A has the middle unit price but the highest total
        assert ranked[1].unit_price == 4200  # C has the highest unit price but beats A on total

    def test_comparison_savings_matches_killer_flow(self):
        result = build_comparison(POTATOES, self.offers(), 100)
        assert result.cheapest is not None
        assert result.cheapest.supplier_name == "Supplier B"
        assert result.cheapest.total_cost == 400_000
        assert result.highest_eligible_total == 450_000
        assert result.potential_savings == 50_000
        assert result.eligible_count == 3
        assert result.rejected_count == 0
        assert "Supplier B" in result.explanation
        assert "50 000" in result.explanation

    def test_best_overall_can_differ_from_cheapest(self):
        offers = [
            make_offer(offer_id=1, supplier_name="Cheap Slow", unit_price=3500, rating=3.0, delivery_days=6, is_verified=False),
            make_offer(offer_id=2, supplier_name="Premium", unit_price=3600, rating=5.0, delivery_days=1, is_verified=True),
        ]
        result = build_comparison(POTATOES, offers, 100)
        assert result.cheapest.supplier_name == "Cheap Slow"
        assert result.best_overall.supplier_name == "Premium"
        assert result.best_overall.is_best_overall is True
        assert result.cheapest.is_best_overall is False

    def test_out_of_stock_offer_cannot_win(self):
        offers = self.offers() + [
            make_offer(
                offer_id=9,
                supplier_name="Unavailable",
                unit_price=1000,
                delivery_cost=0,
                status="out_of_stock",
                available_quantity=0,
            )
        ]
        result = build_comparison(POTATOES, offers, 100)
        assert result.cheapest.supplier_name == "Supplier B"
        assert result.rejected_count == 1
        unavailable = next(o for o in result.offers if o.supplier_name == "Unavailable")
        assert unavailable.eligible is False
        assert unavailable.rank is None
        assert unavailable.score is None

    def test_no_eligible_offers_returns_no_recommendation(self):
        offers = [make_offer(available_quantity=10), make_offer(offer_id=2, status="out_of_stock")]
        result = build_comparison(POTATOES, offers, 100)
        assert result.cheapest is None
        assert result.recommended is None
        assert result.eligible_count == 0
        assert "No supplier" in result.explanation

    def test_ranked_offers_are_sorted_by_total_cost(self):
        result = build_comparison(POTATOES, self.offers(), 250)
        totals = [o.total_cost for o in result.offers if o.eligible]
        assert totals == sorted(totals)

    def test_quantity_changes_ranking(self):
        offers = [
            make_offer(offer_id=1, supplier_name="Low price high delivery", unit_price=3500, delivery_cost=150_000),
            make_offer(offer_id=2, supplier_name="High price low delivery", unit_price=4100, delivery_cost=0),
        ]
        small = build_comparison(POTATOES, offers, 50)
        large = build_comparison(POTATOES, offers, 1000)
        assert small.cheapest.supplier_name == "High price low delivery"
        assert large.cheapest.supplier_name == "Low price high delivery"

    def test_comparison_is_deterministic(self):
        first = build_comparison(POTATOES, self.offers(), 100)
        second = build_comparison(POTATOES, self.offers(), 100)
        assert [o.offer_id for o in first.offers] == [o.offer_id for o in second.offers]

    def test_difference_vs_best_never_negative(self):
        result = build_comparison(POTATOES, self.offers(), 100)
        assert all(o.difference_vs_best >= 0 for o in result.offers if o.eligible)
