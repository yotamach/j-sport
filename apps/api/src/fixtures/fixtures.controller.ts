import { Controller, Get, Query } from "@nestjs/common";
import { FootballApiService } from "../football/football-api.service";

@Controller("fixtures")
export class FixturesController {
  constructor(private readonly football: FootballApiService) {}

  @Get("live")
  async live() {
    return this.football.getLiveFixtures();
  }

  @Get("today")
  async today() {
    return this.football.getTodayFixtures();
  }

  @Get("search")
  async search(@Query("team") team: string) {
    if (!team || team.trim().length < 2) return [];
    return this.football.searchFixturesByTeamName(team);
  }
}
