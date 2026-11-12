export type Sport = 'football' | 'basketball' | 'tennis';
export const SPORTS: Sport[] = ['football', 'basketball', 'tennis'];

export type CourtFilter = 'all' | 'free' | 'occupied' | 'paid';
export type CourtStatus = 'free' | 'occupied';

export interface TokenOut {
  access_token: string;
  token_type: 'bearer';
  needs_onboarding: boolean;
}

export interface UserPublic {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  favorite_sport: Sport | null;
}

export interface UserMe extends UserPublic {
  email: string;
  phone: string | null;
  address: string | null;
}

export type UserUpdate = Partial<Pick<UserMe, 'full_name' | 'phone' | 'address' | 'avatar_url' | 'favorite_sport'>>;

export interface ActiveSession {
  id: string;
  holder: UserPublic;
  players_count: number;
  open_to_join: boolean;
  chat_locked: boolean;
  started_at: string;
  expires_at: string;
  extensions: number;
}

export interface CourtListItem {
  id: string;
  name: string;
  sport: Sport;
  is_paid: boolean;
  lat: number;
  lng: number;
  distance_m: number;
  status: CourtStatus;
  expires_at: string | null;
  players_count: number | null;
}

export interface CourtDetail extends CourtListItem {
  address: string | null;
  photo_url: string | null;
  players_played_count: number;
  active_session: ActiveSession | null;
  recent_players: UserPublic[];
  nearby_players: UserPublic[];
  watching: boolean;
}

export interface ClaimIn {
  players_count: number;
  open_to_join: boolean;
  chat_locked: boolean;
}
