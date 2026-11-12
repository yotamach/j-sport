import { HttpService } from "@nestjs/axios";
import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { firstValueFrom } from "rxjs";
import type { Fixture, League, Squad, Standing, Team, Transfer } from "@football-portal/shared-types";
import type { AppConfig } from "../config/configuration";
import { RedisCacheService } from "../cache/redis-cache.service";
import { mapFixture, mapLeague, mapSquad, mapStanding, mapTeam } from "./api-football.mappers";
import {
  FAVORITE_TEAM_ID,
  getMockLastResult,
  getMockLiveFixtures,
  getMockNextFixture,
  getMockTodayFixtures,
  MOCK_LEAGUES,
  MOCK_SQUAD,
  MOCK_STANDINGS,
  MOCK_TEAMS,
  MOCK_TRANSFERS,
  searchMockFixturesByTeam,
} from "./mock-data";

const TTL = {
  LEAGUES: 60 * 60 * 24,
  STANDINGS: 60 * 5,
  TEAM: 60 * 60 * 24,
  SQUAD: 60 * 60 * 24,
  TRANSFERS: 60 * 60,
  FIXTURES_TODAY: 60,
} as const;

@Injectable()
export class FootballApiService {
  private readonly logger = new Logger(FootballApiService.name);
  private readonly config: AppConfig;

  constructor(
    private readonly http: HttpService,
    configService: ConfigService,
    private readonly cache: RedisCacheService,
  ) {
    this.config = configService.get<AppConfig>("app")!;
  }

  /** True when no API-Football key is configured; callers/UI can surface a "demo data" notice. */
  get isMockMode(): boolean {
    return !this.config.apiFootballKey;
  }

  get favoriteTeamId(): number {
    return FAVORITE_TEAM_ID;
  }

  private async request<T>(path: string, params: Record<string, string | number>): Promise<T> {
    const response = await firstValueFrom(
      this.http.get<T>(`https://${this.config.apiFootballHost}${path}`, {
        params,
        headers: {
          "x-apisports-key": this.config.apiFootballKey ?? "",
        },
      }),
    );
    return response.data;
  }

  async getLeagues(): Promise<League[]> {
    if (this.isMockMode) return MOCK_LEAGUES;
    return this.cache.getOrSet("leagues:all", TTL.LEAGUES, async () => {
      const data = await this.request<{ response: any[] }>("/leagues", { current: "true" });
      return data.response.map(mapLeague);
    });
  }

  async getLeaguesForTeam(teamId: number): Promise<League[]> {
    if (this.isMockMode) return teamId === FAVORITE_TEAM_ID ? MOCK_LEAGUES : [];
    return this.cache.getOrSet(`leagues:team:${teamId}`, TTL.LEAGUES, async () => {
      const data = await this.request<{ response: any[] }>("/leagues", { team: teamId, current: "true" });
      return data.response.map(mapLeague);
    });
  }

  async getStandings(leagueId: number, season: number): Promise<Standing | null> {
    if (this.isMockMode) return leagueId === MOCK_STANDINGS.leagueId ? MOCK_STANDINGS : null;
    return this.cache.getOrSet(`standings:${leagueId}:${season}`, TTL.STANDINGS, async () => {
      const data = await this.request<{ response: any[] }>("/standings", { league: leagueId, season });
      const first = data.response[0];
      return first ? mapStanding(first) : null;
    });
  }

  async getTeamsByLeague(leagueId: number, season: number): Promise<Team[]> {
    if (this.isMockMode) return leagueId === MOCK_STANDINGS.leagueId ? Object.values(MOCK_TEAMS) : [];
    return this.cache.getOrSet(`teams:league:${leagueId}:${season}`, TTL.LEAGUES, async () => {
      const data = await this.request<{ response: any[] }>("/teams", { league: leagueId, season });
      return data.response.map(mapTeam);
    });
  }

  async getTeam(teamId: number): Promise<Team | null> {
    if (this.isMockMode) return MOCK_TEAMS[teamId] ?? null;
    return this.cache.getOrSet(`team:${teamId}`, TTL.TEAM, async () => {
      const data = await this.request<{ response: any[] }>("/teams", { id: teamId });
      const first = data.response[0];
      return first ? mapTeam(first) : null;
    });
  }

  async getSquad(teamId: number): Promise<Squad | null> {
    if (this.isMockMode) return teamId === FAVORITE_TEAM_ID ? MOCK_SQUAD : null;
    return this.cache.getOrSet(`squad:${teamId}`, TTL.SQUAD, async () => {
      const data = await this.request<{ response: any[] }>("/players/squads", { team: teamId });
      const first = data.response[0];
      return first ? mapSquad(first) : null;
    });
  }

  /**
   * API-Football's `/transfers` endpoint is keyed by player, not shaped like
   * our Transfer DTO (in/out relative to one club). This flattens and tags
   * direction relative to `teamId`. Free-tier plans often exclude this
   * endpoint entirely — MOCK_MODE demonstrates the intended UI either way.
   */
  async getTransfers(teamId: number): Promise<Transfer[]> {
    if (this.isMockMode) return teamId === FAVORITE_TEAM_ID ? MOCK_TRANSFERS : [];
    return this.cache.getOrSet(`transfers:${teamId}`, TTL.TRANSFERS, async () => {
      const data = await this.request<{ response: any[] }>("/transfers", { team: teamId });
      const transfers: Transfer[] = [];
      for (const entry of data.response ?? []) {
        for (const t of entry.transfers ?? []) {
          const isIn = t.teams?.in?.id === teamId;
          const otherClub = isIn ? t.teams?.out?.name : t.teams?.in?.name;
          transfers.push({
            id: `${entry.player?.id}-${t.date}`,
            playerName: entry.player?.name ?? "Unknown",
            playerPhoto: entry.player?.photo ?? null,
            direction: isIn ? "IN" : "OUT",
            otherClub: otherClub ?? "Unknown",
            fee: typeof t.type === "string" && /\d/.test(t.type) ? t.type : null,
            status: "COMPLETED",
            date: t.date ?? null,
          });
        }
      }
      return transfers;
    });
  }

  async getLiveFixtures(): Promise<Fixture[]> {
    if (this.isMockMode) return getMockLiveFixtures();
    // Never cached — this is the source the WebSocket poller diffs against.
    const data = await this.request<{ response: any[] }>("/fixtures", { live: "all" });
    return data.response.map(mapFixture);
  }

  async getTodayFixtures(): Promise<Fixture[]> {
    if (this.isMockMode) return getMockTodayFixtures();
    return this.cache.getOrSet("fixtures:today", TTL.FIXTURES_TODAY, async () => {
      const date = new Date().toISOString().slice(0, 10);
      const data = await this.request<{ response: any[] }>("/fixtures", { date });
      return data.response.map(mapFixture);
    });
  }

  async searchFixturesByTeamName(query: string): Promise<Fixture[]> {
    if (this.isMockMode) return searchMockFixturesByTeam(query);
    const teams = await this.request<{ response: any[] }>("/teams", { search: query });
    const teamIds = teams.response.map((t: any) => t.team.id).slice(0, 5);
    const results = await Promise.all(
      teamIds.map((id) =>
        this.request<{ response: any[] }>("/fixtures", { team: id, next: 5 }).catch(() => ({ response: [] })),
      ),
    );
    return results.flatMap((r) => r.response.map(mapFixture));
  }

  async getLastResult(teamId: number): Promise<Fixture | null> {
    if (this.isMockMode) return teamId === FAVORITE_TEAM_ID ? getMockLastResult() : null;
    const data = await this.request<{ response: any[] }>("/fixtures", { team: teamId, last: 1 });
    return data.response[0] ? mapFixture(data.response[0]) : null;
  }

  async getNextFixture(teamId: number): Promise<Fixture | null> {
    if (this.isMockMode) return teamId === FAVORITE_TEAM_ID ? getMockNextFixture() : null;
    const data = await this.request<{ response: any[] }>("/fixtures", { team: teamId, next: 1 });
    return data.response[0] ? mapFixture(data.response[0]) : null;
  }
}
