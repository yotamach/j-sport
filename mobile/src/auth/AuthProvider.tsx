import { useQueryClient } from '@tanstack/react-query';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { api, loadToken, saveToken, setUnauthorizedHandler } from '../api/client';
import type { TokenOut, UserMe } from '../api/types';

interface AuthState {
  ready: boolean;
  user: UserMe | null;
  signIn: (t: TokenOut) => Promise<void>;
  signOut: () => Promise<void>;
  setUser: (u: UserMe) => void;
}

const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<UserMe | null>(null);

  const signOut = useCallback(async () => {
    await saveToken(null);
    setUser(null);
    qc.clear();
  }, [qc]);

  useEffect(() => {
    setUnauthorizedHandler(() => void signOut());
    (async () => {
      try {
        if (await loadToken()) setUser(await api.me());
      } catch {
        await saveToken(null);
      } finally {
        setReady(true);
      }
    })();
  }, [signOut]);

  const signIn = useCallback(async (t: TokenOut) => {
    await saveToken(t.access_token);
    setUser(await api.me());
  }, []);

  const value = useMemo(() => ({ ready, user, signIn, signOut, setUser }), [ready, user, signIn, signOut]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAuth outside AuthProvider');
  return v;
}
