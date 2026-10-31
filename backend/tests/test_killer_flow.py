"""End-to-end Killer Flow: Dilshod buys 100 kg of potatoes.

Step 1 open app -> Step 8 purchase summary with savings vs Supplier A.
"""
from __future__ import annotations

import pytest


@pytest.fixture(scope="module")
def potatoes(client, product_ids):
    return product_ids["Potatoes"]


class TestKillerFlow:
    def test_step_1_login(self, client):
        response = client.post(
            "/api/auth/login", json={"email": "dilshod@priceradar.uz", "password": "demo1234"}
        )
        assert response.status_code == 200
        assert response.json()["user"]["full_name"] == "Dilshod Karimov"

    def test_step_2_search_potatoes(self, client):
        body = client.get("/api/products", params={"search": "potato"}).json()
        assert body["total"] == 1
        assert body["items"][0]["name"] == "Potatoes"

    def test_step_3_and_4_compare_100kg(self, client, potatoes):
        body = client.post(
            "/api/recommendations/compare", json={"product_id": potatoes, "quantity": 100}
        ).json()
        assert body["product"]["name"] == "Potatoes"
        assert body["quantity"] == 100
        assert body["unit"] == "kg"
        assert len(body["offers"]) == 4
        assert body["eligible_count"] == 3
        assert body["rejected_count"] == 1

    def test_step_4_exact_demo_values(self, client, potatoes):
        body = client.post(
            "/api/recommendations/compare", json={"product_id": potatoes, "quantity": 100}
        ).json()
        by_supplier = {o["supplier_name"]: o for o in body["offers"]}

        supplier_a = by_supplier["Tashkent Agro Trade"]
        supplier_b = by_supplier["Fergana Fresh Produce"]
        supplier_c = by_supplier["Bukhara Farm Direct"]

        assert (supplier_a["unit_price"], supplier_a["delivery_cost"], supplier_a["total_cost"]) == (
            4000,
            50_000,
            450_000,
        )
        assert (supplier_b["unit_price"], supplier_b["delivery_cost"], supplier_b["total_cost"]) == (
            3500,
            50_000,
            400_000,
        )
        assert (supplier_c["unit_price"], supplier_c["delivery_cost"], supplier_c["total_cost"]) == (
            4200,
            0,
            420_000,
        )

        # the out-of-stock supplier is never ranked as a recommendation
        unavailable = by_supplier["Namangan Food Supply"]
        assert unavailable["eligible"] is False
        assert unavailable["status"] == "out_of_stock"
        assert unavailable["rank"] is None

    def test_step_5_recommends_supplier_b(self, client, potatoes):
        body = client.post(
            "/api/recommendations/compare", json={"product_id": potatoes, "quantity": 100}
        ).json()
        assert body["recommended"]["supplier_name"] == "Fergana Fresh Produce"
        assert body["recommended"]["total_cost"] == 400_000
        assert body["offers"][0]["supplier_name"] == "Fergana Fresh Produce"
        assert body["offers"][0]["rank"] == 1
        assert body["offers"][1]["total_cost"] == 420_000
        assert body["offers"][2]["total_cost"] == 450_000

    def test_step_6_explanation_is_clear(self, client, potatoes):
        body = client.post(
            "/api/recommendations/compare", json={"product_id": potatoes, "quantity": 100}
        ).json()
        explanation = body["explanation"]
        assert "Fergana Fresh Produce" in explanation
        assert "400 000 UZS" in explanation
        assert "saves 50 000 UZS" in explanation  # savings vs the most expensive eligible option
        assert "free delivery" in explanation.lower()  # Supplier C explained
        assert "420 000 UZS" in explanation  # Supplier C total
        assert "450 000 UZS" in explanation  # Supplier A total

    def test_step_7_contact_supplier_details(self, client, potatoes):
        body = client.post(
            "/api/recommendations/compare", json={"product_id": potatoes, "quantity": 100}
        ).json()
        recommended = body["recommended"]
        assert recommended["phone"].startswith("+998")
        assert recommended["location"] == "Fergana"
        assert recommended["delivery_days"] >= 1

    def test_step_8_purchase_summary_and_savings(self, client, potatoes):
        body = client.post(
            "/api/recommendations/compare", json={"product_id": potatoes, "quantity": 100}
        ).json()
        supplier_a_total = 450_000
        assert body["recommended"]["total_cost"] == 400_000
        assert supplier_a_total - body["recommended"]["total_cost"] == 50_000
        assert body["highest_eligible_total"] == supplier_a_total
        assert body["potential_savings"] == 50_000
        assert body["data_source"] == "demo"
        assert "fictional" in body["disclaimer"]

    def test_save_recommended_offer_then_verify(self, client, auth_headers, potatoes):
        comparison = client.post(
            "/api/recommendations/compare", json={"product_id": potatoes, "quantity": 100}
        ).json()
        offer_id = comparison["recommended"]["offer_id"]

        for saved in client.get("/api/saved-offers", headers=auth_headers).json():
            client.delete(f"/api/saved-offers/{saved['id']}", headers=auth_headers)

        created = client.post("/api/saved-offers", json={"offer_id": offer_id}, headers=auth_headers)
        assert created.status_code == 201
        listed = client.get("/api/saved-offers", headers=auth_headers).json()
        assert listed[0]["offer_id"] == offer_id

    def test_quantity_below_every_minimum_returns_no_recommendation(self, client, potatoes):
        body = client.post(
            "/api/recommendations/compare", json={"product_id": potatoes, "quantity": 10}
        ).json()
        by_supplier = {o["supplier_name"]: o for o in body["offers"]}
        assert by_supplier["Fergana Fresh Produce"]["eligible"] is False
        assert "Minimum order" in by_supplier["Fergana Fresh Produce"]["reason"]
        # every potato offer has a minimum of 20 kg or more
        assert body["recommended"] is None
        assert body["eligible_count"] == 0

    def test_quantity_above_one_minimum_but_below_others(self, client, potatoes):
        body = client.post(
            "/api/recommendations/compare", json={"product_id": potatoes, "quantity": 25}
        ).json()
        by_supplier = {o["supplier_name"]: o for o in body["offers"]}
        # Bukhara (20 kg minimum, free delivery) is the only eligible supplier at 25 kg
        assert by_supplier["Bukhara Farm Direct"]["eligible"] is True
        assert by_supplier["Tashkent Agro Trade"]["eligible"] is False
        assert body["recommended"]["supplier_name"] == "Bukhara Farm Direct"
        assert body["recommended"]["total_cost"] == 4200 * 25
        assert body["eligible_count"] == 1

    def test_quantity_beyond_stock_is_rejected(self, client, potatoes):
        body = client.post(
            "/api/recommendations/compare", json={"product_id": potatoes, "quantity": 5000}
        ).json()
        assert body["recommended"] is None
        assert body["eligible_count"] == 0
        assert "No supplier" in body["explanation"]

    def test_compare_invalid_quantity(self, client, potatoes):
        assert (
            client.post(
                "/api/recommendations/compare", json={"product_id": potatoes, "quantity": 0}
            ).status_code
            == 422
        )

    def test_compare_unknown_product(self, client):
        assert (
            client.post(
                "/api/recommendations/compare", json={"product_id": 99999, "quantity": 100}
            ).status_code
            == 404
        )

    def test_compare_missing_fields(self, client):
        assert client.post("/api/recommendations/compare", json={}).status_code == 422
