import { Module } from "@nestjs/common";
import { FootballModule } from "../football/football.module";
import { LeaguesController } from "./leagues.controller";

@Module({
  imports: [FootballModule],
  controllers: [LeaguesController],
})
export class LeaguesModule {}
