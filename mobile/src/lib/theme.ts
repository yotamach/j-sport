import type { Sport } from '../api/types';

export const colors = {
  bg: '#F6F7F9',
  card: '#FFFFFF',
  text: '#111418',
  muted: '#6B7280',
  border: '#E5E7EB',
  primary: '#0E7C66',
  primaryText: '#FFFFFF',
  free: '#16A34A',
  occupied: '#DC2626',
  danger: '#B91C1C',
};

export const sportLabel: Record<Sport, string> = {
  football: 'Football',
  basketball: 'Basketball',
  tennis: 'Tennis',
};

export const sportEmoji: Record<Sport, string> = {
  football: '⚽',
  basketball: '🏀',
  tennis: '🎾',
};

export function formatDistance(m: number) {
  return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(m < 10_000 ? 1 : 0)} km`;
}
