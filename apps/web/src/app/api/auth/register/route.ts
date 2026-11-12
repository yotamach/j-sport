import { NextResponse } from "next/server";
import type { AuthResponse, RegisterDto } from "@football-portal/shared-types";
import { apiFetch, ApiError } from "@/lib/api";
import { AUTH_COOKIE } from "@/lib/auth";

export async function POST(request: Request) {
  const dto = (await request.json()) as RegisterDto;
  try {
    const data = await apiFetch<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(dto),
    });
    const res = NextResponse.json({ user: data.user });
    res.cookies.set(AUTH_COOKIE, data.accessToken, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return res;
  } catch (err) {
    const status = err instanceof ApiError ? err.status : 500;
    const message = err instanceof Error ? err.message : "Registration failed";
    return NextResponse.json({ message }, { status });
  }
}
