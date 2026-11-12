import { useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';

import { s } from '../../../components/ui';
import { colors } from '../../../lib/theme';

const BLURB: Record<string, string> = {
  search: 'Search for players, courts and teams.',
  friends: 'Add friends by username, contacts or Facebook, see who is online, and get "people you may know".',
  tournaments: 'Browse and create tournaments, register with your team or come solo and find teammates.',
  teams: 'Create teams, manage members and see your team rating.',
  challenge: 'Rate teams and players 1–10 after games, climb the rankings and challenge the top players.',
  favorites: 'Quick access to your favorite courts.',
  chats: 'One-to-one and group chats.',
  notifications: 'Choose which alerts you get: court freed, 15-minute warning, chat messages, challenges.',
  settings: 'App settings.',
};

export default function ComingSoon() {
  const { feature } = useLocalSearchParams<{ feature: string }>();
  return (
    <View style={[s.screen, { padding: 24, justifyContent: 'center', gap: 10 }]}>
      <Text style={{ fontSize: 24, fontWeight: '800', color: colors.text, textTransform: 'capitalize' }}>{feature}</Text>
      <Text style={{ color: colors.muted, fontSize: 16 }}>{BLURB[feature] ?? ''}</Text>
      <Text style={{ color: colors.primary, marginTop: 8 }}>Coming in the next phase.</Text>
    </View>
  );
}
