"""Record real API responses as frontend test fixtures.

The UI tests replay these payloads so that components are validated against the
exact shapes the backend produces. Run this after changing any response schema:

    uvicorn app.main:app --port 8000          # terminal 1
    python backend/scripts/record_fixtures.py # terminal 2
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

import httpx

BASE_URL = sys.argv[1].rstrip("/") if len(sys.argv) > 1 else "http://127.0.0.1:8000"
API = f"{BASE_URL}/api"
OUTPUT = Path(__file__).resolve().parents[2] / "frontend" / "src" / "test" / "fixtures" / "api.json"

DEMO_EMAIL = "dilshod@priceradar.uz"
DEMO_PASSWORD = "demo1234"


def main() -> int:
    client = httpx.Client(timeout=30)
    try:
        login = client.post(f"{API}/auth/login", json={"email": DEMO_EMAIL, "password": DEMO_PASSWORD}).json()
    except httpx.HTTPError as error:
        print(f"Could not reach the API at {API}: {error}")
        return 1

    token = login["access_token"]
    auth = {"Authorization": f"Bearer {token}"}

    def get(path: str, **kwargs) -> object:
        response = client.get(f"{API}{path}", headers=auth, **kwargs)
        response.raise_for_status()
        return response.json()

    def post(path: str, payload: dict) -> object:
        response = client.post(f"{API}{path}", json=payload, headers=auth)
        response.raise_for_status()
        return response.json()

    # make sure the demo account has two saved offers for the saved-offers fixtures
    saved = get("/saved-offers")
    if len(saved) < 2:
        offers = get("/products/1/offers")
        existing = {item["offer_id"] for item in saved}
        for offer in offers:
            if len(saved) >= 2:
                break
            if offer["id"] not in existing:
                post("/saved-offers", {"offer_id": offer["id"]})
                saved = get("/saved-offers")

    fixtures = {
        "login": login,
        "me": login["user"],
        "products": get("/products", params={"search": "potato"}),
        "products_all": get("/products", params={"page_size": 100}),
        "product": get("/products/1"),
        "categories": get("/products/categories"),
        "compare_100": post("/recommendations/compare", {"product_id": 1, "quantity": 100}),
        "compare_25": post("/recommendations/compare", {"product_id": 1, "quantity": 25}),
        "compare_10": post("/recommendations/compare", {"product_id": 1, "quantity": 10}),
        "overview": get("/analytics/overview"),
        "market": get("/analytics/market", params={"days": 30}),
        "history": get("/analytics/price-history/1", params={"days": 90}),
        "suppliers": get("/suppliers", params={"page_size": 9}),
        "supplier": get("/suppliers/1"),
        "supplier_offers": get("/suppliers/1/offers"),
        "locations": get("/suppliers/locations"),
        "offers": get("/offers", params={"page_size": 100}),
        "saved": saved,
        "assistant": post("/assistant/chat", {"message": "Compare potatoes for 100 kg"}),
    }

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(fixtures, indent=1))
    print(f"Wrote {len(fixtures)} fixtures to {OUTPUT.relative_to(Path.cwd()) if OUTPUT.is_relative_to(Path.cwd()) else OUTPUT}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
