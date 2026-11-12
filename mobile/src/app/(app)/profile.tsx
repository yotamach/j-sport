import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { api } from '../../api/client';
import { SPORTS, type Sport } from '../../api/types';
import { useAuth } from '../../auth/AuthProvider';
import { Avatar, Button, Chip, Field, s } from '../../components/ui';
import { colors, sportEmoji, sportLabel } from '../../lib/theme';

export default function Profile() {
  const { user, setUser } = useAuth();
  const [f, setF] = useState({
    full_name: user?.full_name ?? '',
    phone: user?.phone ?? '',
    address: user?.address ?? '',
  });
  const [sport, setSport] = useState<Sport | null>(user?.favorite_sport ?? null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  if (!user) return null;
  const set = (k: keyof typeof f) => (v: string) => setF((p) => ({ ...p, [k]: v }));

  const save = async () => {
    setBusy(true);
    setMsg(null);
    try {
      setUser(await api.updateMe({ ...f, favorite_sport: sport ?? undefined }));
      setMsg('Saved');
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView style={s.screen} contentContainerStyle={{ padding: 20, gap: 14 }}>
      {/* Spec: username large at the top, photo under it, then the fields */}
      <View style={{ alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <Text style={{ fontSize: 26, fontWeight: '800', color: colors.text }}>{user.username}</Text>
        <Avatar user={user} size={88} />
      </View>
      <Field label="Full name" value={f.full_name} onChangeText={set('full_name')} autoCapitalize="words" />
      <Field label="Email" value={user.email} editable={false} />
      <Field label="Home address" value={f.address} onChangeText={set('address')} autoCapitalize="words" />
      <Field label="Phone" value={f.phone} onChangeText={set('phone')} keyboardType="phone-pad" />
      <Text style={s.label}>Favorite sport</Text>
      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
        {SPORTS.map((sp) => (
          <Chip key={sp} label={`${sportEmoji[sp]} ${sportLabel[sp]}`} active={sport === sp} onPress={() => setSport(sp)} />
        ))}
      </View>
      {msg && <Text style={{ color: msg === 'Saved' ? colors.free : colors.danger }}>{msg}</Text>}
      <Button title="Save" onPress={save} loading={busy} />
    </ScrollView>
  );
}
