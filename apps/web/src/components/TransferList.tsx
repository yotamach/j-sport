import type { Transfer } from "@football-portal/shared-types";

const STATUS_STYLE: Record<Transfer["status"], { bg: string; color: string; label: string }> = {
  COMPLETED: { bg: "var(--surface-alt)", color: "var(--accent)", label: "Completed" },
  IN_TALKS: { bg: "#3a2e12", color: "var(--warn)", label: "In talks" },
  RUMOUR: { bg: "#1f2937", color: "var(--text-dim)", label: "Rumour" },
};

function TransferRow({ transfer }: { transfer: Transfer }) {
  const style = STATUS_STYLE[transfer.status];
  const relation = transfer.direction === "IN" ? "from" : "to";
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 0",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div style={{ fontWeight: 700, fontSize: 13 }}>
        {transfer.playerName} <span style={{ color: "var(--text-faint)", fontWeight: 500 }}>{relation} {transfer.otherClub}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span className="mono" style={{ fontSize: 13, color: "var(--text-dim)" }}>{transfer.fee ?? "—"}</span>
        <span className="pill" style={{ background: style.bg, color: style.color }}>{style.label}</span>
      </div>
    </div>
  );
}

export default function TransferList({ transfers }: { transfers: Transfer[] }) {
  const incoming = transfers.filter((t) => t.direction === "IN");
  const outgoing = transfers.filter((t) => t.direction === "OUT");

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 24 }}>
      <div className="card" style={{ padding: "24px 28px" }}>
        <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 14 }}>Incoming Transfers</div>
        {incoming.length === 0 && <div style={{ color: "var(--text-faint)", fontSize: 13 }}>No incoming transfers.</div>}
        {incoming.map((t) => (
          <TransferRow key={t.id} transfer={t} />
        ))}
      </div>
      <div className="card" style={{ padding: "24px 28px" }}>
        <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 14 }}>Outgoing Transfers</div>
        {outgoing.length === 0 && <div style={{ color: "var(--text-faint)", fontSize: 13 }}>No outgoing transfers.</div>}
        {outgoing.map((t) => (
          <TransferRow key={t.id} transfer={t} />
        ))}
      </div>
    </div>
  );
}
