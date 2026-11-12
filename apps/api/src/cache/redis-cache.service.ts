import { Injectable, Logger, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";
import type { AppConfig } from "../config/configuration";

/**
 * Thin Redis-backed cache with an automatic in-memory fallback so local
 * development works even before `docker compose up` has started Redis.
 */
@Injectable()
export class RedisCacheService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisCacheService.name);
  private readonly client: Redis;
  private redisAvailable = true;
  private readonly memory = new Map<string, { value: string; expiresAt: number }>();

  constructor(private readonly configService: ConfigService) {
    const { redisUrl } = this.configService.get<AppConfig>("app")!;
    this.client = new Redis(redisUrl, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      retryStrategy: () => null,
    });
    this.client.on("error", (err) => {
      if (this.redisAvailable) {
        this.logger.warn(`Redis unavailable, falling back to in-memory cache: ${err.message}`);
      }
      this.redisAvailable = false;
    });
    this.client.connect().catch(() => {
      this.redisAvailable = false;
    });
  }

  async onModuleDestroy() {
    this.client.disconnect();
  }

  async get<T>(key: string): Promise<T | null> {
    if (this.redisAvailable) {
      try {
        const raw = await this.client.get(key);
        return raw ? (JSON.parse(raw) as T) : null;
      } catch {
        this.redisAvailable = false;
      }
    }
    const entry = this.memory.get(key);
    if (!entry) return null;
    if (entry.expiresAt < Date.now()) {
      this.memory.delete(key);
      return null;
    }
    return JSON.parse(entry.value) as T;
  }

  async set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    const raw = JSON.stringify(value);
    if (this.redisAvailable) {
      try {
        await this.client.set(key, raw, "EX", ttlSeconds);
        return;
      } catch {
        this.redisAvailable = false;
      }
    }
    this.memory.set(key, { value: raw, expiresAt: Date.now() + ttlSeconds * 1000 });
  }

  /** Read-through cache helper: returns the cached value, or computes, caches, and returns a fresh one. */
  async getOrSet<T>(key: string, ttlSeconds: number, fn: () => Promise<T>): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) return cached;
    const fresh = await fn();
    await this.set(key, fresh, ttlSeconds);
    return fresh;
  }
}
