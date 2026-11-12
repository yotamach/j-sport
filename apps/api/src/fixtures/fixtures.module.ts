import { Module } from "@nestjs/common";
import { FootballModule } from "../football/football.module";
import { FixturesController } from "./fixtures.controller";
import { LiveScoresGateway } from "./live-scores.gateway";

@Module({
  imports: [FootballModule],
  controllers: [FixturesController],
  providers: [LiveScoresGateway],
})
export class FixturesModule {}
