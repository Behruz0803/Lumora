"""Tests for real-data features: catalogue management, CSV import, dataset status
and the multilingual assistant.

These cover the workflow a buyer actually follows when moving PriceRadar from
demo data to real supplier price lists.
"""
from __future__ import annotations

from io import BytesIO

import pytest


def _csv(rows: str) -> bytes:
    return rows.strip().encode("utf-8")


HEADER = (
    "product,supplier,unit_price,delivery_cost,minimum_order_quantity,"
    "available_quantity,status,category,unit,phone,location\n"
)


class TestDatasetStatus:
    def test_status_requires_no_auth_and_reports_counts(self, client):
        response = client.get("/api/dataset/status")
        assert response.status_code == 200
        body = response.json()
        assert body["data_source"] in {"demo", "mixed", "real"}
        assert body["products_total"] >= 8
        assert body["offers_total"] == body["offers_real"] + body["offers_demo"]
        assert body["has_real_data"] is (body["offers_real"] > 0)
        assert body["disclaimer"]

    def test_status_is_localised(self, client):
        body = client.get("/api/dataset/status", headers={"Accept-Language": "ru"}).json()
        # The Russian disclaimer must not fall back to the English sentence.
        assert "Демо" in body["disclaimer"] or "реальн" in body["disclaimer"].lower()


class TestCatalogueManagement:
    def test_create_product_marks_it_real(self, client, auth_headers):
        response = client.post(
            "/api/products",
            json={"name": "Muscat grapes", "category": "Fruits", "unit": "kg"},
            headers=auth_headers,
        )
        assert response.status_code == 201, response.text
        body = response.json()
        assert body["is_demo"] is False
        assert body["name"] == "Muscat grapes"

        # duplicate names are rejected
        again = client.post(
            "/api/products",
            json={"name": "muscat grapes", "category": "Fruits", "unit": "kg"},
            headers=auth_headers,
        )
        assert again.status_code == 409

    def test_product_management_requires_auth(self, client):
        assert client.post("/api/products", json={"name": "X", "category": "Y", "unit": "kg"}).status_code == 401

    def test_create_supplier_and_patch_it(self, client, auth_headers):
        created = client.post(
            "/api/suppliers",
            json={
                "name": "Samarkand Silk Road Traders",
                "phone": "+998 66 123 45 67",
                "location": "Samarkand",
                "categories": ["Vegetables", "Grains"],
                "delivery_days": 2,
            },
            headers=auth_headers,
        )
        assert created.status_code == 201, created.text
        supplier = created.json()
        assert supplier["is_demo"] is False
        assert supplier["categories"] == ["Vegetables", "Grains"]

        updated = client.patch(
            f"/api/suppliers/{supplier['id']}",
            json={"delivery_days": 4, "is_verified": True},
            headers=auth_headers,
        )
        assert updated.status_code == 200, updated.text
        assert updated.json()["delivery_days"] == 4
        assert updated.json()["is_verified"] is True

    def test_supplier_phone_is_validated(self, client, auth_headers):
        response = client.post(
            "/api/suppliers",
            json={"name": "Bad Phone Ltd", "phone": "abc", "location": "Tashkent"},
            headers=auth_headers,
        )
        assert response.status_code == 422

    def test_demo_rows_cannot_be_deleted(self, client, auth_headers, product_ids):
        response = client.delete(f"/api/products/{product_ids['Potatoes']}", headers=auth_headers)
        assert response.status_code == 409
        assert "demo" in response.json()["detail"].lower()


class TestCsvImport:
    def test_template_download(self, client):
        response = client.get("/api/import/template")
        assert response.status_code == 200
        assert response.headers["content-type"].startswith("text/csv")
        assert "unit_price" in response.text

    def test_import_requires_auth(self, client):
        response = client.post(
            "/api/import/prices",
            files={"file": ("p.csv", _csv(HEADER + "Potatoes,Shop,3900,0,1,10\n"), "text/csv")},
        )
        assert response.status_code == 401

    def test_dry_run_writes_nothing(self, client, auth_headers):
        before = client.get("/api/dataset/status").json()["offers_real"]
        response = client.post(
            "/api/import/prices",
            params={"dry_run": True},
            files={
                "file": (
                    "dry.csv",
                    _csv(
                        HEADER
                        + "Dried apricots,Test Supplier,25000,15000,10,500,in_stock,Fruits,kg,"
                        "+998 90 000 11 22,Tashkent\n"
                    ),
                    "text/csv",
                )
            },
            headers=auth_headers,
        )
        assert response.status_code == 200, response.text
        body = response.json()
        assert body["dry_run"] is True
        assert body["rows_valid"] == 1
        assert body["offers_created"] == 1
        assert client.get("/api/dataset/status").json()["offers_real"] == before

        # the product created in the dry run must not exist afterwards
        listing = client.get("/api/products", params={"search": "Dried apricots"}).json()
        assert listing["total"] == 0

    def test_import_creates_real_offers_and_updates_existing_rows(self, client, auth_headers):
        csv_body = (
            HEADER
            + "Dried apricots,Test Wholesale,25000,15000,10,500,in_stock,Fruits,kg,"
            "+998 90 000 11 22,Tashkent\n"
            + "Dried apricots,Test Wholesale,24000,15000,10,500,in_stock,Fruits,kg,"
            "+998 90 000 11 22,Tashkent\n"
        )
        response = client.post(
            "/api/import/prices",
            files={"file": ("real.csv", _csv(csv_body), "text/csv")},
            headers=auth_headers,
        )
        assert response.status_code == 200, response.text
        body = response.json()
        assert body["rows_valid"] == 2
        assert body["offers_created"] == 1
        assert body["offers_updated"] == 1  # the second row updates the first
        assert body["dataset"]["offers_real"] >= 1

        product = client.get("/api/products", params={"search": "Dried apricots"}).json()["items"][0]
        offers = client.get(f"/api/products/{product['id']}/offers").json()
        assert offers[0]["unit_price"] == 24000  # last row wins
        assert offers[0]["is_demo"] is False

        # the imported product now compares with total cost, not demo data
        comparison = client.post(
            "/api/recommendations/compare",
            json={"product_id": product["id"], "quantity": 20},
            headers=auth_headers,
        ).json()
        assert comparison["data_source"] == "real"
        assert comparison["recommended"]["total_cost"] == 24000 * 20 + 15000

    def test_row_errors_are_reported_per_line(self, client, auth_headers):
        csv_body = (
            HEADER
            + "Apples,Fruit Farm,5000,0,1,100,in_stock,Fruits,kg,+998 90 111 22 33,Tashkent\n"
            + "Apples,Fruit Farm,,0,1,100,in_stock,Fruits,kg,+998 90 111 22 33,Tashkent\n"
            + "Apples,Fruit Farm,5000,0,0,100,in_stock,Fruits,kg,+998 90 111 22 33,Tashkent\n"
            + "Apples,Fruit Farm,5000,0,1,100,expired,Fruits,kg,+998 90 111 22 33,Tashkent\n"
        )
        response = client.post(
            "/api/import/prices",
            files={"file": ("mixed.csv", _csv(csv_body), "text/csv")},
            headers=auth_headers,
        )
        assert response.status_code == 200, response.text
        body = response.json()
        assert body["rows_received"] == 4
        assert body["rows_valid"] == 1
        assert body["rows_failed"] == 3
        rows = {error["row"] for error in body["errors"]}
        assert rows == {3, 4, 5}
        fields = {error["field"] for error in body["errors"]}
        assert {"unit_price", "minimum_order_quantity", "status"} <= fields

    def test_missing_required_column_is_rejected(self, client, auth_headers):
        response = client.post(
            "/api/import/prices",
            files={"file": ("bad.csv", b"product,narx\nPotatoes,3900\n", "text/csv")},
            headers=auth_headers,
        )
        assert response.status_code == 422
        assert "unit_price" in response.json()["detail"]

    def test_non_csv_upload_is_rejected(self, client, auth_headers):
        response = client.post(
            "/api/import/prices",
            files={"file": ("price.xlsx", BytesIO(b"PK\x03\x04"), "application/vnd.ms-excel")},
            headers=auth_headers,
        )
        assert response.status_code == 415

    def test_uzbek_and_russian_headers_are_accepted(self, client, auth_headers):
        csv_body = (
            "mahsulot,taminotchi,narx,yetkazish,minimal_partiya,mavjud,holat\n"
            "Qovun,Test Bozor,4200,10000,5,200,in_stock\n"
        )
        response = client.post(
            "/api/import/prices",
            files={"file": ("uz.csv", _csv(csv_body), "text/csv")},
            headers=auth_headers,
        )
        assert response.status_code == 200, response.text
        assert response.json()["rows_valid"] == 1

    def test_empty_file_is_rejected(self, client, auth_headers):
        response = client.post(
            "/api/import/prices",
            files={"file": ("empty.csv", b"   ", "text/csv")},
            headers=auth_headers,
        )
        assert response.status_code == 422


class TestMultilingualAssistant:
    @pytest.mark.parametrize(
        "message,language,expect_intent",
        [
            ("100 kg potatoes", "en", "compare"),
            ("100 kg kartoshka", "uz", "compare"),
            ("kartoshkadan 100 kg olsam bo'ladimi", "uz", "compare"),
            ("100 кг картофеля", "ru", "compare"),
            ("Сравни помидоры, 100 кг", "ru", "compare"),
            ("piyoz 20 kg", "uz", "compare"),
            ("мука 30 кг", "ru", "compare"),
        ],
    )
    def test_assistant_understands_all_three_languages(
        self, client, auth_headers, message, language, expect_intent
    ):
        response = client.post(
            "/api/assistant/chat",
            json={"message": message},
            headers={**auth_headers, "Accept-Language": language},
        )
        assert response.status_code == 200, response.text
        assert response.json()["intent"] == expect_intent

    def test_unknown_word_still_returns_help(self, client, auth_headers):
        body = client.post(
            "/api/assistant/chat", json={"message": "salom, qalaysan"}, headers=auth_headers
        ).json()
        assert body["intent"] == "help"

    def test_help_response_lists_catalogue_in_the_active_language(self, client, auth_headers):
        body = client.post(
            "/api/assistant/chat",
            json={"message": "salom"},
            headers={**auth_headers, "Accept-Language": "uz"},
        ).json()
        assert "Kartoshka" in body["answer"]
        assert "Potatoes" not in body["answer"]

    def test_product_id_from_the_ui_still_wins(self, client, auth_headers, product_ids):
        body = client.post(
            "/api/assistant/chat",
            json={"message": "100 kg", "product_id": product_ids["Potatoes"], "quantity": 100},
            headers={**auth_headers, "Accept-Language": "uz"},
        ).json()
        assert body["intent"] == "compare"
        assert "400 000" in body["answer"]
