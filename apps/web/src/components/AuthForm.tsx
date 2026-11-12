"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mode === "login" ? { email, password } : { email, password, displayName }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? "Something went wrong");
        return;
      }
      router.push(data.user?.favoriteTeamId ? "/" : "/favorite-team");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="card"
      style={{ padding: 32, display: "flex", flexDirection: "column", gap: 16, maxWidth: 380 }}
    >
      <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>
        {mode === "login" ? "Sign in" : "Create your account"}
      </h1>

      {mode === "register" && (
        <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, color: "var(--text-dim)" }}>
          Display name
          <input
            type="text"
            required
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
        </label>
      )}

      <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, color: "var(--text-dim)" }}>
        Email
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>

      <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, color: "var(--text-dim)" }}>
        Password
        <input
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </label>

      {error && <div style={{ color: "var(--danger)", fontSize: 13 }}>{error}</div>}

      <button type="submit" className="btn-primary" disabled={submitting}>
        {submitting ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
      </button>
    </form>
  );
}
