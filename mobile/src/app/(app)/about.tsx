import Constants from 'expo-constants';
import { Text, View } from 'react-native';

import { s } from '../../components/ui';
import { colors } from '../../lib/theme';

export default function About() {
  return (
    <View style={[s.screen, { alignItems: 'center', justifyContent: 'center', gap: 12 }]}>
      <View style={{ width: 120, height: 120, borderRadius: 28, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: '#fff', fontSize: 34, fontWeight: '800' }}>J</Text>
      </View>
      <Text style={{ fontSize: 24, fontWeight: '800', color: colors.text }}>Jsport</Text>
      <Text style={{ color: colors.muted }}>Version {Constants.expoConfig?.version ?? '1.0.0'}</Text>
      <Text style={{ color: colors.muted }}>© Jsport</Text>
    </View>
  );
}
