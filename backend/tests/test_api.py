"""API integration tests: auth, catalog, analytics, saved offers, assistant."""
from __future__ import annotations

import pytest


class TestHealth:
    def test_health(self, client):
        response = client.get("/api/health")
        assert response.status_code == 200
        assert response.json()["status"] == "ok"

    def test_openapi_schema_available(self, client):
        response = client.get("/openapi.json")
        assert response.status_code == 200
        paths = response.json()["paths"]
        for path in [
            "/api/auth/register",
            "/api/auth/login",
            "/api/auth/me",
            "/api/products",
            "/api/products/{product_id}",
            "/api/products/{product_id}/offers",
            "/api/suppliers",
            "/api/suppliers/{supplier_id}",
            "/api/offers",
            "/api/offers/{offer_id}",
            "/api/analytics/overview",
            "/api/analytics/price-history/{product_id}",
            "/api/saved-offers",
            "/api/saved-offers/{saved_id}",
            "/api/recommendations/compare",
        ]:
            assert path in paths, f"{path} missing from OpenAPI schema"


class TestAuth:
    def test_login_demo_account(self, client):
        response = client.post(
            "/api/auth/login", json={"email": "dilshod@priceradar.uz", "password": "demo1234"}
        )
        assert response.status_code == 200
        body = response.json()
        assert body["token_type"] == "bearer"
        assert body["access_token"]
        assert body["user"]["email"] == "dilshod@priceradar.uz"
        assert "hashed_password" not in body["user"]

    def test_login_wrong_password(self, client):
        response = client.post(
            "/api/auth/login", json={"email": "dilshod@priceradar.uz", "password": "wrongpass1"}
        )
        assert response.status_code == 401
        assert "incorrect" in response.json()["detail"].lower()

    def test_login_unknown_email(self, client):
        response = client.post(
            "/api/auth/login", json={"email": "nobody@example.com", "password": "whatever1"}
        )
        assert response.status_code == 401

    def test_login_validation_error_is_readable(self, client):
        response = client.post("/api/auth/login", json={"email": "not-an-email", "password": "x"})
        assert response.status_code == 422
        assert response.json()["detail"]

    def test_register_and_use_token(self, client):
        response = client.post(
            "/api/auth/register",
            json={
                "full_name": "QA Tester",
                "email": "qa.tester@example.com",
                "password": "supersecure1",
                "business_name": "QA Shop",
            },
        )
        assert response.status_code == 201, response.text
        token = response.json()["access_token"]
        me = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert me.status_code == 200
        assert me.json()["email"] == "qa.tester@example.com"

    def test_register_duplicate_email(self, client):
        payload = {"full_name": "Dup User", "email": "dup@example.com", "password": "supersecure1"}
        assert client.post("/api/auth/register", json=payload).status_code == 201
        second = client.post("/api/auth/register", json=payload)
        assert second.status_code == 409
        assert "already exists" in second.json()["detail"].lower()

    def test_register_short_password_rejected(self, client):
        response = client.post(
            "/api/auth/register",
            json={"full_name": "Short Pass", "email": "short@example.com", "password": "abc"},
        )
        assert response.status_code == 422

    @pytest.mark.parametrize("path", ["/api/auth/me", "/api/saved-offers"])
    def test_protected_endpoints_require_token(self, client, path):
        assert client.get(path).status_code == 401

    def test_invalid_token_rejected(self, client):
        response = client.get("/api/auth/me", headers={"Authorization": "Bearer not.a.real.token"})
        assert response.status_code == 401

    def test_update_profile(self, client, auth_headers):
        response = client.patch(
            "/api/auth/me",
            json={"business_name": "Updated Business", "language": "ru", "notify_new_offers": True},
            headers=auth_headers,
        )
        assert response.status_code == 200
        assert response.json()["business_name"] == "Updated Business"
        assert response.json()["language"] == "ru"
        assert response.json()["notify_new_offers"] is True

        restored = client.patch(
            "/api/auth/me",
            json={"business_name": "Dilshod Grocery Market", "language": "en", "notify_new_offers": False},
            headers=auth_headers,
        )
        assert restored.status_code == 200

    def test_invalid_language_rejected(self, client, auth_headers):
        response = client.patch("/api/auth/me", json={"language": "fr"}, headers=auth_headers)
        assert response.status_code == 422

    def test_change_password_flow(self, client):
        email = "password.change@example.com"
        registered = client.post(
            "/api/auth/register",
            json={"full_name": "Password Changer", "email": email, "password": "oldpassword1"},
        )
        headers = {"Authorization": f"Bearer {registered.json()['access_token']}"}

        wrong = client.post(
            "/api/auth/me/password",
            json={"current_password": "nope", "new_password": "newpassword1"},
            headers=headers,
        )
        assert wrong.status_code == 400

        changed = client.post(
            "/api/auth/me/password",
            json={"current_password": "oldpassword1", "new_password": "newpassword1"},
            headers=headers,
        )
        assert changed.status_code == 200

        assert client.post("/api/auth/login", json={"email": email, "password": "oldpassword1"}).status_code == 401
        assert client.post("/api/auth/login", json={"email": email, "password": "newpassword1"}).status_code == 200


class TestProducts:
    def test_list_products(self, client):
        response = client.get("/api/products")
        assert response.status_code == 200
        body = response.json()
        assert body["total"] == 8
        assert len(body["items"]) == 8
        names = {item["name"] for item in body["items"]}
        assert {"Potatoes", "Tomatoes", "Onions", "Rice", "Flour", "Cooking oil", "Sugar", "Eggs"} == names

    def test_product_aggregates(self, client, product_ids):
        product = client.get(f"/api/products/{product_ids['Potatoes']}").json()
        assert product["min_price"] == 3300
        assert product["max_price"] == 4200
        assert product["offer_count"] == 4
        assert product["available_supplier_count"] == 3
        assert product["availability"] == "in_stock"

    def test_search_products(self, client):
        body = client.get("/api/products", params={"search": "pot"}).json()
        assert body["total"] == 1
        assert body["items"][0]["name"] == "Potatoes"

    def test_search_no_results(self, client):
        body = client.get("/api/products", params={"search": "zzzz"}).json()
        assert body["total"] == 0
        assert body["items"] == []

    def test_filter_by_category(self, client):
        body = client.get("/api/products", params={"category": "Vegetables"}).json()
        assert body["total"] == 3

    def test_sort_by_price(self, client):
        body = client.get("/api/products", params={"sort": "price_asc", "page_size": 100}).json()
        prices = [item["avg_price"] for item in body["items"]]
        assert prices == sorted(prices)

    def test_invalid_sort_rejected(self, client):
        assert client.get("/api/products", params={"sort": "bogus"}).status_code == 422

    def test_pagination(self, client):
        page_one = client.get("/api/products", params={"page": 1, "page_size": 3}).json()
        page_two = client.get("/api/products", params={"page": 2, "page_size": 3}).json()
        assert len(page_one["items"]) == 3
        assert page_one["pages"] == 3
        assert {i["id"] for i in page_one["items"]}.isdisjoint({i["id"] for i in page_two["items"]})

    def test_invalid_page_rejected(self, client):
        assert client.get("/api/products", params={"page": 0}).status_code == 422

    def test_product_not_found(self, client):
        assert client.get("/api/products/99999").status_code == 404

    def test_product_offers_with_quantity_totals(self, client, product_ids):
        offers = client.get(
            f"/api/products/{product_ids['Potatoes']}/offers", params={"quantity": 100, "sort": "total"}
        ).json()
        assert len(offers) == 4
        eligible = [o for o in offers if o["eligible"]]
        assert len(eligible) == 3
        assert min(o["total_cost"] for o in eligible) == 400_000
        assert offers[0]["total_cost"] == 400_000

    def test_product_offers_invalid_quantity(self, client, product_ids):
        assert (
            client.get(f"/api/products/{product_ids['Potatoes']}/offers", params={"quantity": 0}).status_code
            == 422
        )

    def test_categories_endpoint(self, client):
        categories = client.get("/api/products/categories").json()
        assert len(categories) >= 5
        assert all("category" in c and "avg_price" in c for c in categories)


class TestSuppliers:
    def test_list_suppliers(self, client):
        body = client.get("/api/suppliers").json()
        assert body["total"] == 6
        assert body["items"][0]["rating"] >= body["items"][-1]["rating"]

    def test_supplier_detail(self, client):
        first = client.get("/api/suppliers").json()["items"][0]
        detail = client.get(f"/api/suppliers/{first['id']}").json()
        assert detail["id"] == first["id"]
        assert isinstance(detail["categories"], list)
        assert detail["phone"].startswith("+998")

    def test_supplier_not_found(self, client):
        assert client.get("/api/suppliers/99999").status_code == 404

    def test_filter_verified(self, client):
        body = client.get("/api/suppliers", params={"verified": True}).json()
        assert body["total"] >= 1
        assert all(item["is_verified"] for item in body["items"])

    def test_search_suppliers(self, client):
        body = client.get("/api/suppliers", params={"search": "tashkent"}).json()
        assert body["total"] >= 1

    def test_supplier_offers(self, client):
        supplier = client.get("/api/suppliers").json()["items"][0]
        offers = client.get(f"/api/suppliers/{supplier['id']}/offers").json()
        assert len(offers) == supplier["offer_count"]
        assert all(o["supplier_id"] == supplier["id"] for o in offers)

    def test_locations(self, client):
        locations = client.get("/api/suppliers/locations").json()
        assert "Tashkent" in locations


class TestOffers:
    def test_list_offers(self, client):
        body = client.get("/api/offers", params={"page_size": 100}).json()
        assert body["total"] == 28

    def test_filter_offers_by_product(self, client, product_ids):
        body = client.get("/api/offers", params={"product_id": product_ids["Potatoes"]}).json()
        assert body["total"] == 4

    def test_filter_offers_by_status(self, client):
        body = client.get("/api/offers", params={"status": "out_of_stock", "page_size": 100}).json()
        assert body["total"] >= 1
        assert all(o["status"] == "out_of_stock" for o in body["items"])

    def test_offer_detail(self, client):
        offer = client.get("/api/offers").json()["items"][0]
        detail = client.get(f"/api/offers/{offer['id']}").json()
        assert detail["id"] == offer["id"]
        assert detail["product"] is not None and detail["supplier"] is not None

    def test_offer_detail_with_quantity(self, client):
        offer = client.get("/api/offers").json()["items"][0]
        detail = client.get(f"/api/offers/{offer['id']}", params={"quantity": 10}).json()
        assert detail["total_cost"] == offer["unit_price"] * 10 + offer["delivery_cost"]
        assert detail["cost_per_unit"] == round(detail["total_cost"] / 10, 2)

    def test_offer_not_found(self, client):
        assert client.get("/api/offers/99999").status_code == 404

    def test_create_offer_requires_auth(self, client, product_ids):
        payload = {
            "product_id": product_ids["Potatoes"],
            "supplier_id": 1,
            "unit_price": 3900,
            "delivery_cost": 10000,
            "minimum_order_quantity": 10,
            "available_quantity": 100,
        }
        assert client.post("/api/offers", json=payload).status_code == 401

    def test_create_offer_validation(self, client, auth_headers, product_ids):
        response = client.post(
            "/api/offers",
            json={
                "product_id": product_ids["Potatoes"],
                "supplier_id": 1,
                "unit_price": -5,
                "delivery_cost": 0,
                "minimum_order_quantity": 1,
                "available_quantity": 10,
            },
            headers=auth_headers,
        )
        assert response.status_code == 422

    def test_create_offer_duplicate_conflict(self, client, auth_headers, product_ids):
        response = client.post(
            "/api/offers",
            json={
                "product_id": product_ids["Potatoes"],
                "supplier_id": 1,
                "unit_price": 3900,
                "delivery_cost": 10000,
                "minimum_order_quantity": 10,
                "available_quantity": 100,
            },
            headers=auth_headers,
        )
        assert response.status_code == 409

    def test_create_and_read_new_offer(self, client, auth_headers):
        products = client.get("/api/products").json()["items"]
        suppliers = client.get("/api/suppliers").json()["items"]
        existing = {
            (o["product_id"], o["supplier_id"])
            for o in client.get("/api/offers", params={"page_size": 100}).json()["items"]
        }
        pair = next(
            (p["id"], s["id"])
            for p in products
            for s in suppliers
            if (p["id"], s["id"]) not in existing
        )
        response = client.post(
            "/api/offers",
            json={
                "product_id": pair[0],
                "supplier_id": pair[1],
                "unit_price": 5000,
                "delivery_cost": 20000,
                "minimum_order_quantity": 5,
                "available_quantity": 200,
                "status": "in_stock",
            },
            headers=auth_headers,
        )
        assert response.status_code == 201, response.text
        created = response.json()
        assert created["unit_price"] == 5000
        assert created["is_demo"] is False
        detail = client.get(f"/api/offers/{created['id']}").json()
        assert detail["id"] == created["id"]
        # price history is recorded on creation
        history = client.get(f"/api/analytics/price-history/{pair[0]}").json()
        assert history["points"]


class TestAnalytics:
    def test_overview(self, client):
        body = client.get("/api/analytics/overview").json()
        assert body["total_products"] == 8
        assert body["active_suppliers"] == 6
        assert body["total_offers"] >= 28
        assert body["avg_market_price"] > 0
        assert body["potential_savings"] > 0
        assert 0 <= body["savings_pct"] <= 100
        assert len(body["price_changes"]) > 0
        assert len(body["trend"]) > 0
        assert len(body["top_categories"]) > 0
        assert len(body["recent_offers"]) > 0
        dataset = client.get("/api/dataset/status").json()
        assert body["data_source"] == dataset["data_source"]
        assert body["disclaimer"] == dataset["disclaimer"]

    def test_overview_trend_has_dates_and_prices(self, client):
        trend = client.get("/api/analytics/overview").json()["trend"]
        assert all(t["date"] and t["avg_price"] > 0 for t in trend)

    def test_price_history(self, client, product_ids):
        body = client.get(f"/api/analytics/price-history/{product_ids['Potatoes']}").json()
        assert body["product_name"] == "Potatoes"
        assert len(body["points"]) == 90
        assert len(body["supplier_series"]) == 4
        assert body["min_price"] <= body["max_price"]
        assert body["change_pct"] is not None

    def test_price_history_day_filter(self, client, product_ids):
        body = client.get(
            f"/api/analytics/price-history/{product_ids['Potatoes']}", params={"days": 7}
        ).json()
        assert body["days"] == 7
        assert 6 <= len(body["points"]) <= 8

    def test_price_history_invalid_days(self, client, product_ids):
        response = client.get(
            f"/api/analytics/price-history/{product_ids['Potatoes']}", params={"days": 1}
        )
        assert response.status_code == 422

    def test_price_history_unknown_product(self, client):
        assert client.get("/api/analytics/price-history/99999").status_code == 404

    def test_market(self, client):
        body = client.get("/api/analytics/market").json()
        assert body["supply"]["total_offers"] >= 28
        assert body["suppliers"]["total_suppliers"] == 6
        assert body["suppliers"]["verified_suppliers"] >= 1
        assert len(body["categories"]) >= 5
        assert len(body["demand"]) >= 5
        assert all(d["supply_status"] in {"healthy", "tight", "constrained"} for d in body["demand"])

    def test_categories_endpoint_matches_products(self, client):
        categories = client.get("/api/analytics/categories").json()
        assert sum(c["product_count"] for c in categories) == 8


class TestSavedOffers:
    def test_save_list_and_delete(self, client, auth_headers, product_ids):
        # clean slate for this user
        for saved in client.get("/api/saved-offers", headers=auth_headers).json():
            client.delete(f"/api/saved-offers/{saved['id']}", headers=auth_headers)

        offer = client.get(f"/api/products/{product_ids['Potatoes']}/offers").json()[0]
        created = client.post(
            "/api/saved-offers", json={"offer_id": offer["id"]}, headers=auth_headers
        )
        assert created.status_code == 201, created.text
        saved = created.json()
        assert saved["offer"]["id"] == offer["id"]
        assert saved["price_at_save"] == offer["unit_price"]
        assert saved["price_change"] == 0

        listed = client.get("/api/saved-offers", headers=auth_headers).json()
        assert len(listed) == 1

        duplicate = client.post("/api/saved-offers", json={"offer_id": offer["id"]}, headers=auth_headers)
        assert duplicate.status_code == 409

        deleted = client.delete(f"/api/saved-offers/{saved['id']}", headers=auth_headers)
        assert deleted.status_code == 204
        assert client.get("/api/saved-offers", headers=auth_headers).json() == []

    def test_save_unknown_offer(self, client, auth_headers):
        response = client.post("/api/saved-offers", json={"offer_id": 99999}, headers=auth_headers)
        assert response.status_code == 404

    def test_delete_unknown_saved_offer(self, client, auth_headers):
        assert client.delete("/api/saved-offers/99999", headers=auth_headers).status_code == 404

    def test_saved_offers_are_per_user(self, client, auth_headers, product_ids):
        offer_id = client.get(f"/api/products/{product_ids['Rice']}/offers").json()[0]["id"]
        assert client.post("/api/saved-offers", json={"offer_id": offer_id}, headers=auth_headers).status_code == 201

        other = client.post(
            "/api/auth/register",
            json={"full_name": "Other User", "email": "other.saved@example.com", "password": "supersecure1"},
        ).json()
        other_headers = {"Authorization": f"Bearer {other['access_token']}"}
        assert client.get("/api/saved-offers", headers=other_headers).json() == []

        for saved in client.get("/api/saved-offers", headers=auth_headers).json():
            client.delete(f"/api/saved-offers/{saved['id']}", headers=auth_headers)

    def test_cannot_delete_another_users_saved_offer(self, client, auth_headers, product_ids):
        offer_id = client.get(f"/api/products/{product_ids['Sugar']}/offers").json()[0]["id"]
        saved = client.post("/api/saved-offers", json={"offer_id": offer_id}, headers=auth_headers).json()
        other = client.post(
            "/api/auth/login", json={"email": "other.saved@example.com", "password": "supersecure1"}
        ).json()
        other_headers = {"Authorization": f"Bearer {other['access_token']}"}
        assert client.delete(f"/api/saved-offers/{saved['id']}", headers=other_headers).status_code == 404
        client.delete(f"/api/saved-offers/{saved['id']}", headers=auth_headers)


class TestAssistant:
    def test_compare_question(self, client):
        response = client.post(
            "/api/assistant/chat", json={"message": "Compare potatoes for 100 kg"}
        )
        assert response.status_code == 200
        body = response.json()
        assert body["engine"] == "rule-based"
        assert "Supplier" in body["answer"] or "Fergana" in body["answer"]
        assert body["referenced_offers"]
        assert "No external AI model" in body["disclaimer"]

    def test_trend_question(self, client):
        body = client.post(
            "/api/assistant/chat", json={"message": "Show me the price trend for potatoes"}
        ).json()
        assert body["intent"] == "trend"
        assert "last 30 days" in body["answer"]

    def test_help_when_no_product(self, client):
        body = client.post("/api/assistant/chat", json={"message": "hello"}).json()
        assert body["intent"] == "help"
        assert "Potatoes" in body["answer"]

    def test_assistant_validates_input(self, client):
        assert client.post("/api/assistant/chat", json={"message": ""}).status_code == 422

    def test_assistant_respects_product_id(self, client, product_ids):
        body = client.post(
            "/api/assistant/chat",
            json={"message": "What is the cheapest option?", "product_id": product_ids["Rice"], "quantity": 100},
        ).json()
        assert "Rice" in body["answer"]
