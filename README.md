# PriceRadar

**Know the market. Buy smarter. Save more.**

PriceRadar is a B2B market-intelligence and price-comparison platform for grocery stores,
restaurants, retailers, wholesalers and small businesses in Uzbekistan.

It does **not** simply show the lowest unit price. For every order it calculates the
**total purchasing cost** — unit price × quantity **plus delivery** — and it never
recommends an offer that cannot fulfil the requested quantity.

> **All prices, suppliers, ratings and trends in this project are fictional demo data.**
> The UI, API responses and the assistant all label this explicitly. Nothing here is real
> market research.

---

## 1. What is included

| Area | Delivered |
| --- | --- |
| Authentication | Register, login, JWT bearer auth, profile update, password change, demo account |
| Dashboard | KPIs, 30-day price trend, recent price changes, top categories, recent offers, quick search |
| Price Comparison | Product search, quantity input, total-cost ranking, eligibility rules, savings, sorting by total / quality / delivery, contact-supplier purchase summary |
| Products | Search, category filter, availability filter, sorting, pagination, detail page, 30/90/180-day price history chart, offer list |
| Suppliers | Directory, location filter, verified-only filter, sorting, profile with contact details and offers |
| Market Analytics | Trend chart, category averages, supply health, demand indicators, product history selector, 30/90/180-day ranges |
| AI Assistant | Transparent rule-based engine (no external model) that compares offers, explains winners, calculates totals and summarises trends |
| Saved Offers | Save / remove, price and status change tracking, side-by-side comparison of selected offers |
| Settings | Profile, business details, language, notification preferences, password change |
| Backend | FastAPI + SQLAlchemy 2 + Pydantic v2, PostgreSQL-ready with SQLite dev fallback, seeded demo data, OpenAPI docs |
| Quality | 105 backend tests, 42 UI tests, 110-check live API smoke suite, QA report |

Killer Flow (implemented end to end): Dilshod needs **100 kg of potatoes** → searches →
enters 100 kg → sees Supplier A 450 000, Supplier B 400 000, Supplier C 420 000 UZS →
Supplier B is recommended as the lowest **total** cost → explanation → contact supplier →
purchase summary with 50 000 UZS savings versus Supplier A.

---

## 2. Project structure

```
priceradar/                       (= repository root)
├─ backend/
│  ├─ app/
│  │  ├─ api/                     routers: auth, products, suppliers, offers,
│  │  │                           analytics, saved_offers, recommendations, assistant
│  │  ├─ core/                    config (env settings), security (bcrypt + JWT)
│  │  ├─ database/                session, init_db, seed (demo dataset)
│  │  ├─ models/                  User, Product, Supplier, Offer, PriceHistory, SavedOffer
│  │  ├─ schemas/                 Pydantic request/response models
│  │  ├─ services/                pricing (total-cost + ranking), catalog, analytics, assistant
│  │  └─ main.py                  FastAPI app, CORS, error handlers, routers
│  ├─ scripts/qa_smoke.py         live API smoke suite (110 checks)
│  ├─ tests/                      pytest: pricing, API, killer flow
│  ├─ requirements.txt            runtime dependencies (pinned)
│  ├─ requirements-dev.txt        + pytest / httpx
│  ├─ Dockerfile
│  └─ .env.example
├─ frontend/
│  ├─ src/
│  │  ├─ components/              UI primitives, charts, product thumb, demo notice
│  │  ├─ context/                 AuthContext, ToastContext
│  │  ├─ hooks/                   useApi, useDebounce
│  │  ├─ layouts/                 AppLayout (sidebar + topbar + mobile drawer)
│  │  ├─ pages/                   Auth, Overview, Compare, Products, ProductDetail,
│  │  │                           Suppliers, SupplierDetail, Analytics, Assistant,
│  │  │                           SavedOffers, Settings, NotFound
│  │  ├─ services/api.ts          typed API client
│  │  ├─ test/                     Vitest + Testing Library suites and recorded fixtures
│  │  ├─ types/                   shared TypeScript types
│  │  └─ utils/                   formatting, cost mirror, classnames
│  ├─ public/products/*.svg       product illustrations
│  ├─ Dockerfile, nginx.conf
│  ├─ vite.config.ts (dev proxy /api → backend)
│  └─ .env.example
├─ docker-compose.yml             optional (not executed in the QA sandbox)
├─ QA_REPORT.md                   full QA report: tests, defects, verdict
├─ .env.example
└─ README.md
```

---

## 3. Run it on Windows (exact steps)

Prerequisites: **Python 3.11+**, **Node.js 20+**, PowerShell.

### 3.1 Backend (terminal 1)

```powershell
cd priceradar\backend

# create and activate a virtual environment
py -3.11 -m venv .venv
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass   # only if activation is blocked
.\.venv\Scripts\Activate.ps1

# install dependencies
python -m pip install --upgrade pip
pip install -r requirements.txt

# configuration
Copy-Item .env.example .env
# edit .env and replace SECRET_KEY with a long random string

# run the API (creates priceradar.db and seeds demo data on first start)
uvicorn app.main:app --reload --port 8000
```

* API: <http://localhost:8000>
* Swagger UI: <http://localhost:8000/docs>
* ReDoc: <http://localhost:8000/redoc>
* Health: <http://localhost:8000/api/health>

Using **cmd.exe** instead of PowerShell? Replace the activation line with
`.\.venv\Scripts\activate.bat` and use `copy .env.example .env`.

### 3.2 Frontend (terminal 2)

```powershell
cd priceradar\frontend
npm install
npm run dev
```

Open <http://localhost:5173>. The Vite dev server proxies `/api/*` to
`http://127.0.0.1:8000`, so **no CORS configuration is needed in development**.

### 3.3 Demo login

| Field | Value |
| --- | --- |
| Email | `dilshod@priceradar.uz` |
| Password | `demo1234` |

Or click **“Use the demo account”** on the login screen.

### 3.4 macOS / Linux

```bash
cd backend
python3.11 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000

# second terminal
cd frontend
npm install && npm run dev
```

### 3.5 Reset the demo dataset

Stop the backend, delete `backend/priceradar.db`, start it again. The schema is
recreated and reseeded automatically.

---

## 4. Environment variables

Backend (`backend/.env`, see `backend/.env.example`):

| Variable | Default | Purpose |
| --- | --- | --- |
| `SECRET_KEY` | dev placeholder | JWT signing key — **must** be replaced in production |
| `ALGORITHM` | `HS256` | JWT algorithm |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `10080` (7 days) | Token lifetime |
| `DATABASE_URL` | `sqlite:///./priceradar.db` | SQLAlchemy URL; PostgreSQL supported |
| `SEED_DEMO_DATA` | `true` | Seed fictional demo data on first start |
| `CORS_ORIGINS` | `http://localhost:5173,...` | Comma-separated allowed origins |
| `CORS_ORIGIN_REGEX` | `https://[a-zA-Z0-9-]+\.e2b\.app` | Hosted preview domains |
| `ENVIRONMENT` | `development` | Environment label |

Frontend (`frontend/.env`, optional): `VITE_API_URL` (API origin when frontend and
API are on different hosts), `VITE_API_PROXY` (dev-proxy target, default
`http://127.0.0.1:8000`).

Nothing secret is embedded in the frontend bundle; the JWT lives in `localStorage`
and is sent as a bearer token.

---

## 5. Total cost and the recommendation engine

```
Total Cost = (Unit Price × Quantity) + Delivery Cost
Delivered cost per unit = Total Cost ÷ Quantity
```

Money is stored as whole UZS (integers); quantities may be fractional. Rounding is
half-up, applied once to `unit price × quantity`.

An offer is **eligible** only if all of the following hold:

1. `status != out_of_stock`
2. `available_quantity > 0`
3. `quantity >= minimum_order_quantity`
4. `quantity <= available_quantity`

Eligible offers are ranked by **total cost** (ties broken by rating, then id).
Out-of-stock or insufficient offers are still returned, but never ranked or
recommended — they are labelled with the reason.

A separate **best overall** score applies small quality/delivery adjustments
(rating, verification, delivery days) to the total cost, so a slightly more
expensive but much better supplier can be surfaced as an alternative — the
cheapest total is still always the recommendation.

### Worked example (100 kg potatoes)

| Supplier | Unit price | Product cost | Delivery | **Total** | Delivered / kg |
| --- | --- | --- | --- | --- | --- |
| Fergana Fresh Produce (B) | 3 500 | 350 000 | 50 000 | **400 000** ✅ | 4 000 |
| Bukhara Farm Direct (C) | 4 200 | 420 000 | 0 | 420 000 | 4 200 |
| Tashkent Agro Trade (A) | 4 000 | 400 000 | 50 000 | 450 000 | 4 500 |
| Namangan Food Supply | 3 300 | 330 000 | 30 000 | 360 000 | — (out of stock, rejected) |

Supplier B wins even though Supplier C has free delivery and Namangan has the
lowest unit price: the cheapest *order* is what matters.

---

## 6. API reference

Base URL: `http://localhost:8000/api` — interactive docs at `/docs`.

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| GET | `/health` | — | Service health |
| POST | `/auth/register` | — | Create account, returns JWT + user (201) |
| POST | `/auth/login` | — | Login, returns JWT + user |
| GET | `/auth/me` | ✅ | Current profile |
| PATCH | `/auth/me` | ✅ | Update profile, business, language, notifications |
| POST | `/auth/me/password` | ✅ | Change password |
| GET | `/products` | — | Search (`search`), `category`, `availability`, `sort`, `page`, `page_size` |
| GET | `/products/categories` | — | Categories with product counts and average price |
| GET | `/products/{id}` | — | Product with price aggregates |
| GET | `/products/{id}/offers` | — | Offers; optional `quantity`, `sort=price\|total\|quality\|delivery` |
| GET | `/products/{id}/price-history` | — | Daily history, `days=7..365` |
| GET | `/suppliers` | — | `search`, `location`, `verified`, `category`, `sort`, pagination |
| GET | `/suppliers/locations` | — | Distinct locations |
| GET | `/suppliers/{id}` | — | Supplier profile |
| GET | `/suppliers/{id}/offers` | — | Supplier offers |
| GET | `/offers` | — | `product_id`, `supplier_id`, `category`, `status`, `max_price`, `quantity`, `sort`, pagination |
| POST | `/offers` | ✅ | Create offer (201); 409 on duplicate product/supplier pair |
| GET | `/offers/{id}` | — | Offer detail; optional `quantity` computes totals |
| GET | `/analytics/overview` | — | Dashboard KPIs, trend, changes, categories, recent offers |
| GET | `/analytics/market` | — | Supply, supplier mix, demand indicators, `days` |
| GET | `/analytics/categories` | — | Category aggregates |
| GET | `/analytics/price-history/{product_id}` | — | Price history, `days` |
| GET | `/saved-offers` | ✅ | Current user's saved offers with price/status deltas |
| POST | `/saved-offers` | ✅ | Save offer (201); 409 if already saved |
| DELETE | `/saved-offers/{id}` | ✅ | Remove saved offer (204); 404 if not owned |
| POST | `/recommendations/compare` | — | **Killer Flow**: ranked offers, recommendation, savings, explanation |
| POST | `/assistant/chat` | — | Rule-based assistant answer |

Errors return `{"detail": "human readable message"}` with proper status codes
(400/401/404/409/422/500). Validation errors add an `errors` array.

```bash
# Killer Flow in one call
curl -X POST http://localhost:8000/api/recommendations/compare \
  -H "Content-Type: application/json" \
  -d '{"product_id": 1, "quantity": 100}'
```

---

## 7. Database

SQLAlchemy 2 models: `users`, `products`, `suppliers`, `offers`, `price_history`,
`saved_offers` — with FKs (cascade delete), unique constraints, check constraints
(positive prices, MOQ, rating range, status enum) and indexes on the hot paths.

* **Development default:** SQLite (`backend/priceradar.db`) — zero setup, foreign
  keys enabled per connection.
* **PostgreSQL:** set `DATABASE_URL=postgresql+psycopg2://user:pass@host:5432/db`
  (the `postgres://` scheme is normalised automatically). Schema creation is
  idempotent via `create_all`; for production add Alembic on top of these models.
* **Seed data:** 8 products, 6 suppliers, 28 offers, 90 days of price history,
  demo user `dilshod@priceradar.uz`. Deterministic (fixed random seeds), created
  only when the database is empty. Every seeded row carries `is_demo = true`.

---

## 8. Tests

```bash
# backend unit + integration tests (105)
cd backend
pip install -r requirements-dev.txt
python -m pytest tests -q

# live API smoke suite (110 checks). It creates a throwaway offer/account, so run
# it against a separate database to keep your demo data pristine:
#   terminal A: DATABASE_URL=sqlite:///./qa_smoke.db uvicorn app.main:app --port 8001
python scripts/qa_smoke.py http://127.0.0.1:8001

# frontend type-check, production build and UI tests (42)
cd frontend
npm run typecheck
npm run build
npm test
```

Current results: **105/105** backend tests, **42/42** UI tests,
**110/110** live API checks, clean type-check and production build.
Full details, defect log and coverage notes: [`QA_REPORT.md`](./QA_REPORT.md).

---

## 9. Docker (optional)

```bash
cp .env.example .env        # set SECRET_KEY
docker compose up --build
```

* Frontend: <http://localhost:8080> (nginx serves the build and proxies `/api`)
* API: <http://localhost:8000/docs>
* PostgreSQL 16 with a named volume; demo data seeds on first start.

> The Docker files and compose stack are provided for convenience but were **not
> executed** in the QA sandbox (no Docker daemon). The tested path is the local
> venv + Vite workflow above.

---

## 10. Known limitations

* **All data is fictional.** There is no supplier feed, scraping, or live market
  integration; analytics describe the seeded demo series only.
* The "AI" assistant is a deterministic rule-based engine. No language model is
  connected, and it says so in every response. It understands product names,
  quantities and a small set of intents in English.
* Language selection is stored and persisted but the interface is English-only.
  Notification preferences are stored; no email/push delivery exists.
* Contact Supplier is a demonstration flow: it shows the supplier phone number,
  builds a copyable purchase order and offers a `tel:` link. It does not send
  messages or place orders.
* No offer editing/deletion endpoints (creation only), no admin role, no file
  uploads, no refresh-token rotation, and no rate limiting — all out of MVP scope.
* Schema creation uses `create_all` rather than Alembic migrations.
* Real-browser visual regression, screenshots and cross-device testing were not
  possible in the QA sandbox (no browser binaries); UI behaviour was verified with
  DOM-level tests and responsive layout was audited statically (see the QA report).
* Docker compose was not executed (see above).

---

## 11. Security notes

* Passwords hashed with **bcrypt** (cost 12) after a SHA-256 pre-hash, so long
  passwords are never silently truncated at 72 bytes.
* JWT bearer tokens signed with `SECRET_KEY` and an expiry (7 days by default).
* Private endpoints (`/auth/me`, `/saved-offers`, `POST /offers`) require a valid
  token; saved offers are scoped per user (no cross-account reads or deletes).
* All input validated by Pydantic (email format, password length, price/quantity
  bounds, enum statuses); SQLAlchemy parameterises every query.
* CORS restricted to configured origins plus optional preview-domain regex.
* Secrets come from environment variables; `.env` is git-ignored and no secret is
  shipped in the frontend bundle. `.env.example` contains placeholders only.
