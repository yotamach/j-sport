import { HttpModule } from "@nestjs/axios";
import { Module } from "@nestjs/common";
import { FootballApiService } from "./football-api.service";

@Module({
  imports: [HttpModule.register({ timeout: 8000 })],
  providers: [FootballApiService],
  exports: [FootballApiService],
})
export class FootballModule {}
