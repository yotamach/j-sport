import Link from "next/link";
import type { League } from "@football-portal/shared-types";
import { apiFetch } from "@/lib/api";

export default async function LeaguesPage() {
  const leagues = await apiFetch<League[]>("/leagues", { revalidate: 3600 });

  const byCountry = new Map<string, League[]>();
  for (const league of leagues) {
    const key = league.country.name;
    if (!byCountry.has(key)) byCountry.set(key, []);
    byCountry.get(key)!.push(league);
  }
  const countries = Array.from(byCountry.keys()).sort();

  return (
    <main style={{ padding: "32px 48px", display: "flex", flexDirection: "column", gap: 28 }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Leagues Around the World</h1>

      {countries.map((country) => (
        <section key={country}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>
            {country}
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 16 }}>
            {byCountry.get(country)!.map((league) => (
              <Link
                key={league.id}
                href={`/leagues/${league.id}?season=${league.season}`}
                className="card"
                style={{ padding: 20, display: "flex", flexDirection: "column", gap: 6 }}
              >
                <span style={{ fontWeight: 700, fontSize: 15 }}>{league.name}</span>
                <span className="pill" style={{ width: "fit-content", background: "#1e293b", color: "#93c5fd" }}>
                  {league.type}
                </span>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}
