import { ActivityIndicator, Text, View } from 'react-native';

import { colors } from '../lib/theme';

/** Loading screen — spec: conveys connecting people through sport. */
export function Splash() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary, gap: 16 }}>
      <Text style={{ fontSize: 44, fontWeight: '800', color: '#fff', letterSpacing: 1 }}>Jsport</Text>
      <Text style={{ color: '#fff', opacity: 0.85, fontSize: 16 }}>⚽ 🏀 🎾  find courts · meet players</Text>
      <ActivityIndicator color="#fff" style={{ marginTop: 12 }} />
    </View>
  );
}
