"""Background job for court-session timers.

- 15 minutes before a session ends, push a warning to the holder (they can extend by 45 min).
- When a session ends (released or timed out), push "court is free" to everyone watching it.
"""

import logging
import threading
from datetime import UTC, datetime, timedelta

from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.config import get_settings
from app.db import SessionLocal
from app.models import Court, CourtSession, CourtWatch, User
from app.push import send_push

log = logging.getLogger(__name__)


def run_once(db: Session, now: datetime | None = None) -> dict[str, int]:
    now = now or datetime.now(UTC)
    cfg = get_settings()
    warned = freed = 0

    # 1) "15 minutes left" warnings
    due = db.scalars(
        select(CourtSession)
        .where(
            CourtSession.ended_at.is_(None),
            CourtSession.warned_at.is_(None),
            CourtSession.expires_at > now,
            CourtSession.expires_at <= now + timedelta(minutes=cfg.warn_before_minutes),
        )
        .with_for_update(skip_locked=True, of=CourtSession)
    ).all()
    for s in due:
        court = db.get(Court, s.court_id)
        can_extend = s.extensions < cfg.max_extensions
        send_push(
            [s.holder.expo_push_token],
            f"{court.name}: {cfg.warn_before_minutes} minutes left",
            f"Swipe down to add {cfg.extend_minutes} minutes" if can_extend else "The court will be released soon",
            {"type": "session_warning", "session_id": str(s.id), "court_id": str(s.court_id), "can_extend": can_extend},
            category="session_warning" if can_extend else None,
        )
        s.warned_at = now
        warned += 1

    # 2) court freed -> notify watchers
    ended = db.scalars(
        select(CourtSession)
        .where(
            CourtSession.freed_notified.is_(False),
            or_(CourtSession.ended_at.is_not(None), CourtSession.expires_at <= now),
        )
        .with_for_update(skip_locked=True, of=CourtSession)
    ).all()
    for s in ended:
        s.freed_notified = True
        if s.ended_at is None:
            s.ended_at = s.expires_at
        court = db.get(Court, s.court_id)
        watches = db.scalars(select(CourtWatch).where(CourtWatch.court_id == s.court_id)).all()
        if watches:
            tokens = db.scalars(select(User.expo_push_token).where(User.id.in_([w.user_id for w in watches]))).all()
            send_push(
                tokens,
                f"{court.name} is free",
                "Tap to take the court", {"type": "court_free", "court_id": str(court.id)},
                category="court_free",
            )
            for w in watches:
                db.delete(w)  # one-shot
        freed += 1

    db.commit()
    return {"warned": warned, "freed": freed}


def start(stop: threading.Event) -> threading.Thread:
    interval = get_settings().scheduler_interval_s

    def loop() -> None:
        while not stop.wait(interval):
            try:
                with SessionLocal() as db:
                    run_once(db)
            except Exception:
                log.exception("scheduler tick failed")

    t = threading.Thread(target=loop, name="court-scheduler", daemon=True)
    t.start()
    return t
