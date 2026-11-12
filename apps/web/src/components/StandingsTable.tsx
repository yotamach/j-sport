import type { Standing } from "@football-portal/shared-types";
import TeamBadge from "./TeamBadge";

const COLS = "32px 1fr 36px 36px 36px 36px 44px 44px";

export default function StandingsTable({
  standing,
  highlightTeamId,
}: {
  standing: Standing;
  highlightTeamId?: number;
}) {
  return (
    <div className="card" style={{ padding: "24px 28px" }}>
      <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 16 }}>
        {standing.leagueName} · Standings
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: COLS,
          gap: 8,
          fontSize: 11,
          fontWeight: 700,
          color: "var(--text-faint)",
          padding: "0 8px 10px",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div>#</div>
        <div>Team</div>
        <div>P</div>
        <div>W</div>
        <div>D</div>
        <div>L</div>
        <div>GD</div>
        <div>Pts</div>
      </div>
      {standing.table.map((row) => {
        const isHighlighted = row.team.id === highlightTeamId;
        return (
          <div
            key={row.team.id}
            style={{
              display: "grid",
              gridTemplateColumns: COLS,
              gap: 8,
              padding: "10px 8px",
              fontSize: 13,
              alignItems: "center",
              borderRadius: 8,
              background: isHighlighted ? "var(--surface-alt)" : "transparent",
              borderLeft: isHighlighted ? "3px solid var(--accent)" : "3px solid transparent",
            }}
          >
            <div>{row.rank}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, fontWeight: isHighlighted ? 700 : 600 }}>
              <TeamBadge logo={row.team.logo} name={row.team.name} size={22} />
              {row.team.name}
            </div>
            <div>{row.played}</div>
            <div>{row.win}</div>
            <div>{row.draw}</div>
            <div>{row.lose}</div>
            <div>
              {row.goalsDiff > 0 ? "+" : ""}
              {row.goalsDiff}
            </div>
            <div style={{ fontWeight: 800 }}>{row.points}</div>
          </div>
        );
      })}
    </div>
  );
}
