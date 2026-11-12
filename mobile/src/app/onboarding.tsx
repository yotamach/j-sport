import { Redirect } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { api } from '../api/client';
import { SPORTS, type Sport } from '../api/types';
import { useAuth } from '../auth/AuthProvider';
import { Button, Chip, s } from '../components/ui';
import { colors, sportEmoji, sportLabel } from '../lib/theme';

/** Mandatory first step for Facebook sign-ups: pick a favorite sport. */
export default function Onboarding() {
  const { user, setUser } = useAuth();
  const [sport, setSport] = useState<Sport | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user) return <Redirect href="/login" />;
  if (user.favorite_sport) return <Redirect href="/" />;

  const save = async () => {
    if (!sport) return;
    setBusy(true);
    try {
      setUser(await api.updateMe({ favorite_sport: sport }));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={[s.screen, { padding: 24, justifyContent: 'center', gap: 18 }]}>
      <Text style={{ fontSize: 26, fontWeight: '800', color: colors.text }}>What do you play?</Text>
      <Text style={{ color: colors.muted }}>Pick your favorite sport to get started. You can change it later in your profile.</Text>
      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
        {SPORTS.map((sp) => (
          <Chip key={sp} label={`${sportEmoji[sp]} ${sportLabel[sp]}`} active={sport === sp} onPress={() => setSport(sp)} />
        ))}
      </View>
      {error && <Text style={s.error}>{error}</Text>}
      <Button title="Continue" onPress={save} disabled={!sport} loading={busy} />
    </SafeAreaView>
  );
}
