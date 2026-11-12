import uuid
from datetime import UTC, datetime, timedelta
from pathlib import Path
from typing import Annotated, Literal

from fastapi import APIRouter, File, HTTPException, Query, UploadFile, status
from sqlalchemy import Row, func, select

from app.config import get_settings
from app.deps import DB, CurrentUser
from app.geo import lat_of, lng_of, make_point
from app.models import Court, CourtSession, CourtWatch, SessionParticipant, Sport, User
from app.schemas import (
    ActiveSessionOut,
    ClaimIn,
    CourtDetail,
    CourtFilter,
    CourtListItem,
    UserPublic,
)

router = APIRouter(tags=["courts"])

def _active():
    return (
        select(CourtSession)
        .where(CourtSession.ended_at.is_(None), CourtSession.expires_at > func.now())
        .subquery("active")
    )


def _list_item(row: Row) -> CourtListItem:
    return CourtListItem(
        id=row.id,
        name=row.name,
        sport=row.sport,
        is_paid=row.is_paid,
        lat=row.lat,
        lng=row.lng,
        distance_m=round(row.distance_m, 1),
        status="occupied" if row.session_id else "free",
        expires_at=row.expires_at,
        players_count=row.players_count,
    )


def _court_query(lat: float, lng: float):
    active = _active()
    here = make_point(lat, lng)
    dist = func.ST_Distance(Court.location, here)
    stmt = select(
        Court.id,
        Court.name,
        Court.sport,
        Court.is_paid,
        Court.address,
        Court.photo_url,
        lat_of(Court.location).label("lat"),
        lng_of(Court.location).label("lng"),
        dist.label("distance_m"),
        active.c.id.label("session_id"),
        active.c.expires_at,
        active.c.players_count,
    ).outerjoin(active, active.c.court_id == Court.id)
    return stmt, active, here, dist


@router.get("/courts", response_model=list[CourtListItem])
def list_courts(
    db: DB,
    _: CurrentUser,
    lat: Annotated[float, Query(ge=-90, le=90)],
    lng: Annotated[float, Query(ge=-180, le=180)],
    radius_km: Annotated[float, Query(gt=0, le=200)] = 1,
    filter: CourtFilter = "all",
    sport: Sport | None = None,
    order: Literal["asc", "desc"] = "asc",
    limit: Annotated[int, Query(ge=1, le=500)] = 200,
) -> list[CourtListItem]:
    stmt, active, here, dist = _court_query(lat, lng)
    stmt = stmt.where(func.ST_DWithin(Court.location, here, radius_km * 1000))
    if filter == "free":
        stmt = stmt.where(active.c.id.is_(None))
    elif filter == "occupied":
        stmt = stmt.where(active.c.id.is_not(None))
    elif filter == "paid":
        stmt = stmt.where(Court.is_paid.is_(True))
    if sport:
        stmt = stmt.where(Court.sport == sport)
    stmt = stmt.order_by(dist.desc() if order == "desc" else dist.asc()).limit(limit)
    return [_list_item(r) for r in db.execute(stmt)]


def _active_session(db: DB, court_id: uuid.UUID) -> CourtSession | None:
    return db.scalar(
        select(CourtSession).where(
            CourtSession.court_id == court_id,
            CourtSession.ended_at.is_(None),
            CourtSession.expires_at > func.now(),
        )
    )


def _session_out(s: CourtSession) -> ActiveSessionOut:
    return ActiveSessionOut(
        id=s.id,
        holder=UserPublic.model_validate(s.holder),
        players_count=s.players_count,
        open_to_join=s.open_to_join,
        chat_locked=s.chat_locked,
        started_at=s.started_at,
        expires_at=s.expires_at,
        extensions=s.extensions,
    )


@router.get("/courts/{court_id}", response_model=CourtDetail)
def court_detail(
    court_id: uuid.UUID,
    db: DB,
    user: CurrentUser,
    lat: Annotated[float, Query(ge=-90, le=90)],
    lng: Annotated[float, Query(ge=-180, le=180)],
) -> CourtDetail:
    stmt, *_ = _court_query(lat, lng)
    row = db.execute(stmt.where(Court.id == court_id)).first()
    if row is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Court not found")
    court = db.get(Court, court_id)

    played = (
        select(SessionParticipant.user_id, func.max(SessionParticipant.joined_at).label("last"))
        .join(CourtSession, CourtSession.id == SessionParticipant.session_id)
        .where(CourtSession.court_id == court_id)
        .group_by(SessionParticipant.user_id)
        .subquery()
    )
    players_played_count = db.scalar(select(func.count()).select_from(played)) or 0
    recent = db.scalars(
        select(User).join(played, played.c.user_id == User.id).where(User.id != user.id).order_by(played.c.last.desc()).limit(12)
    ).all()

    s = get_settings()
    nearby = db.scalars(
        select(User)
        .where(
            User.id != user.id,
            User.favorite_sport == court.sport,
            User.last_location.is_not(None),
            User.last_seen_at > func.now() - timedelta(days=7),
            func.ST_DWithin(User.last_location, court.location, s.nearby_players_radius_m),
        )
        .order_by(User.last_seen_at.desc())
        .limit(12)
    ).all()

    session = _active_session(db, court_id)
    watching = db.get(CourtWatch, (user.id, court_id)) is not None
    return CourtDetail(
        **_list_item(row).model_dump(),
        address=row.address,
        photo_url=row.photo_url,
        players_played_count=players_played_count,
        active_session=_session_out(session) if session else None,
        recent_players=[UserPublic.model_validate(u) for u in recent],
        nearby_players=[UserPublic.model_validate(u) for u in nearby],
        watching=watching,
    )


@router.post("/courts/{court_id}/photo", status_code=200)
def upload_photo(court_id: uuid.UUID, db: DB, _: CurrentUser, file: Annotated[UploadFile, File()]) -> dict:
    court = db.get(Court, court_id)
    if court is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Court not found")
    if file.content_type not in {"image/jpeg", "image/png", "image/webp"}:
        raise HTTPException(status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, "JPEG, PNG or WebP only")
    data = file.file.read(8 * 1024 * 1024 + 1)
    if len(data) > 8 * 1024 * 1024:
        raise HTTPException(status.HTTP_413_CONTENT_TOO_LARGE, "Max 8 MB")
    s = get_settings()
    ext = {"image/jpeg": "jpg", "image/png": "png", "image/webp": "webp"}[file.content_type]
    name = f"courts/{court_id}-{uuid.uuid4().hex[:8]}.{ext}"
    path = Path(s.media_dir) / name
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(data)
    court.photo_url = f"{s.public_base_url}/media/{name}"
    db.commit()
    return {"photo_url": court.photo_url}


# ---- check-in ("תפוס מגרש") ----
@router.post("/courts/{court_id}/sessions", response_model=ActiveSessionOut, status_code=201)
def claim_court(court_id: uuid.UUID, body: ClaimIn, db: DB, user: CurrentUser) -> ActiveSessionOut:
    # Row lock serialises concurrent claims on the same court.
    court = db.scalar(select(Court).where(Court.id == court_id).with_for_update())
    if court is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Court not found")
    if _active_session(db, court_id):
        raise HTTPException(status.HTTP_409_CONFLICT, "Court is already occupied")
    mine = db.scalar(
        select(CourtSession.id).where(
            CourtSession.holder_id == user.id, CourtSession.ended_at.is_(None), CourtSession.expires_at > func.now()
        )
    )
    if mine:
        raise HTTPException(status.HTTP_409_CONFLICT, "You already hold another court")
    session = CourtSession(
        court_id=court_id,
        holder_id=user.id,
        expires_at=datetime.now(UTC) + timedelta(minutes=get_settings().session_minutes),
        **body.model_dump(),
    )
    db.add(session)
    db.flush()
    db.add(SessionParticipant(session_id=session.id, user_id=user.id))
    db.commit()
    db.refresh(session)
    return _session_out(session)


def _held_session(db: DB, session_id: uuid.UUID, user: User) -> CourtSession:
    s = db.scalar(select(CourtSession).where(CourtSession.id == session_id).with_for_update(of=CourtSession))
    if s is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Session not found")
    if s.ended_at is not None or s.expires_at <= datetime.now(UTC):
        raise HTTPException(status.HTTP_409_CONFLICT, "Session already ended")
    if s.holder_id != user.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Only the player who took the court can do this")
    return s


@router.post("/sessions/{session_id}/release", status_code=204)
def release(session_id: uuid.UUID, db: DB, user: CurrentUser) -> None:
    s = _held_session(db, session_id, user)
    s.ended_at = datetime.now(UTC)
    db.commit()  # watchers are notified by the scheduler


@router.post("/sessions/{session_id}/extend", response_model=ActiveSessionOut)
def extend(session_id: uuid.UUID, db: DB, user: CurrentUser) -> ActiveSessionOut:
    s = _held_session(db, session_id, user)
    cfg = get_settings()
    if s.extensions >= cfg.max_extensions:
        raise HTTPException(status.HTTP_409_CONFLICT, "No more extensions allowed")
    s.expires_at = s.expires_at + timedelta(minutes=cfg.extend_minutes)
    s.extensions += 1
    s.warned_at = None  # warn again before the new end time
    db.commit()
    db.refresh(s)
    return _session_out(s)


@router.post("/sessions/{session_id}/join", response_model=ActiveSessionOut)
def join(session_id: uuid.UUID, db: DB, user: CurrentUser) -> ActiveSessionOut:
    s = db.scalar(select(CourtSession).where(CourtSession.id == session_id).with_for_update(of=CourtSession))
    if s is None or s.ended_at is not None or s.expires_at <= datetime.now(UTC):
        raise HTTPException(status.HTTP_409_CONFLICT, "Session is not active")
    if not s.open_to_join:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "This game is not open to new players")
    if db.get(SessionParticipant, (s.id, user.id)) is None:
        db.add(SessionParticipant(session_id=s.id, user_id=user.id))
        s.players_count += 1
    db.commit()
    db.refresh(s)
    return _session_out(s)


# ---- "notify me when the court frees up" ----
@router.post("/courts/{court_id}/watch", status_code=204)
def watch(court_id: uuid.UUID, db: DB, user: CurrentUser) -> None:
    if db.get(Court, court_id) is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Court not found")
    if db.get(CourtWatch, (user.id, court_id)) is None:
        db.add(CourtWatch(user_id=user.id, court_id=court_id))
        db.commit()


@router.delete("/courts/{court_id}/watch", status_code=204)
def unwatch(court_id: uuid.UUID, db: DB, user: CurrentUser) -> None:
    w = db.get(CourtWatch, (user.id, court_id))
    if w:
        db.delete(w)
        db.commit()


# ---- history ----
@router.get("/me/history", response_model=list[CourtListItem], tags=["me"])
def history(
    db: DB,
    user: CurrentUser,
    lat: Annotated[float, Query(ge=-90, le=90)],
    lng: Annotated[float, Query(ge=-180, le=180)],
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
) -> list[CourtListItem]:
    last_played = (
        select(CourtSession.court_id, func.max(SessionParticipant.joined_at).label("last"))
        .join(SessionParticipant, SessionParticipant.session_id == CourtSession.id)
        .where(SessionParticipant.user_id == user.id)
        .group_by(CourtSession.court_id)
        .subquery()
    )
    stmt, *_ = _court_query(lat, lng)
    stmt = stmt.join(last_played, last_played.c.court_id == Court.id).order_by(last_played.c.last.desc()).limit(limit)
    return [_list_item(r) for r in db.execute(stmt)]

