import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Image, Linking, Platform, Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { api } from '../../../api/client';
import type { CourtDetail, UserPublic } from '../../../api/types';
import { Avatar, Button, Countdown, Section, StatusDot, s } from '../../../components/ui';
import { useAuth } from '../../../auth/AuthProvider';
import { useHere } from '../../../lib/location';
import { colors, formatDistance, sportEmoji, sportLabel } from '../../../lib/theme';

export default function CourtScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state } = useHere();
  const { user } = useAuth();
  const qc = useQueryClient();
  const here = state.status === 'ready' ? state.here : null;

  const q = useQuery({
    queryKey: ['court', id, here],
    queryFn: () => api.court(id, here!),
    enabled: !!here && !!id,
    refetchInterval: 20_000,
  });

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ['court', id] });
    void qc.invalidateQueries({ queryKey: ['courts'] });
  };
  const onError = (e: Error) => Alert.alert('Something went wrong', e.message);

  const photo = useMutation({
    mutationFn: async (source: 'camera' | 'library') => {
      const perm =
        source === 'camera' ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) return;
      const opts: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.7, allowsEditing: true, aspect: [4, 3] };
      const res = source === 'camera' ? await ImagePicker.launchCameraAsync(opts) : await ImagePicker.launchImageLibraryAsync(opts);
      if (res.canceled) return;
      const a = res.assets[0];
      await api.uploadCourtPhoto(id, a.uri, a.mimeType ?? 'image/jpeg');
    },
    onSuccess: invalidate,
    onError,
  });

  if (!q.data)
    return (
      <SafeAreaView style={[s.screen, { alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={{ color: colors.muted }}>{q.isError ? (q.error as Error).message : 'Loading…'}</Text>
      </SafeAreaView>
    );

  const c = q.data;
  const addPhoto = () =>
    Alert.alert('Court photo', undefined, [
      { text: 'Take a photo', onPress: () => photo.mutate('camera') },
      { text: 'Choose from library', onPress: () => photo.mutate('library') },
      { text: 'Cancel', style: 'cancel' },
    ]);

  return (
    <SafeAreaView style={s.screen} edges={['top', 'bottom']}>
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 16, paddingTop: 4 }}>
        <Pressable onPress={() => router.back()} hitSlop={12} accessibilityLabel="Close">
          <Text style={{ fontSize: 22, color: colors.muted }}>✕</Text>
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 20 }}>
        {/* Header: photo · name/distance/players/status · map */}
        <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
          <Pressable onPress={addPhoto} accessibilityLabel="Court photo">
            {c.photo_url ? (
              <Image source={{ uri: c.photo_url }} style={{ width: 96, height: 96, borderRadius: 14 }} />
            ) : (
              <View style={{ width: 96, height: 96, borderRadius: 14, backgroundColor: colors.border, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 28 }}>{sportEmoji[c.sport]}</Text>
                <Text style={{ fontSize: 11, color: colors.muted }}>{photo.isPending ? 'Uploading…' : '+ Add photo'}</Text>
              </View>
            )}
          </Pressable>
          <View style={{ flex: 1, gap: 3 }}>
            <Text style={{ fontSize: 20, fontWeight: '800', color: colors.text }}>{c.name}</Text>
            <Text style={{ color: colors.muted }}>
              {sportLabel[c.sport]} · {formatDistance(c.distance_m)}
              {c.is_paid ? ' · paid' : ''}
            </Text>
            <Text style={{ color: colors.muted }}>{c.players_played_count} players have played here</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <StatusDot status={c.status} />
              <Text style={{ fontWeight: '700', color: c.status === 'free' ? colors.free : colors.occupied }}>
                {c.status === 'free' ? 'Free' : 'Occupied'}
              </Text>
            </View>
          </View>
        </View>
        <Button title="🗺  Navigate" variant="secondary" onPress={() => openNavigation(c)} />

        {c.active_session ? (
          <OccupiedPanel court={c} meId={user!.id} onChange={invalidate} onError={onError} />
        ) : (
          <ClaimPanel court={c} onChange={invalidate} onError={onError} />
        )}

        <PlayerRow title="Played here recently" users={c.recent_players} empty="No one yet — be the first." />
        <PlayerRow title={`${sportLabel[c.sport]} players near this court`} users={c.nearby_players} empty="No one nearby right now." />
      </ScrollView>
    </SafeAreaView>
  );
}

function ClaimPanel({ court, onChange, onError }: { court: CourtDetail; onChange: () => void; onError: (e: Error) => void }) {
  const [players, setPlayers] = useState(1);
  const [openToJoin, setOpenToJoin] = useState(false);
  const [chatLocked, setChatLocked] = useState(false);
  const claim = useMutation({
    mutationFn: () => api.claim(court.id, { players_count: players, open_to_join: openToJoin, chat_locked: chatLocked }),
    onSuccess: onChange,
    onError,
  });

  return (
    <View style={{ backgroundColor: colors.card, borderRadius: 16, padding: 16, gap: 14 }}>
      <Text style={{ fontSize: 17, fontWeight: '700', color: colors.text }}>Take the court</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ color: colors.text }}>Players on the court</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <Stepper label="−" onPress={() => setPlayers((p) => Math.max(1, p - 1))} />
          <Text style={{ fontSize: 17, fontWeight: '700', minWidth: 24, textAlign: 'center' }}>{players}</Text>
          <Stepper label="+" onPress={() => setPlayers((p) => Math.min(50, p + 1))} />
        </View>
      </View>
      <Toggle label="Looking for more players" value={openToJoin} onChange={setOpenToJoin} />
      <Toggle label="Lock chat (no messages from others)" value={chatLocked} onChange={setChatLocked} />
      <Button title="Take court · 90 min" onPress={() => claim.mutate()} loading={claim.isPending} />
    </View>
  );
}

function OccupiedPanel({
  court,
  meId,
  onChange,
  onError,
}: {
  court: CourtDetail;
  meId: string;
  onChange: () => void;
  onError: (e: Error) => void;
}) {
  const sess = court.active_session!;
  const mine = sess.holder.id === meId;
  const opts = { onSuccess: onChange, onError };
  const release = useMutation({ mutationFn: () => api.release(sess.id), ...opts });
  const extend = useMutation({ mutationFn: () => api.extend(sess.id), ...opts });
  const join = useMutation({ mutationFn: () => api.join(sess.id), ...opts });
  const watch = useMutation({ mutationFn: () => (court.watching ? api.unwatch(court.id) : api.watch(court.id)), ...opts });

  return (
    <View style={{ backgroundColor: colors.card, borderRadius: 16, padding: 16, gap: 12 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontSize: 17, fontWeight: '700', color: colors.text }}>Court is taken</Text>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ fontSize: 12, color: colors.muted }}>frees up in</Text>
          <Countdown until={sess.expires_at} style={{ fontSize: 22, fontWeight: '800', color: colors.occupied }} />
        </View>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Avatar user={sess.holder} size={36} />
        <Text style={{ color: colors.text }}>
          Taken by <Text style={{ fontWeight: '700' }}>{mine ? 'you' : sess.holder.username}</Text>
        </Text>
      </View>
      {/* Read-only versions of the claim options */}
      <Text style={{ color: colors.muted }}>👥 {sess.players_count} players</Text>
      <Text style={{ color: colors.muted }}>{sess.open_to_join ? '✅ Looking for more players' : '— Not looking for players'}</Text>
      <Text style={{ color: colors.muted }}>{sess.chat_locked ? '🔒 Chat locked' : '💬 Chat open'}</Text>

      {mine ? (
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Button
            title="+45 min"
            variant="secondary"
            style={{ flex: 1 }}
            disabled={sess.extensions >= 1}
            loading={extend.isPending}
            onPress={() => extend.mutate()}
          />
          <Button title="Release court" variant="danger" style={{ flex: 1 }} loading={release.isPending} onPress={() => release.mutate()} />
        </View>
      ) : (
        <>
          {sess.open_to_join && <Button title="Join this game" onPress={() => join.mutate()} loading={join.isPending} />}
          <Button
            title={court.watching ? '🔔 Notifying you when free (tap to cancel)' : 'Notify me when it frees up'}
            variant="secondary"
            onPress={() => watch.mutate()}
            loading={watch.isPending}
          />
        </>
      )}
    </View>
  );
}

function PlayerRow({ title, users, empty }: { title: string; users: UserPublic[]; empty: string }) {
  return (
    <Section title={title}>
      {users.length === 0 ? (
        <Text style={{ color: colors.muted }}>{empty}</Text>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
          {users.map((u) => (
            // Player profiles arrive with the Friends module; for now show the name.
            <Pressable key={u.id} style={{ alignItems: 'center', width: 64, gap: 4 }} onPress={() => Alert.alert(u.full_name || u.username)}>
              <Avatar user={u} size={52} />
              <Text numberOfLines={1} style={{ fontSize: 12, color: colors.text }}>
                {u.username}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </Section>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <Text style={{ color: colors.text, flex: 1 }}>{label}</Text>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: colors.primary }} />
    </View>
  );
}

function Stepper({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={{ width: 34, height: 34, borderRadius: 17, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }}
    >
      <Text style={{ fontSize: 18 }}>{label}</Text>
    </Pressable>
  );
}

/** Spec: the location links out to Google Maps, Waze, or any other navigation app on the device. */
function openNavigation(c: CourtDetail) {
  const label = encodeURIComponent(c.name);
  const google = `https://www.google.com/maps/dir/?api=1&destination=${c.lat},${c.lng}`;
  const waze = `https://waze.com/ul?ll=${c.lat},${c.lng}&navigate=yes`;
  const system = Platform.OS === 'ios' ? `maps:?daddr=${c.lat},${c.lng}&q=${label}` : `geo:${c.lat},${c.lng}?q=${c.lat},${c.lng}(${label})`;
  Alert.alert('Navigate with', undefined, [
    { text: 'Waze', onPress: () => void Linking.openURL(waze) },
    { text: 'Google Maps', onPress: () => void Linking.openURL(google) },
    { text: Platform.OS === 'ios' ? 'Apple Maps' : 'Other app', onPress: () => void Linking.openURL(system) },
    { text: 'Cancel', style: 'cancel' },
  ]);
}
