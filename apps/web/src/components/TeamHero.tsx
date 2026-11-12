import type { Fixture } from "@football-portal/shared-types";
import { formatMatchDate } from "@/lib/format";
import TeamBadge from "./TeamBadge";

export default function TeamHero({
  teamName,
  teamLogo,
  lastResult,
  nextFixture,
}: {
  teamName: string;
  teamLogo: string | null;
  lastResult: Fixture | null;
  nextFixture: Fixture | null;
}) {
  return (
    <div style={{ display: "flex", gap: 24 }}>
      <div className="card" style={{ flex: 2, padding: "28px 32px", display: "flex", flexDirection: "column", gap: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <TeamBadge logo={teamLogo} name={teamName} size={60} radius={16} />
          <div style={{ fontSize: 28, fontWeight: 800 }}>{teamName}</div>
        </div>
        <div style={{ height: 1, background: "var(--border)" }} />
        {lastResult ? (
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: "var(--text-faint)", marginBottom: 8 }}>
              LAST RESULT · {lastResult.status}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <TeamBadge logo={lastResult.home.team.logo} name={lastResult.home.team.name} size={28} />
              <div className="mono" style={{ fontSize: 26, fontWeight: 800 }}>
                {lastResult.home.team.name} <span style={{ color: "var(--accent)" }}>{lastResult.home.goals ?? "-"}</span> —{" "}
                <span style={{ color: "var(--text-dim)" }}>{lastResult.away.goals ?? "-"}</span> {lastResult.away.team.name}
              </div>
              <TeamBadge logo={lastResult.away.team.logo} name={lastResult.away.team.name} size={28} />
            </div>
            <div style={{ fontSize: 12, color: "var(--text-faint)", marginTop: 6 }}>
              {formatMatchDate(lastResult.date)} {lastResult.venue ? `· ${lastResult.venue}` : ""}
            </div>
          </div>
        ) : (
          <div style={{ color: "var(--text-faint)", fontSize: 13 }}>No recent results.</div>
        )}
      </div>

      <div
        className="card"
        style={{
          flex: 1,
          padding: "28px 32px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        {nextFixture ? (
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: "var(--accent)", marginBottom: 12 }}>
              NEXT MATCH
            </div>
            {(() => {
              const opponent =
                nextFixture.home.team.name === teamName ? nextFixture.away.team : nextFixture.home.team;
              return (
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <TeamBadge logo={opponent.logo} name={opponent.name} size={32} />
                  <div style={{ fontSize: 20, fontWeight: 800 }}>vs {opponent.name}</div>
                </div>
              );
            })()}
            <div style={{ fontSize: 13, color: "var(--text-dim)", marginTop: 6 }}>
              {formatMatchDate(nextFixture.date)} {nextFixture.venue ? `· ${nextFixture.venue}` : ""}
            </div>
          </div>
        ) : (
          <div style={{ color: "var(--text-faint)", fontSize: 13 }}>No upcoming fixtures scheduled.</div>
        )}
      </div>
    </div>
  );
}
