import Link from "next/link";
import type { AuthUser } from "@football-portal/shared-types";
import { getCurrentUser } from "@/lib/auth";
import LogoutButton from "./LogoutButton";

export default async function Navbar() {
  const user: AuthUser | null = await getCurrentUser();

  return (
    <div
      style={{
        height: 72,
        padding: "0 48px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <Link href="/" style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M12 2 L21 6.5 V15 L12 22 L3 15 V6.5 Z" fill="var(--accent)" />
        </svg>
        <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: 1 }}>FOOTBALL PORTAL</span>
      </Link>

      <nav style={{ display: "flex", alignItems: "center", gap: 36 }}>
        <Link href="/" style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>
          Home
        </Link>
        <Link href="/live" style={{ fontSize: 14, fontWeight: 600, color: "var(--text-dim)" }}>
          Live Matches
        </Link>
        <Link href="/leagues" style={{ fontSize: 14, fontWeight: 600, color: "var(--text-dim)" }}>
          Leagues
        </Link>
      </nav>

      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        {user ? (
          <>
            <span style={{ fontSize: 13, color: "var(--text-dim)" }}>{user.displayName}</span>
            <LogoutButton />
          </>
        ) : (
          <>
            <Link href="/login" className="btn-ghost" style={{ display: "inline-flex", alignItems: "center" }}>
              Sign in
            </Link>
            <Link href="/register" className="btn-primary" style={{ display: "inline-flex", alignItems: "center" }}>
              Create account
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
