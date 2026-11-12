import { Controller, Get, NotFoundException, Param, ParseIntPipe } from "@nestjs/common";
import { FootballApiService } from "../football/football-api.service";

@Controller("teams")
export class TeamsController {
  constructor(private readonly football: FootballApiService) {}

  @Get(":id")
  async detail(@Param("id", ParseIntPipe) id: number) {
    const team = await this.football.getTeam(id);
    if (!team) throw new NotFoundException("Team not found");
    return team;
  }

  @Get(":id/squad")
  async squad(@Param("id", ParseIntPipe) id: number) {
    const squad = await this.football.getSquad(id);
    if (!squad) throw new NotFoundException("Squad not found for this team");
    return squad;
  }

  @Get(":id/leagues")
  async leagues(@Param("id", ParseIntPipe) id: number) {
    return this.football.getLeaguesForTeam(id);
  }

  @Get(":id/transfers")
  async transfers(@Param("id", ParseIntPipe) id: number) {
    return this.football.getTransfers(id);
  }

  @Get(":id/last-result")
  async lastResult(@Param("id", ParseIntPipe) id: number) {
    return this.football.getLastResult(id);
  }

  @Get(":id/next-fixture")
  async nextFixture(@Param("id", ParseIntPipe) id: number) {
    return this.football.getNextFixture(id);
  }
}
