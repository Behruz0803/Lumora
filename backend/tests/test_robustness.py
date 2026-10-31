"""Regression tests for API robustness and error-handling defects.

Each test pins a defect found during QA so it cannot silently return:
  - custom validators must return 422 (not 500 + dropped connection)
  - non-finite numbers in a payload must not crash the error handler
  - unauthenticated/method/limit edges must stay controlled
"""
from __future__ import annotations

import pytest


def post_raw(client, path: str, raw: bytes):
    return client.post(path, content=raw, headers={"Content-Type": "application/json"})


class TestValidationErrorHandling:
    """A validation error must always serialize into a 422 response."""

    def test_whitespace_only_full_name_returns_422(self, client):
        response = client.post(
            "/api/auth/register",
            json={"full_name": "   ", "email": "blank.name@example.com", "password": "supersecure1"},
        )
        assert response.status_code == 422, response.text
        body = response.json()
        assert "full name" in body["detail"].lower()
        # the raw Pydantic context must not leak a Python exception repr
        assert "ValueError" not in response.text

    def test_error_payload_keeps_field_location(self, client):
        response = client.post(
            "/api/auth/register",
            json={"full_name": "   ", "email": "blank.name2@example.com", "password": "supersecure1"},
        )
        errors = response.json()["errors"]
        assert errors[0]["loc"] == ["body", "full_name"]
        assert errors[0]["type"] == "value_error"

    def test_invalid_offer_status_returns_422(self, client, auth_headers, product_ids):
        response = client.post(
            "/api/offers",
            json={
                "product_id": product_ids["Potatoes"],
                "supplier_id": 1,
                "unit_price": 4000,
                "delivery_cost": 1000,
                "minimum_order_quantity": 1,
                "available_quantity": 10,
                "status": "pending",
            },
            headers=auth_headers,
        )
        assert response.status_code == 422, response.text
        assert "status" in response.json()["detail"].lower()

    def test_infinite_quantity_returns_422_not_500(self, client, product_ids):
        raw = f'{{"product_id": {product_ids["Potatoes"]}, "quantity": 1e400}}'.encode()
        response = post_raw(client, "/api/recommendations/compare", raw)
        assert response.status_code == 422, response.text

    def test_nan_like_quantity_returns_422_not_500(self, client, product_ids):
        raw = f'{{"product_id": {product_ids["Potatoes"]}, "quantity": NaN}}'.encode()
        response = post_raw(client, "/api/recommendations/compare", raw)
        assert response.status_code == 422, response.text

    def test_infinite_product_id_returns_controlled_status(self, client):
        raw = b'{"product_id": 1e400, "quantity": 100}'
        response = post_raw(client, "/api/recommendations/compare", raw)
        assert response.status_code in (404, 422), response.text

    def test_malformed_json_returns_422(self, client):
        response = post_raw(client, "/api/recommendations/compare", b"{not json")
        assert response.status_code == 422

    def test_assistant_rejects_blank_message(self, client):
        response = client.post("/api/assistant/chat", json={"message": "   "})
        assert response.status_code == 422, response.text
        assert "message" in response.json()["detail"].lower()

    def test_assistant_trims_message(self, client):
        body = client.post("/api/assistant/chat", json={"message": "  hello  "}).json()
        assert body["intent"] == "help"

    def test_server_still_healthy_after_bad_payloads(self, client):
        post_raw(client, "/api/recommendations/compare", b'{"quantity": 1e400}')
        post_raw(client, "/api/assistant/chat", b'{"message": null}')
        assert client.get("/api/health").json()["status"] == "ok"


class TestAuthEdgeCases:
    @pytest.mark.parametrize("password", ["a" * 128, "pässwörd123", "with space 1"])
    def test_supported_password_shapes_register_and_login(self, client, password):
        email = f"shape.{abs(hash(password))}@example.com"
        registered = client.post(
            "/api/auth/register", json={"full_name": "Shape User", "email": email, "password": password}
        )
        assert registered.status_code == 201, registered.text
        assert client.post("/api/auth/login", json={"email": email, "password": password}).status_code == 200

    def test_password_longer_than_128_chars_rejected(self, client):
        response = client.post(
            "/api/auth/register",
            json={"full_name": "Too Long", "email": "toolong@example.com", "password": "a" * 129},
        )
        assert response.status_code == 422

    def test_long_password_is_not_truncated(self, client):
        password = "x" * 128
        client.post(
            "/api/auth/register",
            json={"full_name": "Trunc Test", "email": "trunc@example.com", "password": password},
        )
        # a password sharing the first 72 bytes but differing later must not work
        assert client.post("/api/auth/login", json={"email": "trunc@example.com", "password": "x" * 127 + "y"}).status_code == 401

    @pytest.mark.parametrize(
        "token",
        [
            "not.a.jwt",
            "eyJhbGciOiJub25lIn0.eyJzdWIiOiIxIn0.",  # alg=none, no signature
            "",
        ],
    )
    def test_bad_tokens_rejected(self, client, token):
        response = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == 401

    def test_basic_auth_scheme_rejected(self, client):
        assert client.get("/api/auth/me", headers={"Authorization": "Basic abc"}).status_code == 401


class TestRequestLimits:
    @pytest.mark.parametrize(
        "params",
        [
            {"search": "x" * 101},
            {"page_size": 101},
            {"page_size": 0},
            {"page": 0},
            {"availability": "maybe"},
            {"sort": "bogus"},
        ],
    )
    def test_invalid_product_query_returns_422(self, client, params):
        assert client.get("/api/products", params=params).status_code == 422

    def test_non_numeric_path_id_returns_422(self, client):
        assert client.get("/api/products/abc").status_code == 422

    def test_unknown_method_returns_405(self, client):
        assert client.put("/api/products").status_code == 405
        # Deleting a product is now a real (authenticated) endpoint, so it must
        # answer 401 without a token instead of 405.
        assert client.delete("/api/products/1").status_code == 401
        assert client.delete("/api/analytics/overview").status_code == 405

    def test_search_injection_attempt_is_safe(self, client):
        before = client.get("/api/products").json()["total"]
        response = client.get("/api/products", params={"search": "'; DROP TABLE products;--"})
        assert response.status_code == 200
        assert response.json()["total"] == 0
        # table still there, and nothing was deleted
        assert client.get("/api/products").json()["total"] == before
