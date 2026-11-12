import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models import Sport


class LatLng(BaseModel):
    lat: float = Field(ge=-90, le=90)
    lng: float = Field(ge=-180, le=180)


# ---- auth ----
class RegisterIn(BaseModel):
    email: EmailStr
    username: str = Field(min_length=3, max_length=50, pattern=r"^[\w.\-]+$")
    password: str = Field(min_length=8, max_length=128)
    favorite_sport: Sport
    full_name: str | None = None
    phone: str | None = None
    address: str | None = None


class LoginIn(BaseModel):
    login: str = Field(description="email or username")
    password: str


class FacebookIn(BaseModel):
    access_token: str


class TokenOut(BaseModel):
    access_token: str
    token_type: Literal["bearer"] = "bearer"
    needs_onboarding: bool


# ---- users ----
class UserPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    username: str
    full_name: str | None
    avatar_url: str | None
    favorite_sport: Sport | None


class UserMe(UserPublic):
    email: str  # may be a placeholder for Facebook users without an email
    phone: str | None
    address: str | None


class UserUpdate(BaseModel):
    full_name: str | None = None
    phone: str | None = None
    address: str | None = None
    avatar_url: str | None = None
    favorite_sport: Sport | None = None


class PushTokenIn(BaseModel):
    token: str | None


# ---- courts ----
CourtFilter = Literal["all", "free", "occupied", "paid"]
CourtStatus = Literal["free", "occupied"]


class ActiveSessionOut(BaseModel):
    id: uuid.UUID
    holder: UserPublic
    players_count: int
    open_to_join: bool
    chat_locked: bool
    started_at: datetime
    expires_at: datetime
    extensions: int


class CourtListItem(BaseModel):
    id: uuid.UUID
    name: str
    sport: Sport
    is_paid: bool
    lat: float
    lng: float
    distance_m: float
    status: CourtStatus
    expires_at: datetime | None
    players_count: int | None


class CourtDetail(CourtListItem):
    address: str | None
    photo_url: str | None
    players_played_count: int
    active_session: ActiveSessionOut | None
    recent_players: list[UserPublic]
    nearby_players: list[UserPublic]
    watching: bool


class ClaimIn(BaseModel):
    players_count: int = Field(default=1, ge=1, le=50)
    open_to_join: bool = False
    chat_locked: bool = False
