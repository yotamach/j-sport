export interface Country {
  name: string;
  code: string | null;
  flag: string | null;
}

export interface League {
  id: number;
  name: string;
  type: "League" | "Cup";
  logo: string | null;
  country: Country;
  season: number;
}

export interface Team {
  id: number;
  name: string;
  shortName: string | null;
  logo: string | null;
  country: string | null;
  founded: number | null;
  venue: string | null;
}

export interface StandingRow {
  rank: number;
  team: Pick<Team, "id" | "name" | "logo">;
  points: number;
  played: number;
  win: number;
  draw: number;
  lose: number;
  goalsFor: number;
  goalsAgainst: number;
  goalsDiff: number;
  form: string | null;
}

export interface Standing {
  leagueId: number;
  leagueName: string;
  season: number;
  table: StandingRow[];
}

export type FixtureStatus =
  | "SCHEDULED"
  | "LIVE"
  | "HALFTIME"
  | "FINISHED"
  | "POSTPONED"
  | "CANCELLED";

export interface FixtureTeamScore {
  team: Pick<Team, "id" | "name" | "logo">;
  goals: number | null;
}

export interface Fixture {
  id: number;
  date: string; // ISO
  status: FixtureStatus;
  elapsedMinutes: number | null;
  venue: string | null;
  league: Pick<League, "id" | "name" | "logo"> & { country: string | null };
  home: FixtureTeamScore;
  away: FixtureTeamScore;
}

export type PlayerPosition = "Goalkeeper" | "Defender" | "Midfielder" | "Attacker";

export interface Player {
  id: number;
  name: string;
  age: number | null;
  number: number | null;
  position: PlayerPosition | null;
  photo: string | null;
  nationality: string | null;
}

export interface Squad {
  team: Pick<Team, "id" | "name" | "logo">;
  players: Player[];
}

export type TransferDirection = "IN" | "OUT";
export type TransferStatus = "COMPLETED" | "IN_TALKS" | "RUMOUR";

export interface Transfer {
  id: string;
  playerName: string;
  playerPhoto: string | null;
  direction: TransferDirection;
  otherClub: string;
  fee: string | null;
  status: TransferStatus;
  date: string | null;
}

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  favoriteTeamId: number | null;
  favoriteTeamName: string | null;
}

export interface RegisterDto {
  email: string;
  password: string;
  displayName: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  user: AuthUser;
}

export interface SetFavoriteTeamDto {
  teamId: number;
}

// WebSocket event payloads (live scores gateway)
export const LIVE_EVENTS = {
  SNAPSHOT: "live:snapshot",
  UPDATE: "live:update",
  SUBSCRIBE: "live:subscribe",
  UNSUBSCRIBE: "live:unsubscribe",
} as const;

export interface LiveUpdatePayload {
  fixture: Fixture;
}

export interface LiveSnapshotPayload {
  fixtures: Fixture[];
}
