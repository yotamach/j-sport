# Jsport

A GPS-based sports social network: find free and occupied courts near you, take a court for a game, and meet people to play with. Built from `Jsport_HLD_0.0`.

```
jsport/
├── backend/   FastAPI + SQLAlchemy 2 + PostGIS (Python 3.12+)
├── mobile/    Expo SDK 58 + expo-router + TanStack Query (TypeScript)
└── docker-compose.yml
```

## What's in this MVP (phase 1)

| Spec section | Status |
|---|---|
| Splash screen, sign-up (email) and Facebook login; favorite sport is required before first use | ✅ |
| Home top bar: menu (left), app name → home (center), profile (right) | ✅ |
| "Show" filter: all / free / occupied / paid, with a sport sub-filter for free/occupied | ✅ |
| Radius: 1 (default) / 5 / 10 / 20 / 30 / 50 km / custom | ✅ |
| Court list: name, distance, green/red status, sorted by distance | ✅ |
| Court screen: photo (camera/library upload), name, distance, play count, status, navigation via Waze/Google/Apple Maps | ✅ |
| Take court: players count, "looking for players", chat lock; 90-min timer | ✅ |
| Occupied court: read-only options, countdown, who holds it, join if open | ✅ |
| Recent players and players near the court (same sport, within 2 km) | ✅ |
| Notifications: court freed (long-press a row), 15-min warning with **+45 min** action, release from the banner | ✅ (Expo push) |
| Profile screen, History, About | ✅ |
| Side menu (75% width, left to right) | ✅ (other items open "coming soon" screens) |
| Friends, Tournaments, Teams, Challenge/rankings, Chats, Search, Favorites, Settings | ⏭ phase 2 |

## Run it

### Backend
```bash
docker compose up -d db            # PostGIS on :5432
cd backend
uv sync                             # or: pip install -e . pytest
cp .env.example .env
alembic upgrade head
python -m app.seed                  # demo courts in Tel Aviv and Be'er Sheva
uvicorn app.main:app --reload --host 0.0.0.0
```
API docs: http://localhost:8000/docs. Or run everything with `docker compose up --build`.

Tests run against a real PostGIS database:
```bash
createdb jsport_test && psql -d jsport_test -c 'CREATE EXTENSION postgis'
pytest
```

### Mobile
```bash
cd mobile
npm install
EXPO_PUBLIC_API_URL=http://<your-LAN-IP>:8000 npx expo start
```
- Push notifications need a physical device and an EAS project id (`npx eas-cli init`). Interactive banner actions need a development build (`npx expo run:ios|android`) rather than Expo Go.
- Facebook login appears once `EXPO_PUBLIC_FACEBOOK_APP_ID` is set. The backend checks the token against the Graph API and reads only id, name, email and picture.
- To test with the seed data in a simulator, set the simulated location to Tel Aviv (32.08, 34.78).

## API overview

| Method | Path | |
|---|---|---|
| POST | `/auth/register`, `/auth/login`, `/auth/facebook` | Returns JWT + `needs_onboarding` |
| GET/PATCH | `/me` | Profile |
| PUT | `/me/location`, `/me/push-token` | Last known location / Expo push token |
| GET | `/me/history?lat&lng` | Courts I played at, with live status |
| GET | `/courts?lat&lng&radius_km&filter&sport&order` | Nearby courts (PostGIS `ST_DWithin`) |
| GET | `/courts/{id}?lat&lng` | Court details, active session, recent and nearby players |
| POST | `/courts/{id}/photo` | Upload a photo (JPEG/PNG/WebP, max 8 MB) |
| POST | `/courts/{id}/sessions` | Take the court (409 if occupied or you already hold one) |
| POST | `/sessions/{id}/release` · `/extend` · `/join` | Holder-only release/extend (+45, once); join if open |
| POST/DELETE | `/courts/{id}/watch` | One-shot "tell me when it's free" |

**Timers:** a session is active while `ended_at IS NULL AND expires_at > now()`, so status never depends on a cron. A background loop (`app/scheduler.py`, every 30 s) sends the 15-minute warning and the "court is free" pushes. With more than one API instance, move it to a single worker, or keep it as is: rows are claimed with `FOR UPDATE SKIP LOCKED`.

Durations are set in `.env`: `SESSION_MINUTES`, `EXTEND_MINUTES`, `WARN_BEFORE_MINUTES`, `MAX_EXTENSIONS`.

## Notes on the spec
- **Sort order:** the spec's example puts the farthest court first. The list defaults to nearest first, and `order=desc` gives the spec's order if that was intended.
- **"Friends who played here"** needs the Friends module, so for now the court screen shows how many distinct players have played there.
- UI strings are in English; Hebrew/RTL is a phase 2 item.
