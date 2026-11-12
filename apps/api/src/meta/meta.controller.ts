import { Controller, Get } from "@nestjs/common";
import { FootballApiService } from "../football/football-api.service";

@Controller("meta")
export class MetaController {
  constructor(private readonly football: FootballApiService) {}

  @Get()
  get() {
    return {
      mockMode: this.football.isMockMode,
      defaultFavoriteTeamId: this.football.favoriteTeamId,
    };
  }
}
