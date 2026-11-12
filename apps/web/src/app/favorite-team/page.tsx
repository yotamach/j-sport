import { redirect } from "next/navigation";
import type { League, Team } from "@football-portal/shared-types";
import { apiFetch } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import FavoriteTeamPicker from "@/components/FavoriteTeamPicker";

export default async function FavoriteTeamPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const leagues = await apiFetch<League[]>("/leagues", { revalidate: 3600 });
  const primaryLeague = leagues.find((l) => l.type === "League") ?? leagues[0];
  const teams = primaryLeague
    ? await apiFetch<Team[]>(`/leagues/${primaryLeague.id}/teams?season=${primaryLeague.season}`, {
        revalidate: 3600,
      })
    : [];

  return (
    <main style={{ padding: "48px", display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Choose your favorite team</h1>
        <p style={{ color: "var(--text-dim)" }}>
          {primaryLeague ? `Teams in ${primaryLeague.name}` : "No leagues available yet."}
        </p>
      </div>
      <FavoriteTeamPicker teams={teams} />
    </main>
  );
}
