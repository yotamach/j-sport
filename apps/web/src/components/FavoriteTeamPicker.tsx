"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Team } from "@football-portal/shared-types";
import TeamBadge from "./TeamBadge";

export default function FavoriteTeamPicker({ teams }: { teams: Team[] }) {
  const router = useRouter();
  const [selecting, setSelecting] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function choose(teamId: number) {
    setSelecting(teamId);
    setError(null);
    try {
      const res = await fetch("/api/favorite-team", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? "Could not set favorite team");
        return;
      }
      router.push("/");
      router.refresh();
    } finally {
      setSelecting(null);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {error && <div style={{ color: "var(--danger)", fontSize: 13 }}>{error}</div>}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 16 }}>
        {teams.map((team) => (
          <button
            key={team.id}
            onClick={() => choose(team.id)}
            disabled={selecting !== null}
            className="card"
            style={{
              padding: 20,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 10,
              cursor: "pointer",
              opacity: selecting && selecting !== team.id ? 0.5 : 1,
            }}
          >
            <TeamBadge logo={team.logo} name={team.name} size={48} />
            <span style={{ fontWeight: 700, fontSize: 14, textAlign: "center" }}>
              {selecting === team.id ? "Saving…" : team.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
