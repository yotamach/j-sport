from fastapi import APIRouter
from sqlalchemy import func

from app.deps import DB, CurrentUser
from app.geo import make_point
from app.models import User
from app.schemas import LatLng, PushTokenIn, UserMe, UserUpdate

router = APIRouter(prefix="/me", tags=["me"])


@router.get("", response_model=UserMe)
def me(user: CurrentUser) -> User:
    return user


@router.patch("", response_model=UserMe)
def update_me(body: UserUpdate, user: CurrentUser, db: DB) -> User:
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(user, field, value)
    db.commit()
    return user


@router.put("/location", status_code=204)
def update_location(body: LatLng, user: CurrentUser, db: DB) -> None:
    user.last_location = make_point(body.lat, body.lng)
    user.last_seen_at = func.now()
    db.commit()


@router.put("/push-token", status_code=204)
def update_push_token(body: PushTokenIn, user: CurrentUser, db: DB) -> None:
    user.expo_push_token = body.token
    db.commit()
