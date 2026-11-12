"""Seed demo courts around Tel Aviv and Be'er Sheva.  Run: python -m app.seed"""

from sqlalchemy import select

from app.db import SessionLocal
from app.geo import make_point
from app.models import Court, Sport

COURTS = [
    # name, sport, paid, lat, lng, address
    ("Gordon Beach Courts", Sport.basketball, False, 32.0837, 34.7682, "Gordon Beach, Tel Aviv"),
    ("Yarkon Park Football Pitch", Sport.football, False, 32.0989, 34.8090, "Yarkon Park, Tel Aviv"),
    ("Hadar Yosef Tennis Center", Sport.tennis, True, 32.1063, 34.8189, "Hadar Yosef, Tel Aviv"),
    ("Meir Park Basketball", Sport.basketball, False, 32.0750, 34.7745, "Meir Garden, Tel Aviv"),
    ("Jaffa Port Mini-Pitch", Sport.football, False, 32.0537, 34.7522, "Jaffa Port"),
    ("Ramat Aviv Tennis Club", Sport.tennis, True, 32.1135, 34.7980, "Ramat Aviv"),
    ("Kiryat Shalom Futsal", Sport.football, True, 32.0450, 34.7880, "Kiryat Shalom, Tel Aviv"),
    ("BGU Sports Center Courts", Sport.basketball, True, 31.2622, 34.8015, "Ben-Gurion University, Be'er Sheva"),
    ("Park HaNahal Pitch", Sport.football, False, 31.2440, 34.8100, "River Park, Be'er Sheva"),
    ("Neve Noy Tennis Courts", Sport.tennis, False, 31.2560, 34.7840, "Neve Noy, Be'er Sheva"),
    ("Ramot Basketball Court", Sport.basketball, False, 31.2740, 34.8160, "Ramot, Be'er Sheva"),
]


def main() -> None:
    with SessionLocal() as db:
        existing = set(db.scalars(select(Court.name)))
        added = 0
        for name, sport, paid, lat, lng, address in COURTS:
            if name in existing:
                continue
            db.add(Court(name=name, sport=sport, is_paid=paid, location=make_point(lat, lng), address=address))
            added += 1
        db.commit()
        print(f"seeded {added} courts")


if __name__ == "__main__":
    main()
