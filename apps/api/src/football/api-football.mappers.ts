import type {
  Fixture,
  FixtureStatus,
  League,
  Player,
  PlayerPosition,
  Squad,
  Standing,
  Team,
} from "@football-portal/shared-types";

/**
 * Maps raw API-Football v3 (RapidAPI) response bodies onto our own DTOs.
 * Field names follow API-Football's documented schema. Written defensively
 * (optional chaining + fallbacks) since this hasn't been exercised against
 * a live key in this environment — verify against real responses once
 * API_FOOTBALL_KEY is set, and adjust field paths here if the provider
 * has since changed them.
 */

const STATUS_MAP: Record<string, FixtureStatus> = {
  TBD: "SCHEDULED",
  NS: "SCHEDULED",
  "1H": "LIVE",
  HT: "HALFTIME",
  "2H": "LIVE",
  ET: "LIVE",
  BT: "HALFTIME",
  P: "LIVE",
  SUSP: "POSTPONED",
  INT: "POSTPONED",
  FT: "FINISHED",
  AET: "FINISHED",
  PEN: "FINISHED",
  PST: "POSTPONED",
  CANC: "CANCELLED",
  ABD: "CANCELLED",
  AWD: "FINISHED",
  WO: "FINISHED",
};

const POSITION_MAP: Record<string, PlayerPosition> = {
  Goalkeeper: "Goalkeeper",
  Defender: "Defender",
  Midfielder: "Midfielder",
  Attacker: "Attacker",
};

export function mapLeague(raw: any): League {
  const currentSeason =
    raw.seasons?.find((s: any) => s.current)?.year ?? raw.seasons?.at(-1)?.year ?? new Date().getFullYear();
  return {
    id: raw.league.id,
    name: raw.league.name,
    type: raw.league.type === "Cup" ? "Cup" : "League",
    logo: raw.league.logo ?? null,
    country: {
      name: raw.country?.name ?? "World",
      code: raw.country?.code ?? null,
      flag: raw.country?.flag ?? null,
    },
    season: currentSeason,
  };
}

export function mapTeam(raw: any): Team {
  return {
    id: raw.team.id,
    name: raw.team.name,
    shortName: raw.team.code ?? null,
    logo: raw.team.logo ?? null,
    country: raw.team.country ?? null,
    founded: raw.team.founded ?? null,
    venue: raw.venue?.name ?? null,
  };
}

export function mapStanding(raw: any): Standing {
  const league = raw.league;
  const rows = (league.standings?.[0] ?? []).map((row: any) => ({
    rank: row.rank,
    team: { id: row.team.id, name: row.team.name, logo: row.team.logo ?? null },
    points: row.points,
    played: row.all?.played ?? 0,
    win: row.all?.win ?? 0,
    draw: row.all?.draw ?? 0,
    lose: row.all?.lose ?? 0,
    goalsFor: row.all?.goals?.for ?? 0,
    goalsAgainst: row.all?.goals?.against ?? 0,
    goalsDiff: row.goalsDiff ?? (row.all?.goals?.for ?? 0) - (row.all?.goals?.against ?? 0),
    form: row.form ?? null,
  }));
  return {
    leagueId: league.id,
    leagueName: league.name,
    season: league.season,
    table: rows,
  };
}

export function mapSquad(raw: any): Squad {
  return {
    team: { id: raw.team.id, name: raw.team.name, logo: raw.team.logo ?? null },
    players: (raw.players ?? []).map(
      (p: any): Player => ({
        id: p.id,
        name: p.name,
        age: p.age ?? null,
        number: p.number ?? null,
        position: POSITION_MAP[p.position] ?? null,
        photo: p.photo ?? null,
        nationality: null,
      }),
    ),
  };
}

export function mapFixture(raw: any): Fixture {
  const shortStatus = raw.fixture?.status?.short ?? "NS";
  return {
    id: raw.fixture.id,
    date: raw.fixture.date,
    status: STATUS_MAP[shortStatus] ?? "SCHEDULED",
    elapsedMinutes: raw.fixture.status?.elapsed ?? null,
    venue: raw.fixture.venue?.name ?? null,
    league: {
      id: raw.league.id,
      name: raw.league.name,
      logo: raw.league.logo ?? null,
      country: raw.league.country ?? null,
    },
    home: {
      team: { id: raw.teams.home.id, name: raw.teams.home.name, logo: raw.teams.home.logo ?? null },
      goals: raw.goals?.home ?? null,
    },
    away: {
      team: { id: raw.teams.away.id, name: raw.teams.away.name, logo: raw.teams.away.logo ?? null },
      goals: raw.goals?.away ?? null,
    },
  };
}
