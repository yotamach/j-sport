import { Controller, Get, NotFoundException, Param, ParseIntPipe, Query } from "@nestjs/common";
import { FootballApiService } from "../football/football-api.service";

@Controller("leagues")
export class LeaguesController {
  constructor(private readonly football: FootballApiService) {}

  @Get()
  async list() {
    return this.football.getLeagues();
  }

  @Get(":id/teams")
  async teams(@Param("id", ParseIntPipe) id: number, @Query("season") season?: string) {
    const year = season ? parseInt(season, 10) : new Date().getFullYear();
    return this.football.getTeamsByLeague(id, year);
  }

  @Get(":id/standings")
  async standings(
    @Param("id", ParseIntPipe) id: number,
    @Query("season") season?: string,
  ) {
    const year = season ? parseInt(season, 10) : new Date().getFullYear();
    const standing = await this.football.getStandings(id, year);
    if (!standing) throw new NotFoundException("Standings not found for this league/season");
    return standing;
  }
}
