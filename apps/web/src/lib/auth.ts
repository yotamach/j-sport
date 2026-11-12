import { cookies } from "next/headers";
import type { AuthUser } from "@football-portal/shared-types";
import { apiFetchOrNull } from "./api";

export const AUTH_COOKIE = "fp_token";

export function getServerToken(): string | null {
  return cookies().get(AUTH_COOKIE)?.value ?? null;
}

/** Resolves the signed-in user for the current request, or null if not logged in. Never throws. */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const token = getServerToken();
  if (!token) return null;
  return apiFetchOrNull<AuthUser>("/auth/me", { token });
}
