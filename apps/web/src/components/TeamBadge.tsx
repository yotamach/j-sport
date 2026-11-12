import { initials } from "@/lib/format";

/**
 * Renders a team's logo when one is available (demo-mode SVG crests, or a
 * real API-Football logo URL once API_FOOTBALL_KEY is set) and falls back
 * to an initials badge otherwise — some providers/plans don't return a logo
 * for every team.
 */
export default function TeamBadge({
  logo,
  name,
  size = 44,
  radius = "50%",
}: {
  logo: string | null;
  name: string;
  size?: number;
  radius?: number | string;
}) {
  if (logo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- external/relative logo URLs, not a static import
      <img
        src={logo}
        alt={`${name} logo`}
        width={size}
        height={size}
        style={{ width: size, height: size, objectFit: "contain", borderRadius: radius, flexShrink: 0 }}
      />
    );
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: "var(--surface-alt)",
        color: "var(--accent)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 800,
        fontSize: size * 0.32,
        flexShrink: 0,
      }}
    >
      {initials(name)}
    </div>
  );
}
