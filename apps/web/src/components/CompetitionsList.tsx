import type { League } from "@football-portal/shared-types";

export default function CompetitionsList({ leagues }: { leagues: League[] }) {
  return (
    <div className="card" style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ fontSize: 16, fontWeight: 800 }}>Competitions</div>
      {leagues.length === 0 && <div style={{ color: "var(--text-faint)", fontSize: 13 }}>No competitions found.</div>}
      {leagues.map((league, i) => (
        <div
          key={league.id}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 0",
            borderBottom: i < leagues.length - 1 ? "1px solid var(--border)" : "none",
          }}
        >
          <div>
            <div style={{ fontWeight: 700, fontSize: 14 }}>{league.name}</div>
            <div style={{ fontSize: 12, color: "var(--text-faint)" }}>{league.country.name}</div>
          </div>
          <div className="pill" style={{ background: "#1e293b", color: "#93c5fd" }}>
            {league.type}
          </div>
        </div>
      ))}
    </div>
  );
}
