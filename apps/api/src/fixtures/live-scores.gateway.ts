import { Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  OnGatewayConnection,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import type { Socket, Server } from "socket.io";
import { LIVE_EVENTS, type Fixture } from "@football-portal/shared-types";
import type { AppConfig } from "../config/configuration";
import { FootballApiService } from "../football/football-api.service";

/**
 * Live match updates over WebSocket.
 *
 * No football data provider offers an affordable public push/websocket feed,
 * so this gateway polls API-Football's REST `/fixtures?live=all` on a timer
 * (interval configurable via LIVE_POLL_INTERVAL_MS) and rebroadcasts the
 * result to every connected client, plus a granular `live:update` event per
 * fixture whose score/status actually changed. The frontend never polls —
 * it just listens.
 */
@WebSocketGateway({
  namespace: "/live",
  cors: { origin: process.env.CORS_ORIGIN ?? "http://localhost:3000", credentials: true },
})
export class LiveScoresGateway implements OnGatewayInit, OnGatewayConnection, OnModuleInit, OnModuleDestroy {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(LiveScoresGateway.name);
  private timer: ReturnType<typeof setInterval> | null = null;
  private lastById = new Map<number, Fixture>();

  constructor(
    private readonly football: FootballApiService,
    private readonly configService: ConfigService,
  ) {}

  afterInit() {
    this.logger.log("Live scores WebSocket gateway ready at /live");
  }

  async handleConnection(client: Socket) {
    // Send whatever we already have immediately; the poll loop below keeps it fresh.
    client.emit(LIVE_EVENTS.SNAPSHOT, { fixtures: Array.from(this.lastById.values()) });
  }

  onModuleInit() {
    const { livePollIntervalMs } = this.configService.get<AppConfig>("app")!;
    this.timer = setInterval(() => {
      this.pollAndBroadcast().catch((err) =>
        this.logger.warn(`Live fixtures poll failed: ${(err as Error).message}`),
      );
    }, livePollIntervalMs);
    // Kick off an initial poll immediately rather than waiting a full interval.
    this.pollAndBroadcast().catch((err) => this.logger.warn(`Initial live poll failed: ${(err as Error).message}`));
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  private async pollAndBroadcast() {
    const fixtures = await this.football.getLiveFixtures();
    const nextById = new Map(fixtures.map((f) => [f.id, f]));

    for (const fixture of fixtures) {
      const previous = this.lastById.get(fixture.id);
      if (!previous || hasChanged(previous, fixture)) {
        this.server.emit(LIVE_EVENTS.UPDATE, { fixture });
      }
    }

    this.lastById = nextById;
    this.server.emit(LIVE_EVENTS.SNAPSHOT, { fixtures });
  }
}

function hasChanged(a: Fixture, b: Fixture): boolean {
  return (
    a.status !== b.status ||
    a.elapsedMinutes !== b.elapsedMinutes ||
    a.home.goals !== b.home.goals ||
    a.away.goals !== b.away.goals
  );
}
