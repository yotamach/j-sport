import { apiFetchOrNull } from "@/lib/api";

interface Meta {
  mockMode: boolean;
  defaultFavoriteTeamId: number;
}

export default async function DemoBanner() {
  const meta = await apiFetchOrNull<Meta>("/meta", { revalidate: 300 });
  if (!meta?.mockMode) return null;

  return (
    <div
      style={{
        background: "var(--surface-alt)",
        borderBottom: "1px solid var(--border)",
        padding: "10px 48px",
        fontSize: 13,
        color: "var(--accent)",
      }}
    >
      Demo mode — showing sample data. Set <code>API_FOOTBALL_KEY</code> in <code>apps/api/.env</code> for live
      scores.
    </div>
  );
}
