export interface AppConfig {
  port: number;
  corsOrigin: string;
  databaseUrl: string;
  redisUrl: string;
  jwtSecret: string;
  jwtExpiresIn: string;
  apiFootballKey: string | null;
  apiFootballHost: string;
  livePollIntervalMs: number;
}

export default (): { app: AppConfig } => ({
  app: {
    port: parseInt(process.env.PORT ?? "4000", 10),
    corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:3000",
    databaseUrl: process.env.DATABASE_URL ?? "",
    redisUrl: process.env.REDIS_URL ?? "redis://localhost:6379",
    jwtSecret: process.env.JWT_SECRET ?? "dev-secret-change-me",
    jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "7d",
    apiFootballKey: process.env.API_FOOTBALL_KEY || null,
    apiFootballHost: process.env.API_FOOTBALL_HOST ?? "v3.football.api-sports.io",
    livePollIntervalMs: parseInt(process.env.LIVE_POLL_INTERVAL_MS ?? "15000", 10),
  },
});
