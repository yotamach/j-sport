import enum
import uuid
from datetime import datetime

from geoalchemy2 import Geography
from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Integer, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base


class Sport(str, enum.Enum):
    football = "football"
    basketball = "basketball"
    tennis = "tennis"


sport_enum = Enum(Sport, name="sport")
# Spatial indexes are created explicitly in the migration.
point = Geography(geometry_type="POINT", srid=4326, spatial_index=False)


def _uuid() -> Mapped[uuid.UUID]:
    return mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)


def _now() -> Mapped[datetime]:
    return mapped_column(DateTime(timezone=True), server_default=func.now())


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = _uuid()
    email: Mapped[str] = mapped_column(String(255), unique=True)
    username: Mapped[str] = mapped_column(String(50), unique=True)
    password_hash: Mapped[str | None] = mapped_column(String(255))
    facebook_id: Mapped[str | None] = mapped_column(String(64), unique=True)
    full_name: Mapped[str | None] = mapped_column(String(120))
    phone: Mapped[str | None] = mapped_column(String(32))
    address: Mapped[str | None] = mapped_column(String(255))
    avatar_url: Mapped[str | None] = mapped_column(String(512))
    favorite_sport: Mapped[Sport | None] = mapped_column(sport_enum)
    last_location = mapped_column(point, nullable=True)
    last_seen_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    expo_push_token: Mapped[str | None] = mapped_column(String(255))
    created_at: Mapped[datetime] = _now()


class Court(Base):
    __tablename__ = "courts"

    id: Mapped[uuid.UUID] = _uuid()
    name: Mapped[str] = mapped_column(String(120))
    sport: Mapped[Sport] = mapped_column(sport_enum)
    is_paid: Mapped[bool] = mapped_column(Boolean, default=False)
    location = mapped_column(point, nullable=False)
    address: Mapped[str | None] = mapped_column(String(255))
    photo_url: Mapped[str | None] = mapped_column(String(512))
    created_at: Mapped[datetime] = _now()


class CourtSession(Base):
    """A court check-in ("תפוס מגרש"). Active while ended_at is null and expires_at > now."""

    __tablename__ = "court_sessions"

    id: Mapped[uuid.UUID] = _uuid()
    court_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("courts.id", ondelete="CASCADE"), index=True)
    holder_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    players_count: Mapped[int] = mapped_column(Integer, default=1)
    open_to_join: Mapped[bool] = mapped_column(Boolean, default=False)
    chat_locked: Mapped[bool] = mapped_column(Boolean, default=False)
    started_at: Mapped[datetime] = _now()
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    ended_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    extensions: Mapped[int] = mapped_column(Integer, default=0)
    warned_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    freed_notified: Mapped[bool] = mapped_column(Boolean, default=False)

    holder: Mapped[User] = relationship(lazy="joined")


class SessionParticipant(Base):
    __tablename__ = "session_participants"

    session_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("court_sessions.id", ondelete="CASCADE"), primary_key=True
    )
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    joined_at: Mapped[datetime] = _now()


class CourtWatch(Base):
    """'Notify me when the court frees up'."""

    __tablename__ = "court_watches"

    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    court_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("courts.id", ondelete="CASCADE"), primary_key=True)
    created_at: Mapped[datetime] = _now()
