import * as Location from 'expo-location';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

import { api, type Here } from '../api/client';

type LocState =
  | { status: 'loading' }
  | { status: 'denied' }
  | { status: 'ready'; here: Here };

const Ctx = createContext<{ state: LocState; refresh: () => Promise<void> } | null>(null);

/** Requests foreground location once, shares it app-wide, and reports it to the API (for "players near the court"). */
export function LocationProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<LocState>({ status: 'loading' });

  const refresh = useCallback(async () => {
    const perm = await Location.requestForegroundPermissionsAsync();
    if (perm.status !== 'granted') {
      setState({ status: 'denied' });
      return;
    }
    const last = await Location.getLastKnownPositionAsync();
    if (last) setState({ status: 'ready', here: { lat: last.coords.latitude, lng: last.coords.longitude } });
    const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    const here = { lat: pos.coords.latitude, lng: pos.coords.longitude };
    setState({ status: 'ready', here });
    api.putLocation(here).catch(() => {});
  }, []);

  useEffect(() => {
    refresh().catch(() => setState({ status: 'denied' }));
  }, [refresh]);

  return <Ctx.Provider value={{ state, refresh }}>{children}</Ctx.Provider>;
}

export function useHere() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useHere outside LocationProvider');
  return v;
}
