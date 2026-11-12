from datetime import UTC, datetime, timedelta

from sqlalchemy import update

from app import push
from app.models import CourtSession
from app.routers import auth as auth_router
from app.scheduler import run_once
from tests.conftest import HERE, register

LAT, LNG = HERE


def q(**kw):
    return {"lat": LAT, "lng": LNG, **kw}


def test_register_login_and_profile(client):
    h = register(client, "dana")
    assert client.post("/auth/register", json={
        "email": "DANA@ex.com", "username": "other", "password": "password123", "favorite_sport": "tennis"
    }).status_code == 409

    r = client.post("/auth/login", json={"login": "dana@ex.com", "password": "password123"})
    assert r.status_code == 200 and r.json()["needs_onboarding"] is False
    assert client.post("/auth/login", json={"login": "dana", "password": "nope"}).status_code == 401

    r = client.patch("/me", headers=h, json={"full_name": "Dana Levi", "phone": "050-0000000"})
    assert r.json()["full_name"] == "Dana Levi"
    assert client.get("/me").status_code == 401


def test_facebook_login_requires_onboarding(client, monkeypatch):
    monkeypatch.setattr(auth_router, "fetch_facebook_profile", lambda t: {"id": "fb1", "name": "Yossi Cohen"})
    r = client.post("/auth/facebook", json={"access_token": "x"})
    assert r.status_code == 200 and r.json()["needs_onboarding"] is True
    h = {"Authorization": f"Bearer {r.json()['access_token']}"}
    assert client.get("/me", headers=h).json()["username"] == "yossicohen"
    client.patch("/me", headers=h, json={"favorite_sport": "football"})
    r = client.post("/auth/facebook", json={"access_token": "x"})
    assert r.json()["needs_onboarding"] is False


def test_list_radius_filters_and_order(client, courts):
    h = register(client, "alice")
    names = lambda r: [c["name"] for c in r.json()]  # noqa: E731

    assert names(client.get("/courts", headers=h, params=q())) == ["Near basketball"]  # default 1 km
    assert names(client.get("/courts", headers=h, params=q(radius_km=5))) == ["Near basketball", "Mid football"]
    r = client.get("/courts", headers=h, params=q(radius_km=10))
    assert names(r) == ["Near basketball", "Mid football", "Far tennis paid"]
    d = [c["distance_m"] for c in r.json()]
    assert d == sorted(d) and 300 < d[0] < 600
    assert names(client.get("/courts", headers=h, params=q(radius_km=10, order="desc")))[0] == "Far tennis paid"
    assert names(client.get("/courts", headers=h, params=q(radius_km=10, filter="paid"))) == ["Far tennis paid"]
    assert names(client.get("/courts", headers=h, params=q(radius_km=10, sport="football"))) == ["Mid football"]


def test_claim_occupied_join_extend_release(client, courts):
    owner, other = register(client, "owner"), register(client, "other")
    cid = courts["Near basketball"]

    r = client.post(f"/courts/{cid}/sessions", headers=owner, json={"players_count": 4, "open_to_join": True})
    assert r.status_code == 201, r.text
    sess = r.json()
    started = datetime.fromisoformat(sess["started_at"])
    assert timedelta(minutes=89) < datetime.fromisoformat(sess["expires_at"]) - started <= timedelta(minutes=91)

    assert client.post(f"/courts/{cid}/sessions", headers=other, json={}).status_code == 409
    assert client.post(f"/courts/{courts['Mid football']}/sessions", headers=owner, json={}).status_code == 409

    lst = client.get("/courts", headers=other, params=q(radius_km=10, filter="occupied")).json()
    assert [c["id"] for c in lst] == [str(cid)] and lst[0]["players_count"] == 4
    free = client.get("/courts", headers=other, params=q(radius_km=10, filter="free")).json()
    assert str(cid) not in [c["id"] for c in free]

    detail = client.get(f"/courts/{cid}", headers=other, params=q()).json()
    assert detail["status"] == "occupied" and detail["active_session"]["holder"]["username"] == "owner"

    assert client.post(f"/sessions/{sess['id']}/release", headers=other).status_code == 403
    assert client.post(f"/sessions/{sess['id']}/join", headers=other).json()["players_count"] == 5
    assert client.post(f"/sessions/{sess['id']}/join", headers=other).json()["players_count"] == 5  # idempotent

    ext = client.post(f"/sessions/{sess['id']}/extend", headers=owner)
    assert ext.status_code == 200 and ext.json()["extensions"] == 1
    gained = datetime.fromisoformat(ext.json()["expires_at"]) - datetime.fromisoformat(sess["expires_at"])
    assert gained == timedelta(minutes=45)
    assert client.post(f"/sessions/{sess['id']}/extend", headers=owner).status_code == 409

    assert client.post(f"/sessions/{sess['id']}/release", headers=owner).status_code == 204
    assert client.get(f"/courts/{cid}", headers=other, params=q()).json()["status"] == "free"

    # both players now see it in history, and as "recent players" for each other
    assert [c["id"] for c in client.get("/me/history", headers=other, params=q()).json()] == [str(cid)]
    detail = client.get(f"/courts/{cid}", headers=other, params=q()).json()
    assert detail["players_played_count"] == 2
    assert [u["username"] for u in detail["recent_players"]] == ["owner"]


def test_closed_session_cannot_be_joined(client, courts):
    owner, other = register(client, "owner"), register(client, "other")
    sid = client.post(f"/courts/{courts['Near basketball']}/sessions", headers=owner, json={}).json()["id"]
    assert client.post(f"/sessions/{sid}/join", headers=other).status_code == 403


def test_nearby_players(client, courts):
    me = register(client, "myself")
    near = register(client, "near", sport="basketball")
    register(client, "nolocation", sport="basketball")
    wrong_sport = register(client, "footy", sport="football")
    client.put("/me/location", headers=near, json={"lat": 32.0840, "lng": 34.7815})
    client.put("/me/location", headers=wrong_sport, json={"lat": 32.0840, "lng": 34.7815})
    d = client.get(f"/courts/{courts['Near basketball']}", headers=me, params=q()).json()
    assert [u["username"] for u in d["nearby_players"]] == ["near"]


def test_scheduler_warns_then_notifies_watchers(client, courts, db):
    owner, watcher = register(client, "owner"), register(client, "watcher")
    client.put("/me/push-token", headers=owner, json={"token": "ExponentPushToken[owner]"})
    client.put("/me/push-token", headers=watcher, json={"token": "ExponentPushToken[watcher]"})
    cid = courts["Near basketball"]
    sid = client.post(f"/courts/{cid}/sessions", headers=owner, json={}).json()["id"]
    assert client.post(f"/courts/{cid}/watch", headers=watcher).status_code == 204
    assert client.get(f"/courts/{cid}", headers=watcher, params=q()).json()["watching"] is True

    assert run_once(db) == {"warned": 0, "freed": 0}

    # 10 minutes left -> holder warned once
    db.execute(update(CourtSession).values(expires_at=datetime.now(UTC) + timedelta(minutes=10)))
    db.commit()
    assert run_once(db)["warned"] == 1
    assert run_once(db)["warned"] == 0
    assert push.sent[-1]["to"] == "ExponentPushToken[owner]" and push.sent[-1]["categoryId"] == "session_warning"

    # time runs out -> watcher notified, watch is one-shot
    db.execute(update(CourtSession).values(expires_at=datetime.now(UTC) - timedelta(seconds=1)))
    db.commit()
    assert run_once(db)["freed"] == 1
    assert push.sent[-1]["to"] == "ExponentPushToken[watcher]" and push.sent[-1]["data"]["type"] == "court_free"
    assert run_once(db)["freed"] == 0
    assert client.get(f"/courts/{cid}", headers=watcher, params=q()).json()["watching"] is False
    assert client.post(f"/sessions/{sid}/release", headers=owner).status_code == 409


def test_photo_upload(client, courts):
    h = register(client, "photog")
    cid = courts["Near basketball"]
    r = client.post(f"/courts/{cid}/photo", headers=h, files={"file": ("c.jpg", b"\xff\xd8\xff fake", "image/jpeg")})
    assert r.status_code == 200 and r.json()["photo_url"].endswith(".jpg")
    bad = client.post(f"/courts/{cid}/photo", headers=h, files={"file": ("c.txt", b"x", "text/plain")})
    assert bad.status_code == 415
