import { Module } from "@nestjs/common";
import { FootballModule } from "../football/football.module";
import { MetaController } from "./meta.controller";

@Module({
  imports: [FootballModule],
  controllers: [MetaController],
})
export class MetaModule {}
