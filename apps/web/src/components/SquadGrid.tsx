import type { Player } from "@football-portal/shared-types";
import { initials } from "@/lib/format";

const POSITION_ABBR: Record<string, string> = {
  Goalkeeper: "GK",
  Defender: "DF",
  Midfielder: "MF",
  Attacker: "FW",
};

export default function SquadGrid({ players }: { players: Player[] }) {
  return (
    <div className="card" style={{ padding: "24px 28px" }}>
      <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 16 }}>Squad</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 16 }}>
        {players.map((player) => (
          <div
            key={player.id}
            style={{
              background: "var(--bg)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              padding: 14,
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                background: "var(--surface-alt)",
                color: "var(--accent)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 800,
                fontSize: 14,
              }}
            >
              {initials(player.name)}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13 }}>{player.name}</div>
              <div style={{ fontSize: 11, color: "var(--text-faint)" }}>
                {(player.position && POSITION_ABBR[player.position]) ?? "—"} · #{player.number ?? "-"}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
