import type {
  Fixture,
  League,
  Player,
  Squad,
  Standing,
  Team,
  Transfer,
} from "@football-portal/shared-types";

/**
 * Fully fictional sample data used whenever API_FOOTBALL_KEY is not set, so
 * `pnpm dev` produces a working, browsable app with no external account
 * needed. None of these teams, players or competitions represent real
 * entities — swap in a real API-Football key to get live data instead.
 */

// Served by the web app's /public/logos folder (see apps/web/public/logos/*.svg) — fictional
// crests since these are fictional demo teams. A real API_FOOTBALL_KEY replaces these entirely
// with the provider's own absolute logo URLs (api-football.mappers.ts passes them through as-is).
export const MOCK_TEAMS: Record<number, Team> = {
  101: { id: 101, name: "Atlas United", shortName: "ATU", logo: "/logos/atlas-united.svg", country: "Fictionland", founded: 1948, venue: "Meridian Stadium" },
  102: { id: 102, name: "Silvermere United", shortName: "SIL", logo: "/logos/silvermere-united.svg", country: "Fictionland", founded: 1911, venue: "Silvermere Park" },
  103: { id: 103, name: "Ironbridge Rovers", shortName: "IBR", logo: "/logos/ironbridge-rovers.svg", country: "Fictionland", founded: 1967, venue: "Ironbridge Ground" },
  104: { id: 104, name: "Northgate Athletic", shortName: "NGA", logo: "/logos/northgate-athletic.svg", country: "Fictionland", founded: 1923, venue: "Northgate Arena" },
  105: { id: 105, name: "Harbor City FC", shortName: "HCF", logo: "/logos/harbor-city-fc.svg", country: "Fictionland", founded: 1955, venue: "Harborside Stadium" },
  106: { id: 106, name: "Kestrel Town", shortName: "KTN", logo: "/logos/kestrel-town.svg", country: "Fictionland", founded: 1932, venue: "Kestrel Field" },
  107: { id: 107, name: "Bellcross FC", shortName: "BLX", logo: "/logos/bellcross-fc.svg", country: "Fictionland", founded: 1979, venue: "Bellcross Park" },
  108: { id: 108, name: "Foxhall Rovers", shortName: "FXH", logo: "/logos/foxhall-rovers.svg", country: "Fictionland", founded: 1961, venue: "Foxhall Ground" },
};

export const FAVORITE_TEAM_ID = 101;

export const MOCK_LEAGUES: League[] = [
  {
    id: 1,
    name: "Premier Division",
    type: "League",
    logo: null,
    country: { name: "Fictionland", code: "FL", flag: null },
    season: 2026,
  },
  {
    id: 2,
    name: "National Cup",
    type: "Cup",
    logo: null,
    country: { name: "Fictionland", code: "FL", flag: null },
    season: 2026,
  },
  {
    id: 3,
    name: "Continental Trophy",
    type: "Cup",
    logo: null,
    country: { name: "World", code: null, flag: null },
    season: 2026,
  },
  {
    id: 4,
    name: "Meridia First Division",
    type: "League",
    logo: null,
    country: { name: "Meridia", code: "MD", flag: null },
    season: 2026,
  },
  {
    id: 5,
    name: "Northshore Championship",
    type: "League",
    logo: null,
    country: { name: "Northshore", code: "NS", flag: null },
    season: 2026,
  },
];

const standingRow = (
  rank: number,
  teamId: number,
  points: number,
  played: number,
  win: number,
  draw: number,
  lose: number,
  goalsFor: number,
  goalsAgainst: number,
  form: string,
) => ({
  rank,
  team: { id: MOCK_TEAMS[teamId].id, name: MOCK_TEAMS[teamId].name, logo: MOCK_TEAMS[teamId].logo },
  points,
  played,
  win,
  draw,
  lose,
  goalsFor,
  goalsAgainst,
  goalsDiff: goalsFor - goalsAgainst,
  form,
});

export const MOCK_STANDINGS: Standing = {
  leagueId: 1,
  leagueName: "Premier Division",
  season: 2026,
  table: [
    standingRow(1, 102, 16, 6, 5, 1, 0, 14, 3, "WWWDW"),
    standingRow(2, 101, 13, 6, 4, 1, 1, 11, 3, "WWDWL"),
    standingRow(3, 103, 12, 6, 4, 0, 2, 9, 4, "WLWWW"),
    standingRow(4, 104, 11, 6, 3, 2, 1, 8, 5, "DWWLD"),
    standingRow(5, 105, 8, 6, 2, 2, 2, 6, 6, "LDWLW"),
    standingRow(6, 106, 6, 6, 1, 3, 2, 5, 7, "DDLWL"),
    standingRow(7, 107, 4, 6, 1, 1, 4, 4, 10, "LLWLL"),
    standingRow(8, 108, 2, 6, 0, 2, 4, 2, 11, "LLDLL"),
  ],
};

export const MOCK_SQUAD: Squad = {
  team: { id: 101, name: "Atlas United", logo: MOCK_TEAMS[101].logo },
  players: [
    { id: 1, name: "M. Keller", age: 29, number: 1, position: "Goalkeeper", photo: null, nationality: "Fictionland" },
    { id: 2, name: "A. Costa", age: 26, number: 2, position: "Defender", photo: null, nationality: "Fictionland" },
    { id: 3, name: "R. Salvi", age: 24, number: 3, position: "Defender", photo: null, nationality: "Meridia" },
    { id: 4, name: "D. Reyes", age: 28, number: 4, position: "Defender", photo: null, nationality: "Fictionland" },
    { id: 6, name: "H. Björk", age: 27, number: 6, position: "Midfielder", photo: null, nationality: "Northshore" },
    { id: 8, name: "J. Novak", age: 25, number: 8, position: "Midfielder", photo: null, nationality: "Fictionland" },
    { id: 9, name: "T. Okafor", age: 23, number: 9, position: "Attacker", photo: null, nationality: "Fictionland" },
    { id: 11, name: "P. Lindt", age: 22, number: 11, position: "Attacker", photo: null, nationality: "Meridia" },
  ] satisfies Player[],
};

export const MOCK_TRANSFERS: Transfer[] = [
  { id: "t1", playerName: "N. Torres", playerPhoto: null, direction: "IN", otherClub: "Kestrel Town", fee: "$4.2M", status: "COMPLETED", date: "2026-08-14" },
  { id: "t2", playerName: "E. Marsh", playerPhoto: null, direction: "IN", otherClub: "Foxhall Rovers", fee: "$1.8M", status: "IN_TALKS", date: null },
  { id: "t3", playerName: "Y. Haddad", playerPhoto: null, direction: "IN", otherClub: "Bellcross FC", fee: null, status: "RUMOUR", date: null },
  { id: "t4", playerName: "C. Duval", playerPhoto: null, direction: "OUT", otherClub: "Northgate Athletic", fee: "$2.5M", status: "COMPLETED", date: "2026-08-02" },
  { id: "t5", playerName: "S. Adeyemi", playerPhoto: null, direction: "OUT", otherClub: "Silvermere United", fee: null, status: "RUMOUR", date: null },
];

let mockElapsed = 34;

function buildFixture(
  id: number,
  homeId: number,
  awayId: number,
  homeGoals: number | null,
  awayGoals: number | null,
  status: Fixture["status"],
  elapsed: number | null,
  minutesFromNow: number,
  leagueId: number,
  leagueName: string,
): Fixture {
  return {
    id,
    date: new Date(Date.now() + minutesFromNow * 60_000).toISOString(),
    status,
    elapsedMinutes: elapsed,
    venue: MOCK_TEAMS[homeId].venue,
    league: { id: leagueId, name: leagueName, logo: null, country: MOCK_TEAMS[homeId].country },
    home: { team: { id: MOCK_TEAMS[homeId].id, name: MOCK_TEAMS[homeId].name, logo: MOCK_TEAMS[homeId].logo }, goals: homeGoals },
    away: { team: { id: MOCK_TEAMS[awayId].id, name: MOCK_TEAMS[awayId].name, logo: MOCK_TEAMS[awayId].logo }, goals: awayGoals },
  };
}

export function getMockLiveFixtures(): Fixture[] {
  // Nudge the "live" match forward each poll so the WebSocket demo visibly updates.
  mockElapsed = mockElapsed >= 90 ? 34 : mockElapsed + 1;
  return [
    buildFixture(9001, 104, 106, 2, 1, "LIVE", mockElapsed, 0, 1, "Premier Division"),
    buildFixture(9002, 107, 108, 0, 0, "LIVE", Math.max(1, mockElapsed - 10), 0, 1, "Premier Division"),
  ];
}

export function getMockTodayFixtures(): Fixture[] {
  return [
    ...getMockLiveFixtures(),
    buildFixture(9003, 101, 103, null, null, "SCHEDULED", null, 6 * 60, 1, "Premier Division"),
    buildFixture(9004, 102, 105, null, null, "SCHEDULED", null, 8 * 60, 1, "Premier Division"),
  ];
}

export function getMockLastResult(): Fixture {
  return buildFixture(8999, 101, 105, 2, 1, "FINISHED", 90, -2 * 24 * 60, 1, "Premier Division");
}

export function getMockNextFixture(): Fixture {
  return buildFixture(9010, 101, 103, null, null, "SCHEDULED", null, 6 * 24 * 60, 1, "Premier Division");
}

export function searchMockFixturesByTeam(query: string): Fixture[] {
  const q = query.trim().toLowerCase();
  const all = [...getMockTodayFixtures(), getMockLastResult(), getMockNextFixture()];
  if (!q) return all;
  return all.filter(
    (f) => f.home.team.name.toLowerCase().includes(q) || f.away.team.name.toLowerCase().includes(q),
  );
}
