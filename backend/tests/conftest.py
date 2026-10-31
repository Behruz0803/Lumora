"""Test fixtures: isolated SQLite database per test session."""
from __future__ import annotations

import os
import tempfile
from collections.abc import Iterator

import pytest

os.environ.setdefault("ENVIRONMENT", "test")

from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy import create_engine  # noqa: E402
from sqlalchemy.orm import sessionmaker  # noqa: E402
from sqlalchemy.pool import StaticPool  # noqa: E402

from app.database.session import Base, get_db  # noqa: E402
from app.database.seed import seed_database  # noqa: E402
from app.main import app  # noqa: E402


@pytest.fixture(scope="session")
def engine():
    # File-based temp SQLite so the schema and seed are exercised exactly like production.
    fd, path = tempfile.mkstemp(suffix=".db")
    os.close(fd)
    eng = create_engine(
        f"sqlite:///{path}",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=eng)
    TestSession = sessionmaker(bind=eng, expire_on_commit=False)
    with TestSession() as db:
        seed_database(db)
    yield eng
    eng.dispose()
    os.unlink(path)


@pytest.fixture(scope="session")
def session_factory(engine):
    return sessionmaker(bind=engine, expire_on_commit=False)


@pytest.fixture()
def db(session_factory) -> Iterator:
    session = session_factory()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture(scope="session")
def client(engine, session_factory) -> Iterator[TestClient]:
    def override_get_db():
        session = session_factory()
        try:
            yield session
        finally:
            session.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture(scope="session")
def auth_headers(client) -> dict[str, str]:
    response = client.post(
        "/api/auth/login", json={"email": "dilshod@priceradar.uz", "password": "demo1234"}
    )
    assert response.status_code == 200, response.text
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


@pytest.fixture(scope="session")
def product_ids(client) -> dict[str, int]:
    items = client.get("/api/products", params={"page_size": 100}).json()["items"]
    return {item["name"]: item["id"] for item in items}
