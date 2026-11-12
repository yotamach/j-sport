import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { api } from '../../api/client';
import { SPORTS, type Sport } from '../../api/types';
import { useAuth } from '../../auth/AuthProvider';
import { Button, Chip, Field, s } from '../../components/ui';
import { colors, sportEmoji, sportLabel } from '../../lib/theme';

export default function Register() {
  const { signIn } = useAuth();
  const [f, setF] = useState({ email: '', username: '', password: '', full_name: '', phone: '', address: '' });
  const [sport, setSport] = useState<Sport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (v: string) => setF((p) => ({ ...p, [k]: v }));

  const submit = async () => {
    if (!sport) return;
    setBusy(true);
    setError(null);
    try {
      await signIn(
        await api.register({
          email: f.email.trim(),
          username: f.username.trim(),
          password: f.password,
          favorite_sport: sport,
          full_name: f.full_name || undefined,
          phone: f.phone || undefined,
          address: f.address || undefined,
        }),
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const valid = f.email && f.username.length >= 3 && f.password.length >= 8 && sport;

  return (
    <SafeAreaView style={s.screen}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: 24, gap: 14 }}>
          <Text style={{ fontSize: 26, fontWeight: '800', color: colors.text }}>Create your account</Text>
          <Field label="Email *" value={f.email} onChangeText={set('email')} keyboardType="email-address" autoComplete="email" />
          <Field label="Username *" value={f.username} onChangeText={set('username')} />
          <Field label="Password * (8+ characters)" value={f.password} onChangeText={set('password')} secureTextEntry />
          <Text style={s.label}>Favorite sport *</Text>
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
            {SPORTS.map((sp) => (
              <Chip key={sp} label={`${sportEmoji[sp]} ${sportLabel[sp]}`} active={sport === sp} onPress={() => setSport(sp)} />
            ))}
          </View>
          <Field label="Full name" value={f.full_name} onChangeText={set('full_name')} autoCapitalize="words" />
          <Field label="Phone" value={f.phone} onChangeText={set('phone')} keyboardType="phone-pad" />
          <Field label="Home address" value={f.address} onChangeText={set('address')} autoCapitalize="words" />
          {error && <Text style={s.error}>{error}</Text>}
          <Button title="Sign up" onPress={submit} loading={busy} disabled={!valid} />
          <Button title="I already have an account" variant="secondary" onPress={() => router.back()} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
