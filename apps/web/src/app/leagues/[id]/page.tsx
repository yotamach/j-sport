import type { Standing } from "@football-portal/shared-types";
import { apiFetchOrNull } from "@/lib/api";
import StandingsTable from "@/components/StandingsTable";

export default async function LeagueDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { season?: string };
}) {
  const season = searchParams.season ?? String(new Date().getFullYear());
  const standing = await apiFetchOrNull<Standing>(`/leagues/${params.id}/standings?season=${season}`, {
    revalidate: 300,
  });

  return (
    <main style={{ padding: "32px 48px" }}>
      {standing ? (
        <StandingsTable standing={standing} />
      ) : (
        <div className="card" style={{ padding: 24, color: "var(--text-faint)" }}>
          No standings available for this league/season.
        </div>
      )}
    </main>
  );
}
