"use client";

import { useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { LIVE_EVENTS, type Fixture } from "@football-portal/shared-types";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "http://localhost:4000";

/**
 * Subscribes to the backend's live-scores WebSocket gateway. The server
 * pushes a full snapshot on connect and after every poll cycle, plus a
 * per-fixture `live:update` event when a score or status actually changes —
 * this hook only needs to listen, never poll.
 */
export function useLiveFixtures(): { fixtures: Fixture[]; connected: boolean } {
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io(`${WS_URL}/live`, { transports: ["websocket"] });
    socketRef.current = socket;

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));
    socket.on(LIVE_EVENTS.SNAPSHOT, (payload: { fixtures: Fixture[] }) => {
      setFixtures(payload.fixtures);
    });
    socket.on(LIVE_EVENTS.UPDATE, (payload: { fixture: Fixture }) => {
      setFixtures((prev) => {
        const idx = prev.findIndex((f) => f.id === payload.fixture.id);
        if (idx === -1) return [...prev, payload.fixture];
        const next = [...prev];
        next[idx] = payload.fixture;
        return next;
      });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return { fixtures, connected };
}
