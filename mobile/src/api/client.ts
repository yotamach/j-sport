import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import type {
  ActiveSession,
  ClaimIn,
  CourtDetail,
  CourtFilter,
  CourtListItem,
  Sport,
  TokenOut,
  UserMe,
  UserUpdate,
} from './types';

// Set EXPO_PUBLIC_API_URL to your machine's LAN address when testing on a phone.
export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000';
const TOKEN_KEY = 'jsport.token';

let token: string | null = null;
let onUnauthorized: (() => void) | null = null;

// SecureStore is native-only; fall back to localStorage on web.
const store =
  Platform.OS === 'web'
    ? {
        get: async () => globalThis.localStorage?.getItem(TOKEN_KEY) ?? null,
        set: async (v: string) => globalThis.localStorage?.setItem(TOKEN_KEY, v),
        del: async () => globalThis.localStorage?.removeItem(TOKEN_KEY),
      }
    : {
        get: () => SecureStore.getItemAsync(TOKEN_KEY),
        set: (v: string) => SecureStore.setItemAsync(TOKEN_KEY, v),
        del: () => SecureStore.deleteItemAsync(TOKEN_KEY),
      };

export async function loadToken() {
  token = await store.get();
  return token;
}
export async function saveToken(t: string | null) {
  token = t;
  if (t) await store.set(t);
  else await store.del();
}
export function setUnauthorizedHandler(fn: () => void) {
  onUnauthorized = fn;
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

type Query = Record<string, string | number | boolean | undefined | null>;

async function request<T>(method: string, path: string, opts: { query?: Query; body?: unknown; form?: FormData } = {}): Promise<T> {
  const qs = opts.query
    ? '?' +
      Object.entries(opts.query)
        .filter(([, v]) => v !== undefined && v !== null)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
        .join('&')
    : '';
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json';

  const res = await fetch(`${API_URL}${path}${qs}`, {
    method,
    headers,
    body: opts.form ?? (opts.body !== undefined ? JSON.stringify(opts.body) : undefined),
  });
  if (res.status === 401 && token) onUnauthorized?.();
  if (!res.ok) {
    let message = res.statusText;
    try {
      const j = await res.json();
      message = typeof j.detail === 'string' ? j.detail : j.detail?.[0]?.msg ?? message;
    } catch {}
    throw new ApiError(res.status, message);
  }
  return (res.status === 204 ? undefined : await res.json()) as T;
}

export interface Here {
  lat: number;
  lng: number;
}

export const api = {
  register: (b: { email: string; username: string; password: string; favorite_sport: Sport; full_name?: string; phone?: string; address?: string }) =>
    request<TokenOut>('POST', '/auth/register', { body: b }),
  login: (login: string, password: string) => request<TokenOut>('POST', '/auth/login', { body: { login, password } }),
  facebook: (access_token: string) => request<TokenOut>('POST', '/auth/facebook', { body: { access_token } }),

  me: () => request<UserMe>('GET', '/me'),
  updateMe: (b: UserUpdate) => request<UserMe>('PATCH', '/me', { body: b }),
  putLocation: (h: Here) => request<void>('PUT', '/me/location', { body: h }),
  putPushToken: (t: string | null) => request<void>('PUT', '/me/push-token', { body: { token: t } }),
  history: (h: Here) => request<CourtListItem[]>('GET', '/me/history', { query: { ...h } }),

  courts: (h: Here, q: { radius_km: number; filter: CourtFilter; sport?: Sport }) =>
    request<CourtListItem[]>('GET', '/courts', { query: { ...h, ...q } }),
  court: (id: string, h: Here) => request<CourtDetail>('GET', `/courts/${id}`, { query: { ...h } }),
  uploadCourtPhoto: (id: string, uri: string, mime = 'image/jpeg') => {
    const form = new FormData();
    // React Native's FormData accepts { uri, name, type } file descriptors.
    form.append('file', { uri, name: `court.${mime.split('/')[1] ?? 'jpg'}`, type: mime } as unknown as Blob);
    return request<{ photo_url: string }>('POST', `/courts/${id}/photo`, { form });
  },
  claim: (id: string, b: ClaimIn) => request<ActiveSession>('POST', `/courts/${id}/sessions`, { body: b }),
  release: (sid: string) => request<void>('POST', `/sessions/${sid}/release`),
  extend: (sid: string) => request<ActiveSession>('POST', `/sessions/${sid}/extend`),
  join: (sid: string) => request<ActiveSession>('POST', `/sessions/${sid}/join`),
  watch: (id: string) => request<void>('POST', `/courts/${id}/watch`),
  unwatch: (id: string) => request<void>('DELETE', `/courts/${id}/watch`),
};
