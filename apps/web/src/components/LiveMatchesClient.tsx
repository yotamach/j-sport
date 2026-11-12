"use client";

import { useMemo, useState } from "react";
import type { Fixture } from "@football-portal/shared-types";
import { useLiveFixtures } from "@/lib/socket";
import MatchCard from "./MatchCard";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export default function LiveMatchesClient({ todayFixtures }: { todayFixtures: Fixture[] }) {
  const { fixtures: liveFixtures, connected } = useLiveFixtures();
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Fixture[] | null>(null);
  const [searching, setSearching] = useState(false);

  // Merge live updates into today's fixture list so scores/status stay fresh in place.
  const merged = useMemo(() => {
    const liveById = new Map(liveFixtures.map((f) => [f.id, f]));
    return todayFixtures.map((f) => liveById.get(f.id) ?? f);
  }, [todayFixtures, liveFixtures]);

  const extraLive = liveFixtures.filter((f) => !todayFixtures.some((t) => t.id === f.id));

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim().length < 2) {
      setSearchResults(null);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(`${API_URL}/fixtures/search?team=${encodeURIComponent(query)}`);
      const data = (await res.json()) as Fixture[];
      setSearchResults(data);
    } finally {
      setSearching(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32, padding: "32px 48px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Matches Around the World</h1>
        <span style={{ fontSize: 12, color: connected ? "var(--accent)" : "var(--text-faint)" }}>
          {connected ? "● Live" : "○ Connecting…"}
        </span>
      </div>

      <form onSubmit={handleSearch} style={{ display: "flex", gap: 12 }}>
        <input
          type="text"
          placeholder="Find a match by team name…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ flex: 1, maxWidth: 360 }}
        />
        <button type="submit" className="btn-primary">
          {searching ? "Searching…" : "Search"}
        </button>
      </form>

      {searchResults && (
        <section style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700 }}>Search results</h2>
          {searchResults.length === 0 && <div style={{ color: "var(--text-faint)" }}>No matches found.</div>}
          {searchResults.map((f) => (
            <MatchCard key={f.id} fixture={f} />
          ))}
        </section>
      )}

      <section style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700 }}>Live now</h2>
        {extraLive.length === 0 && liveFixtures.length === 0 && (
          <div style={{ color: "var(--text-faint)" }}>No matches currently live.</div>
        )}
        {extraLive.map((f) => (
          <MatchCard key={f.id} fixture={f} />
        ))}
      </section>

      <section style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700 }}>Today&apos;s matches</h2>
        {merged.length === 0 && <div style={{ color: "var(--text-faint)" }}>No matches scheduled today.</div>}
        {merged.map((f) => (
          <MatchCard key={f.id} fixture={f} />
        ))}
      </section>
    </div>
  );
}
