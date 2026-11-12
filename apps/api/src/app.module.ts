import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import configuration from "./config/configuration";
import { PrismaModule } from "./prisma/prisma.module";
import { CacheModule } from "./cache/cache.module";
import { AuthModule } from "./auth/auth.module";
import { LeaguesModule } from "./leagues/leagues.module";
import { TeamsModule } from "./teams/teams.module";
import { FixturesModule } from "./fixtures/fixtures.module";
import { MetaModule } from "./meta/meta.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    PrismaModule,
    CacheModule,
    AuthModule,
    LeaguesModule,
    TeamsModule,
    FixturesModule,
    MetaModule,
  ],
})
export class AppModule {}
