const API_URL = process.env.API_URL ?? "http://localhost:4000/api";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

interface FetchOptions extends RequestInit {
  token?: string | null;
  /** Next.js ISR revalidate window in seconds; omit for no caching. */
  revalidate?: number;
}

/** Server-side fetch helper against the NestJS API. Use from Server Components / route handlers only. */
export async function apiFetch<T>(path: string, opts: FetchOptions = {}): Promise<T> {
  const { token, revalidate, headers, ...rest } = opts;

  const res = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    ...(revalidate !== undefined ? { next: { revalidate } } : { cache: "no-store" }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: res.statusText }));
    throw new ApiError(res.status, body.message ?? "Request failed");
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

/** Same as apiFetch, but returns null instead of throwing on 404 — handy for "optional" lookups. */
export async function apiFetchOrNull<T>(path: string, opts: FetchOptions = {}): Promise<T | null> {
  try {
    return await apiFetch<T>(path, opts);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}
