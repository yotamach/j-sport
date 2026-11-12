import type { Fixture } from "@football-portal/shared-types";
import { apiFetch } from "@/lib/api";
import LiveMatchesClient from "@/components/LiveMatchesClient";

export default async function LiveMatchesPage() {
  const todayFixtures = await apiFetch<Fixture[]>("/fixtures/today", { revalidate: 30 });
  return <LiveMatchesClient todayFixtures={todayFixtures} />;
}
