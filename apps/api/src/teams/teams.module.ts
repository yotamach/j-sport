import { Module } from "@nestjs/common";
import { FootballModule } from "../football/football.module";
import { TeamsController } from "./teams.controller";

@Module({
  imports: [FootballModule],
  controllers: [TeamsController],
})
export class TeamsModule {}
