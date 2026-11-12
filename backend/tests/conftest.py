import os

os.environ.setdefault("DATABASE_URL", "postgresql+psycopg://jsport:jsport@localhost:5432/jsport_test")
os.environ["SCHEDULER_ENABLED"] = "false"
os.environ.setdefault("MEDIA_DIR", "/tmp/jsport-test-media")

import pytest  # noqa: E402
from alembic import command  # noqa: E402
from alembic.config import Config  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy import text  # noqa: E402

from app import push  # noqa: E402
from app.db import SessionLocal, engine  # noqa: E402
from app.geo import make_point  # noqa: E402
from app.main import app  # noqa: E402
from app.models import Court, Sport  # noqa: E402

HERE = (32.0800, 34.7800)  # Tel Aviv


@pytest.fixture(scope="session", autouse=True)
def _migrate():
    cfg = Config(os.path.join(os.path.dirname(__file__), "..", "alembic.ini"))
    cfg.set_main_option("script_location", os.path.join(os.path.dirname(__file__), "..", "alembic"))
    cfg.set_main_option("sqlalchemy.url", os.environ["DATABASE_URL"])
    command.downgrade(cfg, "base")
    command.upgrade(cfg, "head")
    yield


@pytest.fixture(autouse=True)
def _clean():
    with engine.begin() as c:
        c.execute(text("TRUNCATE court_watches, session_participants, court_sessions, courts, users CASCADE"))
    push.sent = []
    yield
    push.sent = None


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def db():
    with SessionLocal() as s:
        yield s


@pytest.fixture
def courts(db):
    """Courts at ~0.4 km, ~2.5 km, ~8 km from HERE."""
    rows = [
        Court(name="Near basketball", sport=Sport.basketball, location=make_point(32.0835, 34.7810)),
        Court(name="Mid football", sport=Sport.football, location=make_point(32.1020, 34.7820)),
        Court(name="Far tennis paid", sport=Sport.tennis, is_paid=True, location=make_point(32.1520, 34.7800)),
    ]
    db.add_all(rows)
    db.commit()
    return {c.name: c.id for c in rows}


def register(client, username: str, sport: str = "basketball") -> dict:
    r = client.post(
        "/auth/register",
        json={"email": f"{username}@ex.com", "username": username, "password": "password123", "favorite_sport": sport},
    )
    assert r.status_code == 201, r.text
    return {"Authorization": f"Bearer {r.json()['access_token']}"}
