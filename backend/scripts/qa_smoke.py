"""Live API smoke suite for PriceRadar.

Runs against a running server and checks every documented endpoint, the
authentication rules, the total-cost formula and the Killer Flow values.

Usage:
    python backend/scripts/qa_smoke.py [base_url]

Exit code 0 = all checks passed.
"""
from __future__ import annotations

import sys
import uuid

import httpx

BASE_URL = sys.argv[1].rstrip("/") if len(sys.argv) > 1 else "http://127.0.0.1:8000"
API = f"{BASE_URL}/api"

results: list[tuple[str, bool, str]] = []


def check(name: str, condition: bool, detail: str = "") -> None:
    results.append((name, bool(condition), detail))
    status = "PASS" if condition else "FAIL"
    print(f"[{status}] {name}" + (f" — {detail}" if detail and not condition else ""))


def section(title: str) -> None:
    print(f"\n=== {title} ===")


def main() -> int:
    client = httpx.Client(timeout=30, follow_redirects=True)
    run_id = uuid.uuid4().hex[:8]

    section("System")
    r = client.get(f"{API}/health")
    check("GET /api/health returns ok", r.status_code == 200 and r.json()["status"] == "ok", r.text)
    r = client.get(f"{BASE_URL}/openapi.json")
    paths = r.json().get("paths", {})
    required = [
        "/api/auth/register", "/api/auth/login", "/api/auth/me",
        "/api/products", "/api/products/{product_id}", "/api/products/{product_id}/offers",
        "/api/suppliers", "/api/suppliers/{supplier_id}",
        "/api/offers", "/api/offers/{offer_id}",
        "/api/analytics/overview", "/api/analytics/price-history/{product_id}",
        "/api/saved-offers", "/api/saved-offers/{saved_id}",
        "/api/recommendations/compare",
    ]
    missing = [p for p in required if p not in paths]
    check("OpenAPI documents every required endpoint", not missing, f"missing: {missing}")
    check("Swagger UI is served", client.get(f"{BASE_URL}/docs").status_code == 200)

    section("CORS")
    for origin in ("http://localhost:5173", "https://abc123.e2b.app"):
        r = client.options(
            f"{API}/products",
            headers={
                "Origin": origin,
                "Access-Control-Request-Method": "GET",
                "Access-Control-Request-Headers": "authorization",
            },
        )
        allowed = r.headers.get("access-control-allow-origin")
        check(f"CORS preflight allowed for {origin}", r.status_code in (200, 204) and allowed in (origin, "*"), f"{r.status_code} {allowed}")
    r = client.get(f"{API}/products", headers={"Origin": "http://evil.example.com"})
    check(
        "Unknown origin is not granted CORS access",
        r.headers.get("access-control-allow-origin") != "http://evil.example.com",
    )

    section("Authentication")
    email = f"qa.{run_id}@example.com"
    password = "supersecure1"
    r = client.post(f"{API}/auth/register", json={"full_name": "QA Smoke", "email": email, "password": password, "business_name": "QA Shop"})
    check("POST /api/auth/register returns 201 + token", r.status_code == 201 and r.json().get("access_token"), r.text)
    token = r.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    r = client.post(f"{API}/auth/register", json={"full_name": "QA Smoke", "email": email, "password": password})
    check("Duplicate registration returns 409", r.status_code == 409)
    r = client.post(f"{API}/auth/register", json={"full_name": "X", "email": "bad-email", "password": "short"})
    check("Registration validation returns 422", r.status_code == 422)

    r = client.post(f"{API}/auth/login", json={"email": email, "password": password})
    check("POST /api/auth/login succeeds", r.status_code == 200 and r.json()["user"]["email"] == email)
    r = client.post(f"{API}/auth/login", json={"email": email, "password": "wrongpassword"})
    check("Login with wrong password returns 401", r.status_code == 401)
    r = client.post(f"{API}/auth/login", json={"email": "nobody@example.com", "password": "wrongpassword"})
    check("Login with unknown email returns 401", r.status_code == 401)

    r = client.get(f"{API}/auth/me", headers=headers)
    check("GET /api/auth/me returns the profile", r.status_code == 200 and r.json()["full_name"] == "QA Smoke")
    check("GET /api/auth/me leaks no password hash", "hashed_password" not in r.text)
    check("GET /api/auth/me without token returns 401", client.get(f"{API}/auth/me").status_code == 401)
    check("GET /api/auth/me with garbage token returns 401", client.get(f"{API}/auth/me", headers={"Authorization": "Bearer nope"}).status_code == 401)

    r = client.patch(f"{API}/auth/me", headers=headers, json={"business_name": "QA Shop 2", "language": "uz", "notify_new_offers": True})
    check("PATCH /api/auth/me updates profile", r.status_code == 200 and r.json()["business_name"] == "QA Shop 2" and r.json()["language"] == "uz", r.text)
    r = client.patch(f"{API}/auth/me", headers=headers, json={"language": "klingon"})
    check("PATCH /api/auth/me rejects invalid language", r.status_code == 422)
    r = client.post(f"{API}/auth/me/password", headers=headers, json={"current_password": "wrong", "new_password": "newpassword1"})
    check("Password change with wrong current password returns 400", r.status_code == 400)
    r = client.post(f"{API}/auth/me/password", headers=headers, json={"current_password": password, "new_password": "newpassword1"})
    check("Password change succeeds", r.status_code == 200)
    check("New password works", client.post(f"{API}/auth/login", json={"email": email, "password": "newpassword1"}).status_code == 200)
    check("Old password no longer works", client.post(f"{API}/auth/login", json={"email": email, "password": password}).status_code == 401)

    section("Products")
    r = client.get(f"{API}/products")
    body = r.json()
    check("GET /api/products returns 8 seeded products", r.status_code == 200 and body["total"] == 8, str(body.get("total")))
    names = {item["name"] for item in body["items"]}
    expected = {"Potatoes", "Tomatoes", "Onions", "Rice", "Flour", "Cooking oil", "Sugar", "Eggs"}
    check("Every specified product exists", expected <= names, str(names))
    check("Products expose demo flag", all(item["is_demo"] for item in body["items"]))
    potatoes = next(item for item in body["items"] if item["name"] == "Potatoes")

    r = client.get(f"{API}/products", params={"search": "potato"})
    check("Product search filters results", r.json()["total"] == 1 and r.json()["items"][0]["name"] == "Potatoes")
    r = client.get(f"{API}/products", params={"search": "zzzzz"})
    check("Empty product search returns empty page", r.json()["total"] == 0 and r.json()["items"] == [])
    r = client.get(f"{API}/products", params={"category": "Vegetables"})
    check("Category filter works", r.json()["total"] == 3)
    r = client.get(f"{API}/products", params={"sort": "price_asc", "page_size": 100})
    prices = [item["avg_price"] for item in r.json()["items"]]
    check("Price sorting is ascending", prices == sorted(prices))
    r = client.get(f"{API}/products", params={"sort": "nonsense"})
    check("Invalid sort value returns 422", r.status_code == 422)
    r = client.get(f"{API}/products", params={"page": 1, "page_size": 3})
    first_ids = {item["id"] for item in r.json()["items"]}
    r2 = client.get(f"{API}/products", params={"page": 2, "page_size": 3})
    check("Pagination splits unique pages", r.json()["pages"] == 3 and first_ids.isdisjoint({i["id"] for i in r2.json()["items"]}))
    check("Page below 1 returns 422", client.get(f"{API}/products", params={"page": 0}).status_code == 422)
    check("Unknown product returns 404", client.get(f"{API}/products/99999").status_code == 404)

    r = client.get(f"{API}/products/{potatoes['id']}")
    prod = r.json()
    check("Product detail includes aggregates", r.status_code == 200 and prod["offer_count"] == 4 and prod["avg_price"] and prod["availability"] == "in_stock", r.text)
    r = client.get(f"{API}/products/{potatoes['id']}/offers", params={"quantity": 100, "sort": "total"})
    offers = r.json()
    check("Product offers endpoint returns 4 offers", r.status_code == 200 and len(offers) == 4)
    cheapest = min((o for o in offers if o["eligible"]), key=lambda o: o["total_cost"])
    check("Product offers compute total cost", cheapest["total_cost"] == 400_000, str(cheapest["total_cost"]))
    check("Product offers reject invalid quantity", client.get(f"{API}/products/{potatoes['id']}/offers", params={"quantity": 0}).status_code == 422)
    r = client.get(f"{API}/products/{potatoes['id']}/price-history", params={"days": 90})
    hist = r.json()
    check("Price history returns 90 daily points and 4 suppliers", r.status_code == 200 and len(hist["points"]) == 90 and len(hist["supplier_series"]) == 4, f"{len(hist.get('points', []))}")
    check("Price history rejects days=1", client.get(f"{API}/products/{potatoes['id']}/price-history", params={"days": 1}).status_code == 422)
    check("Categories endpoint returns categories", len(client.get(f"{API}/products/categories").json()) >= 5)

    section("Suppliers")
    r = client.get(f"{API}/suppliers", params={"page_size": 50})
    suppliers = r.json()
    check("GET /api/suppliers returns 6 suppliers", r.status_code == 200 and suppliers["total"] == 6, str(suppliers.get("total")))
    check("Suppliers are sorted by rating", [s["rating"] for s in suppliers["items"]] == sorted([s["rating"] for s in suppliers["items"]], reverse=True))
    check("Supplier contact details present", all(s["phone"].startswith("+998") for s in suppliers["items"]))
    verified = client.get(f"{API}/suppliers", params={"verified": True}).json()["items"]
    check("Verified filter works", len(verified) >= 1 and all(s["is_verified"] for s in verified))
    check("Supplier search works", client.get(f"{API}/suppliers", params={"search": "tashkent"}).json()["total"] >= 1)
    check("Supplier locations endpoint works", "Tashkent" in client.get(f"{API}/suppliers/locations").json())
    first_supplier = suppliers["items"][0]
    r = client.get(f"{API}/suppliers/{first_supplier['id']}")
    check("Supplier detail includes categories + counts", r.status_code == 200 and isinstance(r.json()["categories"], list) and r.json()["offer_count"] > 0)
    check("Unknown supplier returns 404", client.get(f"{API}/suppliers/99999").status_code == 404)
    r = client.get(f"{API}/suppliers/{first_supplier['id']}/offers")
    check("Supplier offers list matches offer_count", len(r.json()) == first_supplier["offer_count"])

    section("Offers")
    r = client.get(f"{API}/offers", params={"page_size": 100})
    all_offers = r.json()
    check("GET /api/offers lists all offers", r.status_code == 200 and all_offers["total"] >= 28)
    check("Offers include product and supplier", all(o["product"] and o["supplier"] for o in all_offers["items"]))
    r = client.get(f"{API}/offers", params={"product_id": potatoes["id"]})
    check("Offer filter by product works", r.json()["total"] == 4)
    r = client.get(f"{API}/offers", params={"status": "out_of_stock", "page_size": 100})
    check("Offer filter by status works", r.json()["total"] >= 1 and all(o["status"] == "out_of_stock" for o in r.json()["items"]))
    sample = all_offers["items"][0]
    r = client.get(f"{API}/offers/{sample['id']}", params={"quantity": 10})
    check("Offer detail computes cost at quantity", r.status_code == 200 and r.json()["total_cost"] == sample["unit_price"] * 10 + sample["delivery_cost"], r.text)
    check("Unknown offer returns 404", client.get(f"{API}/offers/99999").status_code == 404)

    payload = {
        "product_id": potatoes["id"],
        "supplier_id": first_supplier["id"],
        "unit_price": 3900,
        "delivery_cost": 10_000,
        "minimum_order_quantity": 10,
        "available_quantity": 100,
    }
    check("POST /api/offers requires authentication", client.post(f"{API}/offers", json=payload).status_code == 401)
    headers2 = {"Authorization": f"Bearer {client.post(f'{API}/auth/login', json={'email': email, 'password': 'newpassword1'}).json()['access_token']}"}
    check("POST /api/offers rejects invalid prices", client.post(f"{API}/offers", json={**payload, "unit_price": -1}, headers=headers2).status_code == 422)
    check("POST /api/offers rejects unknown product", client.post(f"{API}/offers", json={**payload, "product_id": 99999}, headers=headers2).status_code == 404)
    r = client.post(f"{API}/offers", json=payload, headers=headers2)
    duplicate_detail = r.json().get("detail")
    check("POST /api/offers rejects duplicate supplier/product pair", r.status_code == 409, f"{r.status_code} {duplicate_detail}")

    # create for a pair that does not exist yet
    existing = {(o["product_id"], o["supplier_id"]) for o in all_offers["items"]}
    pair = next(
        ((p["id"], s["id"]) for p in client.get(f"{API}/products").json()["items"] for s in suppliers["items"] if (p["id"], s["id"]) not in existing),
        None,
    )
    if pair:
        r = client.post(f"{API}/offers", json={**payload, "product_id": pair[0], "supplier_id": pair[1]}, headers=headers2)
        check("POST /api/offers creates an offer", r.status_code == 201 and r.json()["is_demo"] is False, r.text)

    section("Analytics")
    r = client.get(f"{API}/analytics/overview")
    ov = r.json()
    check("GET /api/analytics/overview returns KPIs", r.status_code == 200 and ov["total_products"] == 8 and ov["active_suppliers"] >= 5)
    check("Overview includes trend series", len(ov["trend"]) > 0 and all(p["avg_price"] > 0 for p in ov["trend"]))
    check("Overview includes price changes", len(ov["price_changes"]) > 0)
    check("Overview includes categories and recent offers", len(ov["top_categories"]) > 0 and len(ov["recent_offers"]) > 0)
    dataset = client.get(f"{API}/dataset/status").json()
    check(
        "Overview reports the real provenance of its numbers",
        ov["data_source"] == dataset["data_source"] and bool(ov["disclaimer"]),
        f'{ov["data_source"]} vs {dataset["data_source"]}',
    )
    check("Overview potential savings is positive", ov["potential_savings"] > 0)
    r = client.get(f"{API}/analytics/price-history/{potatoes['id']}", params={"days": 30})
    check("GET /api/analytics/price-history works", r.status_code == 200 and 28 <= len(r.json()["points"]) <= 32)
    check("Price history for unknown product returns 404", client.get(f"{API}/analytics/price-history/99999").status_code == 404)
    r = client.get(f"{API}/analytics/market", params={"days": 60})
    market = r.json()
    check("GET /api/analytics/market returns supply stats", r.status_code == 200 and market["supply"]["total_offers"] >= 28)
    check("Market returns supplier mix", market["suppliers"]["total_suppliers"] == 6)
    check("Market returns demand indicators", len(market["demand"]) >= 5 and all(d["supply_status"] in {"healthy", "tight", "constrained"} for d in market["demand"]))
    cats = client.get(f"{API}/analytics/categories").json()
    check("Category breakdown covers every product", sum(c["product_count"] for c in cats) == 8)

    section("Saved offers")
    check("GET /api/saved-offers requires auth", client.get(f"{API}/saved-offers").status_code == 401)
    check("POST /api/saved-offers requires auth", client.post(f"{API}/saved-offers", json={"offer_id": offers[0]["id"]}).status_code == 401)
    mine = client.get(f"{API}/saved-offers", headers=headers2).json()
    check("New user starts with no saved offers", mine == [])
    r = client.post(f"{API}/saved-offers", json={"offer_id": offers[0]["id"]}, headers=headers2)
    check("POST /api/saved-offers saves an offer", r.status_code == 201 and r.json()["offer"]["id"] == offers[0]["id"], r.text)
    saved_id = r.json()["id"]
    check("Saved offer records price at save time", r.json()["price_at_save"] == offers[0]["unit_price"])
    check("Duplicate save returns 409", client.post(f"{API}/saved-offers", json={"offer_id": offers[0]["id"]}, headers=headers2).status_code == 409)
    check("Saving unknown offer returns 404", client.post(f"{API}/saved-offers", json={"offer_id": 99999}, headers=headers2).status_code == 404)
    listed = client.get(f"{API}/saved-offers", headers=headers2).json()
    check("GET /api/saved-offers lists the saved offer", len(listed) == 1 and listed[0]["id"] == saved_id)
    r = client.delete(f"{API}/saved-offers/{saved_id}", headers=headers2)
    check("DELETE /api/saved-offers/{id} returns 204", r.status_code == 204)
    check("Deleted saved offer is gone", client.get(f"{API}/saved-offers", headers=headers2).json() == [])
    check("Deleting a non-existent saved offer returns 404", client.delete(f"{API}/saved-offers/{saved_id}", headers=headers2).status_code == 404)

    section("Recommendation engine / Killer Flow")
    r = client.post(f"{API}/recommendations/compare", json={"product_id": potatoes["id"], "quantity": 100})
    cmp = r.json()
    check("POST /api/recommendations/compare works", r.status_code == 200 and cmp["quantity"] == 100 and cmp["unit"] == "kg")
    by_supplier = {o["supplier_name"]: o for o in cmp["offers"]}
    a, b, c = by_supplier["Tashkent Agro Trade"], by_supplier["Fergana Fresh Produce"], by_supplier["Bukhara Farm Direct"]
    check("Supplier A total = 450 000", (a["unit_price"], a["delivery_cost"], a["total_cost"]) == (4000, 50_000, 450_000))
    check("Supplier B total = 400 000", (b["unit_price"], b["delivery_cost"], b["total_cost"]) == (3500, 50_000, 400_000))
    check("Supplier C total = 420 000", (c["unit_price"], c["delivery_cost"], c["total_cost"]) == (4200, 0, 420_000))
    check("Supplier B is recommended", cmp["recommended"]["supplier_name"] == "Fergana Fresh Produce" and cmp["recommended"]["total_cost"] == 400_000)
    check("Ranking is by total cost", [o["supplier_name"] for o in cmp["offers"][:3]] == ["Fergana Fresh Produce", "Bukhara Farm Direct", "Tashkent Agro Trade"])
    check("Savings vs most expensive eligible = 50 000", cmp["potential_savings"] == 50_000 and cmp["highest_eligible_total"] == 450_000)
    check("Out-of-stock supplier is not recommended", by_supplier["Namangan Food Supply"]["eligible"] is False and by_supplier["Namangan Food Supply"]["rank"] is None)
    check("Explanation names the winner and the saving", "Fergana Fresh Produce" in cmp["explanation"] and "50 000 UZS" in cmp["explanation"])
    check("Cost per delivered kg is provided", cmp["recommended"]["cost_per_unit"] == 4000.0)
    check("Recommendation states where its prices come from", cmp["data_source"] in {"demo", "mixed", "real"} and bool(cmp["disclaimer"]))
    check("Every eligible offer satisfies the formula", all(
        o["total_cost"] == o["unit_price"] * 100 + o["delivery_cost"] for o in cmp["offers"] if o["eligible"]
    ))
    check("Eligible offers respect MOQ and stock", all(
        o["quantity"] >= o["minimum_order_quantity"] and o["quantity"] <= o["available_quantity"] for o in cmp["offers"] if o["eligible"]
    ))

    low = client.post(f"{API}/recommendations/compare", json={"product_id": potatoes["id"], "quantity": 10}).json()
    check("Quantity below all minimums yields no recommendation", low["recommended"] is None and low["eligible_count"] == 0)
    big = client.post(f"{API}/recommendations/compare", json={"product_id": potatoes["id"], "quantity": 5000}).json()
    check("Quantity above stock yields no recommendation", big["recommended"] is None)
    edge = client.post(f"{API}/recommendations/compare", json={"product_id": potatoes["id"], "quantity": 20}).json()
    check("Exactly-at-MOQ quantity is eligible", edge["recommended"] is not None and edge["recommended"]["total_cost"] == 4200 * 20)
    check("Zero quantity returns 422", client.post(f"{API}/recommendations/compare", json={"product_id": potatoes["id"], "quantity": 0}).status_code == 422)
    check("Negative quantity returns 422", client.post(f"{API}/recommendations/compare", json={"product_id": potatoes["id"], "quantity": -5}).status_code == 422)
    check("Missing fields return 422", client.post(f"{API}/recommendations/compare", json={}).status_code == 422)
    check("Unknown product returns 404", client.post(f"{API}/recommendations/compare", json={"product_id": 99999, "quantity": 10}).status_code == 404)

    # formula invariant across every product / offer / quantity
    problems = []
    for product in client.get(f"{API}/products", params={"page_size": 100}).json()["items"]:
        for quantity in (1, 7.5, 25, 100, 250):
            data = client.post(f"{API}/recommendations/compare", json={"product_id": product["id"], "quantity": quantity}).json()
            for offer in data["offers"]:
                expected = round(offer["unit_price"] * quantity) + offer["delivery_cost"]
                if offer["total_cost"] != expected:
                    problems.append((product["name"], quantity, offer["supplier_name"], offer["total_cost"], expected))
                if offer["eligible"] and offer["status"] == "out_of_stock":
                    problems.append((product["name"], quantity, offer["supplier_name"], "out-of-stock ranked"))
    check("Total cost formula holds for every product and quantity", not problems, str(problems[:3]))

    section("Assistant")
    r = client.post(f"{API}/assistant/chat", json={"message": "Compare potatoes for 100 kg"})
    reply = r.json()
    check("POST /api/assistant/chat answers", r.status_code == 200 and "Fergana Fresh Produce" in reply["answer"], r.text[:200])
    check("Assistant declares its engine", reply["engine"] == "rule-based" and "No external AI model" in reply["disclaimer"])
    check("Assistant returns referenced offers", len(reply["referenced_offers"]) > 0)
    check("Assistant handles trend questions", client.post(f"{API}/assistant/chat", json={"message": "price trend for potatoes"}).json()["intent"] == "trend")
    check("Assistant handles unknown products gracefully", client.post(f"{API}/assistant/chat", json={"message": "hello"}).json()["intent"] == "help")
    check("Assistant validates empty message", client.post(f"{API}/assistant/chat", json={"message": ""}).status_code == 422)

    section("Real data import")
    before = client.get(f"{API}/dataset/status").json()
    check("GET /api/dataset/status is public", before["offers_total"] > 0 and before["data_source"] in {"demo", "mixed", "real"})
    check(
        "Dataset status counts add up",
        before["offers_total"] == before["offers_real"] + before["offers_demo"]
        and before["products_total"] == before["products_real"] + before["products_demo"],
    )
    tpl = client.get(f"{API}/import/template")
    check("GET /api/import/template returns a CSV", tpl.status_code == 200 and "unit_price" in tpl.text and "text/csv" in tpl.headers.get("content-type", ""))
    check(
        "Price import requires authentication",
        client.post(f"{API}/import/prices", files={"file": ("p.csv", b"product,supplier,unit_price\n")}).status_code == 401,
    )

    headers = {"Authorization": f"Bearer {token}"}
    csv_rows = (
        "product,supplier,unit_price,delivery_cost,minimum_order_quantity,available_quantity,status,category,unit,phone,location\n"
        f"Smoke Melon {run_id},Smoke Supplier {run_id},4200,12000,10,300,in_stock,Fruits,kg,+998 90 123 45 67,Tashkent\n"
        f"Smoke Melon {run_id},Smoke Supplier {run_id},bad,12000,10,300,in_stock,Fruits,kg,+998 90 123 45 67,Tashkent\n"
    )
    dry = client.post(
        f"{API}/import/prices?dry_run=true",
        files={"file": ("smoke.csv", csv_rows.encode(), "text/csv")},
        headers=headers,
    )
    dry_body = dry.json()
    check("Dry-run import validates rows without saving", dry.status_code == 200 and dry_body["rows_valid"] == 1 and dry_body["rows_failed"] == 1, dry.text[:200])
    check("Dry-run reports the bad line", any(error["row"] == 3 for error in dry_body["errors"]))
    check(
        "Dry-run writes nothing",
        client.get(f"{API}/dataset/status").json()["offers_real"] == before["offers_real"],
    )
    real = client.post(
        f"{API}/import/prices",
        files={"file": ("smoke.csv", csv_rows.encode(), "text/csv")},
        headers=headers,
    ).json()
    check("Real import creates one price", real["offers_created"] == 1 and real["products_created"] == 1 and real["suppliers_created"] == 1, str(real))
    after = client.get(f"{API}/dataset/status").json()
    check("Dataset becomes mixed or real after an import", after["offers_real"] == before["offers_real"] + 1 and after["data_source"] in {"mixed", "real"})
    melon = client.get(f"{API}/products", params={"search": f"Smoke Melon {run_id}"}).json()["items"][0]
    check("Imported product is not demo data", melon["is_demo"] is False)
    melon_cmp = client.post(f"{API}/recommendations/compare", json={"product_id": melon["id"], "quantity": 20}).json()
    check("Imported price is ranked by total cost", melon_cmp["recommended"]["total_cost"] == 4200 * 20 + 12000 and melon_cmp["data_source"] == "real")
    bad_columns = client.post(
        f"{API}/import/prices",
        files={"file": ("bad.csv", b"product,narx\nPotato,3900\n", "text/csv")},
        headers=headers,
    )
    check("Import rejects a file without the required columns", bad_columns.status_code == 422 and "unit_price" in bad_columns.text)
    check(
        "Import rejects non-CSV uploads",
        client.post(f"{API}/import/prices", files={"file": ("p.xlsx", b"PK", "application/vnd.ms-excel")}, headers=headers).status_code == 415,
    )

    section("Assistant in Uzbek and Russian")
    check(
        "Assistant understands an Uzbek product name",
        client.post(f"{API}/assistant/chat", json={"message": "100 kg kartoshka"}).json()["intent"] == "compare",
    )
    check(
        "Assistant understands a Russian product name",
        client.post(f"{API}/assistant/chat", json={"message": "100 кг картофеля"}).json()["intent"] == "compare",
    )
    check(
        "Assistant answers in the requested language",
        "Kartoshka" in client.post(
            f"{API}/assistant/chat", json={"message": "100 kg kartoshka"}, headers={"Accept-Language": "uz"}
        ).json()["answer"],
    )

    section("Summary")
    passed = sum(1 for _, ok, _ in results if ok)
    failed = [(name, detail) for name, ok, detail in results if not ok]
    print(f"{passed}/{len(results)} checks passed")
    if failed:
        print("\nFailures:")
        for name, detail in failed:
            print(f" - {name}: {detail}")
        return 1
    print("All API checks passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
