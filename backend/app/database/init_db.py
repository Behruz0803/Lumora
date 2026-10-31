"""Database initialisation entry point.

Schema creation is idempotent: `create_all` is used for the MVP so the project
runs with zero setup on SQLite (and on PostgreSQL). For production use, add
Alembic migrations - the models are migration-ready.
"""
from __future__ import annotations

import logging

from app.core.config import settings
from app.database.session import Base, SessionLocal, engine
from app.database.seed import seed_database
from app.models import models  # noqa: F401  (import registers all models on Base.metadata)

logger = logging.getLogger("priceradar.db")


def init_database() -> None:
    Base.metadata.create_all(bind=engine)
    if not settings.seed_demo_data:
        return
    with SessionLocal() as db:
        result = seed_database(db)
        if result.get("seeded"):
            logger.info(
                "Seeded demo data: %s products, %s suppliers, %s offers",
                result["products"],
                result["suppliers"],
                result["offers"],
            )


if __name__ == "__main__":  # pragma: no cover
    logging.basicConfig(level=logging.INFO)
    init_database()
    print("Database initialised.")
