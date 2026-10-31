"""Deterministic demo dataset.

Everything created here is explicitly fictional. The dataset is labelled as demo
data throughout the API (`is_demo`, `data_source`, `disclaimer`) so it can never
be mistaken for real market research.
"""
from __future__ import annotations

import random
from datetime import datetime, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.models import Offer, PriceHistory, Product, Supplier, User, utcnow

DEMO_EMAIL = "dilshod@priceradar.uz"
DEMO_PASSWORD = "demo1234"

PRODUCTS = [
    {
        "name": "Potatoes",
        "slug": "potatoes",
        "category": "Vegetables",
        "unit": "kg",
        "description": "Local Uzbek potatoes, grade 1, washed. Typical wholesale purchase for grocery stores and restaurants.",
    },
    {
        "name": "Tomatoes",
        "slug": "tomatoes",
        "category": "Vegetables",
        "unit": "kg",
        "description": "Vine-ripened greenhouse tomatoes, sorted by size. Prices move quickly with the season.",
    },
    {
        "name": "Onions",
        "slug": "onions",
        "category": "Vegetables",
        "unit": "kg",
        "description": "Dry yellow onions in 20 kg nets, suitable for long storage.",
    },
    {
        "name": "Rice",
        "slug": "rice",
        "category": "Grains",
        "unit": "kg",
        "description": "Laser-grade long grain rice, 25 kg sacks, cleaned and sorted.",
    },
    {
        "name": "Flour",
        "slug": "flour",
        "category": "Grains",
        "unit": "kg",
        "description": "Premium wheat flour, grade 1, 50 kg sacks from local mills.",
    },
    {
        "name": "Cooking oil",
        "slug": "cooking-oil",
        "category": "Oils & Fats",
        "unit": "l",
        "description": "Refined sunflower oil in 5 litre bottles or 20 litre jerry cans.",
    },
    {
        "name": "Sugar",
        "slug": "sugar",
        "category": "Pantry",
        "unit": "kg",
        "description": "White granulated sugar, 50 kg sacks, food grade.",
    },
    {
        "name": "Eggs",
        "slug": "eggs",
        "category": "Dairy & Eggs",
        "unit": "tray",
        "description": "Fresh chicken eggs, 30-egg tray, delivered daily from local poultry farms.",
    },
]

SUPPLIERS = [
    {
        "name": "Tashkent Agro Trade",
        "phone": "+998 71 200 41 20",
        "location": "Tashkent",
        "description": "Wholesale distributor working with grocery chains and HoReCa across Tashkent region. Own fleet, next-day delivery.",
        "categories": "Vegetables,Grains,Pantry",
        "rating": 4.6,
        "delivery_days": 1,
        "is_verified": True,
    },
    {
        "name": "Fergana Fresh Produce",
        "phone": "+998 73 244 18 65",
        "location": "Fergana",
        "description": "Farmer cooperative shipping produce from the Fergana valley in refrigerated trucks.",
        "categories": "Vegetables,Dairy & Eggs",
        "rating": 4.4,
        "delivery_days": 2,
        "is_verified": True,
    },
    {
        "name": "Samarkand Wholesale Hub",
        "phone": "+998 66 233 90 14",
        "location": "Samarkand",
        "description": "Large wholesale market operator with mixed dry goods and fresh produce inventory.",
        "categories": "Vegetables,Grains,Oils & Fats,Pantry",
        "rating": 4.1,
        "delivery_days": 3,
        "is_verified": False,
    },
    {
        "name": "Bukhara Farm Direct",
        "phone": "+998 65 221 77 03",
        "location": "Bukhara",
        "description": "Farm-direct supplier. Free delivery on orders above 250,000 UZS within Bukhara and Samarkand.",
        "categories": "Vegetables,Pantry",
        "rating": 4.8,
        "delivery_days": 2,
        "is_verified": True,
    },
    {
        "name": "Andijan Grain Co.",
        "phone": "+998 74 223 56 88",
        "location": "Andijan",
        "description": "Grain and flour specialist supplying bakeries and food producers since 2011.",
        "categories": "Grains,Oils & Fats",
        "rating": 4.3,
        "delivery_days": 4,
        "is_verified": True,
    },
    {
        "name": "Namangan Food Supply",
        "phone": "+998 69 234 12 47",
        "location": "Namangan",
        "description": "Regional food supply company working with small retailers and canteens.",
        "categories": "Pantry,Dairy & Eggs",
        "rating": 3.9,
        "delivery_days": 2,
        "is_verified": False,
    },
]

# (product, supplier, unit_price, delivery_cost, moq, available, status)
# Note: for Potatoes these are exactly the demonstration values from the
# Killer Flow specification (Supplier A / B / C).
OFFERS = [
    # --- Killer Flow: 100 kg of potatoes -------------------------------------
    ("Potatoes", "Tashkent Agro Trade", 4000, 50_000, 50, 800, "in_stock"),  # Supplier A -> 450 000
    ("Potatoes", "Fergana Fresh Produce", 3500, 50_000, 100, 1200, "in_stock"),  # Supplier B -> 400 000
    ("Potatoes", "Bukhara Farm Direct", 4200, 0, 20, 400, "in_stock"),  # Supplier C -> 420 000
    ("Potatoes", "Namangan Food Supply", 3300, 30_000, 100, 40, "out_of_stock"),
    # --- Tomatoes ------------------------------------------------------------
    ("Tomatoes", "Tashkent Agro Trade", 12500, 60_000, 25, 300, "in_stock"),
    ("Tomatoes", "Fergana Fresh Produce", 11800, 75_000, 50, 220, "in_stock"),
    ("Tomatoes", "Bukhara Farm Direct", 13200, 0, 30, 150, "low_stock"),
    ("Tomatoes", "Samarkand Wholesale Hub", 11200, 95_000, 100, 500, "in_stock"),
    # --- Onions --------------------------------------------------------------
    ("Onions", "Tashkent Agro Trade", 3200, 45_000, 50, 900, "in_stock"),
    ("Onions", "Fergana Fresh Produce", 2950, 55_000, 100, 1500, "in_stock"),
    ("Onions", "Samarkand Wholesale Hub", 3100, 40_000, 200, 2000, "in_stock"),
    ("Onions", "Bukhara Farm Direct", 3400, 0, 100, 600, "in_stock"),
    # --- Rice ----------------------------------------------------------------
    ("Rice", "Andijan Grain Co.", 14500, 80_000, 100, 2500, "in_stock"),
    ("Rice", "Tashkent Agro Trade", 15200, 55_000, 50, 700, "in_stock"),
    ("Rice", "Samarkand Wholesale Hub", 13900, 120_000, 250, 3000, "in_stock"),
    # --- Flour ---------------------------------------------------------------
    ("Flour", "Andijan Grain Co.", 6200, 90_000, 500, 6000, "in_stock"),
    ("Flour", "Samarkand Wholesale Hub", 5900, 110_000, 500, 8000, "in_stock"),
    ("Flour", "Tashkent Agro Trade", 6400, 70_000, 300, 1200, "low_stock"),
    # --- Cooking oil ---------------------------------------------------------
    ("Cooking oil", "Andijan Grain Co.", 21500, 65_000, 50, 900, "in_stock"),
    ("Cooking oil", "Samarkand Wholesale Hub", 20800, 85_000, 100, 1500, "in_stock"),
    ("Cooking oil", "Tashkent Agro Trade", 22400, 40_000, 20, 300, "in_stock"),
    ("Cooking oil", "Namangan Food Supply", 19900, 95_000, 200, 400, "in_stock"),
    # --- Sugar ---------------------------------------------------------------
    ("Sugar", "Samarkand Wholesale Hub", 11800, 60_000, 100, 2200, "in_stock"),
    ("Sugar", "Tashkent Agro Trade", 12200, 45_000, 50, 600, "in_stock"),
    ("Sugar", "Namangan Food Supply", 11400, 75_000, 200, 900, "in_stock"),
    # --- Eggs ----------------------------------------------------------------
    ("Eggs", "Fergana Fresh Produce", 42000, 35_000, 10, 180, "in_stock"),
    ("Eggs", "Namangan Food Supply", 40500, 45_000, 20, 120, "in_stock"),
    ("Eggs", "Tashkent Agro Trade", 43500, 25_000, 10, 60, "low_stock"),
]


def _price_series(base_price: int, days: int, rng: random.Random) -> list[int]:
    """Deterministic, gently trending series that ends exactly at the current price."""
    drift = rng.uniform(-0.12, 0.14)  # overall change over the window
    season = rng.uniform(0.01, 0.04)
    series: list[int] = []
    for offset in range(days - 1, -1, -1):
        progress = offset / max(days - 1, 1)  # 1.0 = oldest, 0.0 = today
        trend = 1 - drift * progress
        wave = 1 + season * ((offset % 14) - 7) / 7 * 0.35
        noise = 1 + rng.uniform(-0.012, 0.012)
        series.append(max(100, int(round(base_price * trend * wave * noise))))
    series[-1] = base_price
    return series


def seed_database(db: Session, days_of_history: int = 90) -> dict:
    """Create demo data if the database is empty. Safe to call on every startup."""
    existing = db.scalar(select(Product).limit(1))
    if existing:
        return {"seeded": False, "reason": "database already contains data"}

    products: dict[str, Product] = {}
    for item in PRODUCTS:
        product = Product(
            name=item["name"],
            category=item["category"],
            unit=item["unit"],
            description=item["description"],
            image_url=f"/products/{item['slug']}.svg",
            is_demo=True,
        )
        db.add(product)
        products[item["name"]] = product

    suppliers: dict[str, Supplier] = {}
    for item in SUPPLIERS:
        supplier = Supplier(
            name=item["name"],
            phone=item["phone"],
            location=item["location"],
            description=item["description"],
            categories=item["categories"],
            rating=item["rating"],
            delivery_days=item["delivery_days"],
            is_verified=item["is_verified"],
            is_demo=True,
        )
        db.add(supplier)
        suppliers[item["name"]] = supplier

    db.flush()  # assign ids

    now = utcnow()
    offer_rows: list[Offer] = []
    for index, (product_name, supplier_name, price, delivery, moq, available, status) in enumerate(OFFERS):
        offer = Offer(
            product_id=products[product_name].id,
            supplier_id=suppliers[supplier_name].id,
            unit_price=price,
            delivery_cost=delivery,
            minimum_order_quantity=float(moq),
            available_quantity=float(available),
            status=status,
            is_demo=True,
            # stagger freshness between 1 hour and 6 days ago
            updated_at=now - timedelta(hours=[2, 26, 5, 71, 12, 48, 3, 96, 18][index % 9]),
        )
        db.add(offer)
        offer_rows.append(offer)

    db.flush()

    for offer in offer_rows:
        rng = random.Random(offer.product_id * 1000 + offer.supplier_id)
        series = _price_series(offer.unit_price, days_of_history, rng)
        for day_index, price in enumerate(series):
            recorded = (now - timedelta(days=days_of_history - 1 - day_index)).replace(
                hour=9, minute=0, second=0, microsecond=0
            )
            db.add(
                PriceHistory(
                    product_id=offer.product_id,
                    offer_id=offer.id,
                    price=price,
                    recorded_at=recorded,
                )
            )

    if not db.scalar(select(User).where(User.email == DEMO_EMAIL)):
        db.add(
            User(
                full_name="Dilshod Karimov",
                email=DEMO_EMAIL,
                hashed_password=hash_password(DEMO_PASSWORD),
                business_name="Dilshod Grocery Market",
                phone="+998 90 123 45 67",
                language="en",
            )
        )

    db.commit()
    return {
        "seeded": True,
        "products": len(PRODUCTS),
        "suppliers": len(SUPPLIERS),
        "offers": len(offer_rows),
        "price_points": len(offer_rows) * days_of_history,
        "demo_user": DEMO_EMAIL,
    }
