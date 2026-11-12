# Football Portal

A football portal built as an SSR Next.js frontend + NestJS backend monorepo:

- **Home** — your favorite team's hero card, last result, next fixture, league standings, competitions, full squad and transfer market.
- **Live Matches** — every match live around the world right now, today's fixtures, and search by team. Scores update over WebSocket, pushed from the backend — the browser never polls.
- **Leagues** — every league/competition available, grouped by country.

## Stack

| Layer | Choice |
| --- | --- |
| Frontend | Next.js 14 (App Router, SSR) |
| Backend | NestJS |
| Data source | [API-Football](https://www.api-football.com/) (RapidAPI) |
| Real-time | Backend polls API-Football server-side and rebroadcasts diffs over its own Socket.io WebSocket gateway — no data provider offers an affordable public push feed, so this is the standard way to get a real-time feel on top of a REST provider |
| DB | PostgreSQL via Prisma (users + favorite team) |
| Cache | Redis (falls back to in-memory automatically if Redis isn't running, so local dev works without Docker) |
| Auth | JWT, issued by NestJS, stored as an httpOnly cookie by Next.js route handlers |

## Monorepo layout

```
apps/
  web/    Next.js frontend
  api/    NestJS backend
packages/
  shared-types/   TS interfaces shared by both apps (League, Team, Fixture, Standing, ...)
```

## Demo mode (no API key needed)

The backend runs in **MOCK_MODE** whenever `API_FOOTBALL_KEY` is unset, serving realistic sample
data for a fictional league (Atlas United and rivals) so the whole app — including the WebSocket
live-score feed — works immediately with `pnpm dev`. A banner in the UI says when you're in demo
mode. Swap in a real API-Football key to switch to live data automatically.

## Getting started

1. **Install dependencies** (this is a pnpm workspace):
   ```bash
   pnpm install
   ```

2. **Start Postgres + Redis** (or point `DATABASE_URL`/`REDIS_URL` at your own instances):
   ```bash
   docker compose up -d
   ```

3. **Configure env vars**:
   ```bash
   cp apps/api/.env.example apps/api/.env
   cp apps/web/.env.example apps/web/.env
   ```
   To use live data instead of demo mode, sign up at [RapidAPI's API-Football](https://rapidapi.com/api-sports/api/api-football)
   and paste your key into `apps/api/.env` as `API_FOOTBALL_KEY`. Leave it blank to stay in demo mode.

4. **Run database migrations**:
   ```bash
   pnpm --filter @football-portal/api exec prisma migrate dev
   ```

5. **Run both apps**:
   ```bash
   pnpm dev
   ```
   - Web: http://localhost:3000
   - API: http://localhost:4000/api

## Notes on API-Football field mapping

The response-mapping code in `apps/api/src/football/api-football.mappers.ts` follows API-Football's
documented v3 schema, but hasn't been exercised against a live key in this environment (no key was
available while building this). If a field looks off once you plug in a real key, that file is the
one place to fix it — everything downstream (controllers, WebSocket gateway, frontend) consumes the
already-mapped shared types and shouldn't need to change.

Also worth knowing: free-tier API-Football plans often don't include `/transfers` or full `/players/squads`
data for every league. `getTransfers`/`getSquad` in `football-api.service.ts` degrade gracefully
(empty list / 404) if your plan doesn't cover a given team.

Note: running `pnpm build` for `apps/web` while the API isn't running will print noisy
`ECONNREFUSED`/`fetch failed` lines during Next's build-time page analysis — harmless, since every
page here reads cookies and is correctly marked dynamic (`ƒ`) in the final route table, so nothing
is actually pre-rendered against the API at build time.

## Scripts

- `pnpm dev` — run both apps in watch mode
- `pnpm build` — build both apps
- `pnpm typecheck` — typecheck both apps + shared-types
- `pnpm --filter @football-portal/api exec prisma studio` — browse the Postgres data
