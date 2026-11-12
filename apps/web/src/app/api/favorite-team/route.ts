import { NextResponse } from "next/server";
import type { AuthUser, SetFavoriteTeamDto } from "@football-portal/shared-types";
import { apiFetch, ApiError } from "@/lib/api";
import { getServerToken } from "@/lib/auth";

export async function PATCH(request: Request) {
  const token = getServerToken();
  if (!token) return NextResponse.json({ message: "Not signed in" }, { status: 401 });

  const dto = (await request.json()) as SetFavoriteTeamDto;
  try {
    const user = await apiFetch<AuthUser>("/auth/me/favorite-team", {
      method: "PATCH",
      token,
      body: JSON.stringify(dto),
    });
    return NextResponse.json({ user });
  } catch (err) {
    const status = err instanceof ApiError ? err.status : 500;
    const message = err instanceof Error ? err.message : "Could not set favorite team";
    return NextResponse.json({ message }, { status });
  }
}
