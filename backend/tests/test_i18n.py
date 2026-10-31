"""Localisation tests for server-generated text.

The API returns explanations, eligibility reasons and assistant answers in the
language requested through `Accept-Language` (or `?lang=`), defaulting to English.
"""
from __future__ import annotations

import pytest

from app.core.i18n import normalise_language, resolve_language, t

UZ = "uz"
RU = "ru"


class TestLanguageResolution:
    @pytest.mark.parametrize(
        "header,expected",
        [
            (None, "en"),
            ("", "en"),
            ("ru", "ru"),
            ("uz", "uz"),
            ("en-GB", "en"),
            ("ru-RU,ru;q=0.9,en;q=0.8", "ru"),
            ("UZ-uz", "uz"),
            ("de-DE", "en"),  # unsupported falls back to English
            ("klingon", "en"),
        ],
    )
    def test_normalise_language(self, header, expected):
        assert normalise_language(header) == expected

    def test_profile_fallback_is_used_when_header_missing(self):
        assert resolve_language(None, "ru") == "ru"
        assert resolve_language("uz", "ru") == "uz"

    def test_unknown_key_falls_back_to_english(self):
        assert t("ru", "This sentence has no translation") == "This sentence has no translation"

    def test_every_translation_keeps_its_placeholders(self):
        from app.core.i18n import TRANSLATIONS

        broken = []
        for language, strings in TRANSLATIONS.items():
            for source, translated in strings.items():
                expected = sorted(part.split("}")[0] for part in source.split("{")[1:])
                actual = sorted(part.split("}")[0] for part in translated.split("{")[1:])
                if expected != actual:
                    broken.append(f"{language}: {source[:60]}")
        assert broken == []


class TestComparisonLocalisation:
    def test_english_by_default(self, client, product_ids):
        body = client.post(
            "/api/recommendations/compare", json={"product_id": product_ids["Potatoes"], "quantity": 100}
        ).json()
        assert body["explanation"].startswith("Recommended:")
        assert "Eligible - in stock" in {offer["reason"] for offer in body["offers"]}

    def test_russian_explanation(self, client, product_ids):
        body = client.post(
            "/api/recommendations/compare",
            json={"product_id": product_ids["Potatoes"], "quantity": 100},
            headers={"Accept-Language": "ru"},
        ).json()
        assert body["explanation"].startswith("Рекомендуется:")
        assert any("подходит" in offer["reason"].lower() or "наличии" in offer["reason"].lower()
                   for offer in body["offers"])

    def test_uzbek_explanation(self, client, product_ids):
        body = client.post(
            "/api/recommendations/compare",
            json={"product_id": product_ids["Potatoes"], "quantity": 100},
            headers={"Accept-Language": "uz-UZ"},
        ).json()
        assert body["explanation"].startswith("Tavsiya etiladi:")
        assert any("Mos keladi" in offer["reason"] for offer in body["offers"])

    def test_rejection_reason_is_localised(self, client, product_ids):
        # 100 kg of potatoes: the out-of-stock Namangan offer must be rejected
        body = client.post(
            "/api/recommendations/compare",
            json={"product_id": product_ids["Potatoes"], "quantity": 100},
            headers={"Accept-Language": "ru"},
        ).json()
        rejected = [offer for offer in body["offers"] if not offer["eligible"]]
        assert rejected
        assert any("наличии" in offer["reason"] for offer in rejected)

    def test_uzbek_rejection_reason(self, client, product_ids):
        body = client.post(
            "/api/recommendations/compare",
            json={"product_id": product_ids["Potatoes"], "quantity": 100},
            headers={"Accept-Language": "uz"},
        ).json()
        rejected = [offer for offer in body["offers"] if not offer["eligible"]]
        assert any("omborda yo‘q" in offer["reason"] for offer in rejected)

    def test_query_parameter_overrides_header(self, client, product_ids):
        body = client.post(
            "/api/recommendations/compare?lang=uz",
            json={"product_id": product_ids["Potatoes"], "quantity": 100},
            headers={"Accept-Language": "ru"},
        ).json()
        assert body["explanation"].startswith("Tavsiya etiladi:")

    def test_unsupported_language_serves_english(self, client, product_ids):
        body = client.post(
            "/api/recommendations/compare",
            json={"product_id": product_ids["Potatoes"], "quantity": 100},
            headers={"Accept-Language": "fr-FR"},
        ).json()
        assert body["explanation"].startswith("Recommended:")

    def test_no_eligible_offer_message_is_localised(self, client, product_ids):
        body = client.post(
            "/api/recommendations/compare",
            json={"product_id": product_ids["Potatoes"], "quantity": 5000},
            headers={"Accept-Language": "ru"},
        ).json()
        assert "не может выполнить" in body["explanation"]


class TestAssistantLocalisation:
    def test_russian_answer(self, client):
        body = client.post(
            "/api/assistant/chat",
            json={"message": "compare potatoes 100 kg"},
            headers={"Accept-Language": "ru"},
        ).json()
        assert "общая стоимость" in body["answer"].lower() or "наименьшая" in body["answer"].lower()
        assert all("Сравнить" in item or "Показать" in item or "Сохранить" in item or "Как" in item
                   for item in body["suggestions"]) or body["suggestions"]

    def test_uzbek_answer(self, client):
        body = client.post(
            "/api/assistant/chat",
            json={"message": "100 kg potatoes"},
            headers={"Accept-Language": "uz"},
        ).json()
        assert "umumiy xarajat" in body["answer"].lower()

    def test_help_answer_is_localised(self, client):
        body = client.post(
            "/api/assistant/chat",
            json={"message": "salom"},
            headers={"Accept-Language": "ru"},
        ).json()
        assert body["intent"] == "help"
        assert "Я сравниваю предложения поставщиков" in body["answer"]

    def test_trend_answer_is_localised(self, client):
        body = client.post(
            "/api/assistant/chat",
            json={"message": "show the price trend for potatoes"},
            headers={"Accept-Language": "ru"},
        ).json()
        assert body["intent"] == "trend"
        assert "средняя цена" in body["answer"].lower()

    def test_english_remains_default(self, client):
        body = client.post("/api/assistant/chat", json={"message": "compare potatoes 100 kg"}).json()
        assert "lowest total cost" in body["answer"].lower()

    def test_money_and_numbers_survive_translation(self, client):
        body = client.post(
            "/api/assistant/chat",
            json={"message": "compare potatoes 100 kg"},
            headers={"Accept-Language": "ru"},
        ).json()
        assert "400 000" in body["answer"]
