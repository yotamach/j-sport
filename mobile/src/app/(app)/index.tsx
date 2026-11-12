import { useMutation, useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActionSheetIOS, Alert, FlatList, Platform, Pressable, RefreshControl, Text, TextInput, View } from 'react-native';

import { api } from '../../api/client';
import { SPORTS, type CourtFilter, type CourtListItem, type Sport } from '../../api/types';
import { Button, Chip, OptionSheet, StatusDot, s } from '../../components/ui';
import { useHere } from '../../lib/location';
import { colors, formatDistance, sportEmoji, sportLabel } from '../../lib/theme';

const FILTERS: { value: CourtFilter; label: string }[] = [
  { value: 'all', label: 'All courts' },
  { value: 'free', label: 'Free courts' },
  { value: 'occupied', label: 'Occupied courts' },
  { value: 'paid', label: 'Paid courts' },
];
const RADII = [1, 5, 10, 20, 30, 50];

export default function Home() {
  const { state, refresh } = useHere();
  const [filter, setFilter] = useState<CourtFilter>('all');
  const [sport, setSport] = useState<Sport | undefined>();
  const [radius, setRadius] = useState(1);
  const [sheet, setSheet] = useState<'filter' | 'radius' | null>(null);
  const [customOpen, setCustomOpen] = useState(false);
  const [custom, setCustom] = useState('');

  const here = state.status === 'ready' ? state.here : null;
  // Spec: the sport picker appears under "Show" once free/occupied is chosen.
  const showSport = filter === 'free' || filter === 'occupied';
  const sportParam = showSport ? sport : undefined;

  const q = useQuery({
    queryKey: ['courts', here, radius, filter, sportParam],
    queryFn: () => api.courts(here!, { radius_km: radius, filter, sport: sportParam }),
    enabled: !!here,
    refetchInterval: 30_000,
  });

  const watch = useMutation({
    mutationFn: (id: string) => api.watch(id),
    onSuccess: () => Alert.alert("We'll let you know", 'You will get a notification when this court is free.'),
  });

  const longPress = (c: CourtListItem) => {
    const open = () => router.push({ pathname: '/court/[id]', params: { id: c.id } });
    if (c.status !== 'occupied') return open();
    const options = ['Details', 'Notify me when it frees up', 'Cancel'];
    const pick = (i: number) => (i === 0 ? open() : i === 1 ? watch.mutate(c.id) : undefined);
    if (Platform.OS === 'ios') ActionSheetIOS.showActionSheetWithOptions({ options, cancelButtonIndex: 2 }, pick);
    else
      Alert.alert(c.name, undefined, [
        { text: options[0], onPress: () => pick(0) },
        { text: options[1], onPress: () => pick(1) },
        { text: 'Cancel', style: 'cancel' },
      ]);
  };

  if (state.status === 'denied')
    return (
      <View style={[s.screen, { padding: 24, justifyContent: 'center', gap: 16 }]}>
        <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text }}>Location is off</Text>
        <Text style={{ color: colors.muted }}>Jsport needs your location to show the courts around you.</Text>
        <Button title="Try again" onPress={() => void refresh()} />
      </View>
    );

  const radiusLabel = RADII.includes(radius) ? `${radius} km` : `${radius} km (custom)`;

  return (
    <View style={s.screen}>
      {/* Filter bar: "Show" + "Radius" */}
      <View style={{ padding: 12, gap: 10, backgroundColor: colors.card, borderBottomWidth: 1, borderColor: colors.border }}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Chip label={`Show: ${FILTERS.find((f) => f.value === filter)!.label} ▾`} onPress={() => setSheet('filter')} />
          <Chip label={`Radius: ${radiusLabel} ▾`} onPress={() => setSheet('radius')} />
        </View>
        {showSport && (
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Chip label="All sports" active={!sport} onPress={() => setSport(undefined)} />
            {SPORTS.map((sp) => (
              <Chip key={sp} label={`${sportEmoji[sp]} ${sportLabel[sp]}`} active={sport === sp} onPress={() => setSport(sp)} />
            ))}
          </View>
        )}
        {customOpen && (
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            <TextInput
              style={[s.input, { flex: 1, height: 40 }]}
              keyboardType="decimal-pad"
              placeholder="Radius in km"
              value={custom}
              onChangeText={setCustom}
            />
            <Button
              title="Apply"
              style={{ height: 40 }}
              onPress={() => {
                const v = Number(custom.replace(',', '.'));
                if (v > 0 && v <= 200) {
                  setRadius(v);
                  setCustomOpen(false);
                }
              }}
            />
          </View>
        )}
      </View>

      <FlatList
        data={q.data ?? []}
        keyExtractor={(c) => c.id}
        contentContainerStyle={{ padding: 12, gap: 8, flexGrow: 1 }}
        refreshControl={<RefreshControl refreshing={q.isRefetching} onRefresh={() => void q.refetch()} />}
        ListEmptyComponent={
          <Text style={{ textAlign: 'center', color: colors.muted, marginTop: 40 }}>
            {q.isLoading || !here ? 'Finding courts near you…' : q.isError ? (q.error as Error).message : 'No courts in this radius. Try a bigger one.'}
          </Text>
        }
        renderItem={({ item: c }) => (
          <Pressable
            onPress={() => router.push({ pathname: '/court/[id]', params: { id: c.id } })}
            onLongPress={() => longPress(c)}
            style={({ pressed }) => ({
              backgroundColor: colors.card,
              borderRadius: 14,
              padding: 14,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <Text style={{ fontSize: 26 }}>{sportEmoji[c.sport]}</Text>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text }} numberOfLines={1}>
                {c.name}
              </Text>
              <Text style={{ color: colors.muted, fontSize: 13 }}>
                {formatDistance(c.distance_m)}
                {c.is_paid ? ' · paid' : ''}
                {c.players_count ? ` · ${c.players_count} playing` : ''}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <StatusDot status={c.status} />
              <Text style={{ color: c.status === 'free' ? colors.free : colors.occupied, fontWeight: '600' }}>
                {c.status === 'free' ? 'Free' : 'Occupied'}
              </Text>
            </View>
          </Pressable>
        )}
      />

      <OptionSheet
        visible={sheet === 'filter'}
        title="Show"
        options={FILTERS}
        value={filter}
        onSelect={setFilter}
        onClose={() => setSheet(null)}
      />
      <OptionSheet<number>
        visible={sheet === 'radius'}
        title="Radius"
        options={[...RADII.map((r) => ({ value: r, label: `${r} km` })), { value: -1, label: 'Custom…' }]}
        value={RADII.includes(radius) ? radius : -1}
        onSelect={(v) => (v === -1 ? setCustomOpen(true) : (setRadius(v), setCustomOpen(false)))}
        onClose={() => setSheet(null)}
      />
    </View>
  );
}
