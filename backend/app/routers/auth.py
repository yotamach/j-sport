import re
import secrets

import httpx
from fastapi import APIRouter, HTTPException, status
from sqlalchemy import func, or_, select

from app.deps import DB
from app.models import User
from app.schemas import FacebookIn, LoginIn, RegisterIn, TokenOut
from app.security import create_token, hash_password, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])

FB_GRAPH = "https://graph.facebook.com/me"


def _token(user: User) -> TokenOut:
    return TokenOut(access_token=create_token(user.id), needs_onboarding=user.favorite_sport is None)


@router.post("/register", response_model=TokenOut, status_code=201)
def register(body: RegisterIn, db: DB) -> TokenOut:
    taken = db.scalar(
        select(User.id).where(
            or_(func.lower(User.email) == body.email.lower(), func.lower(User.username) == body.username.lower())
        )
    )
    if taken:
        raise HTTPException(status.HTTP_409_CONFLICT, "Email or username already taken")
    user = User(
        email=body.email.lower(),
        username=body.username,
        password_hash=hash_password(body.password),
        favorite_sport=body.favorite_sport,
        full_name=body.full_name,
        phone=body.phone,
        address=body.address,
    )
    db.add(user)
    db.commit()
    return _token(user)


@router.post("/login", response_model=TokenOut)
def login(body: LoginIn, db: DB) -> TokenOut:
    ident = body.login.strip().lower()
    user = db.scalar(select(User).where(or_(func.lower(User.email) == ident, func.lower(User.username) == ident)))
    if user is None or not verify_password(body.password, user.password_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Wrong login or password")
    return _token(user)


def fetch_facebook_profile(access_token: str) -> dict:
    """Read only the fields registration needs (spec: no access to the wider profile)."""
    r = httpx.get(FB_GRAPH, params={"fields": "id,name,email,picture.type(large)", "access_token": access_token})
    if r.status_code != 200:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid Facebook token")
    return r.json()


def _unique_username(db: DB, name: str) -> str:
    base = re.sub(r"[^\w]", "", name.lower())[:40] or "player"
    candidate = base
    while db.scalar(select(User.id).where(func.lower(User.username) == candidate)):
        candidate = f"{base}{secrets.randbelow(10_000)}"
    return candidate


@router.post("/facebook", response_model=TokenOut)
def facebook(body: FacebookIn, db: DB) -> TokenOut:
    profile = fetch_facebook_profile(body.access_token)
    user = db.scalar(select(User).where(User.facebook_id == profile["id"]))
    if user is None and profile.get("email"):
        user = db.scalar(select(User).where(func.lower(User.email) == profile["email"].lower()))
        if user:
            user.facebook_id = profile["id"]
    if user is None:
        user = User(
            email=(profile.get("email") or f"fb_{profile['id']}@users.jsport.local").lower(),
            username=_unique_username(db, profile.get("name", "")),
            facebook_id=profile["id"],
            full_name=profile.get("name"),
            avatar_url=profile.get("picture", {}).get("data", {}).get("url"),
        )
        db.add(user)
    db.commit()
    # New Facebook users have no favorite sport yet -> app shows the mandatory onboarding step.
    return _token(user)
