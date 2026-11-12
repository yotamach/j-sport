import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { FlatList, Pressable, Text, View } from 'react-native';

import { api } from '../../api/client';
import { StatusDot, s } from '../../components/ui';
import { useHere } from '../../lib/location';
import { colors, formatDistance, sportEmoji } from '../../lib/theme';

/** Courts you've played at, with live status — even if they're far from you now. */
export default function History() {
  const { state } = useHere();
  const here = state.status === 'ready' ? state.here : null;
  const q = useQuery({ queryKey: ['history', here], queryFn: () => api.history(here!), enabled: !!here });

  return (
    <FlatList
      style={s.screen}
      data={q.data ?? []}
      keyExtractor={(c) => c.id}
      contentContainerStyle={{ padding: 12, gap: 8 }}
      ListHeaderComponent={<Text style={{ fontSize: 20, fontWeight: '800', marginBottom: 4, color: colors.text }}>History</Text>}
      ListEmptyComponent={<Text style={{ color: colors.muted }}>{q.isLoading ? 'Loading…' : "Courts you play at will show up here."}</Text>}
      renderItem={({ item: c }) => (
        <Pressable
          onPress={() => router.push({ pathname: '/court/[id]', params: { id: c.id } })}
          style={{ backgroundColor: colors.card, borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}
        >
          <Text style={{ fontSize: 24 }}>{sportEmoji[c.sport]}</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: '600', color: colors.text }}>{c.name}</Text>
            <Text style={{ color: colors.muted, fontSize: 13 }}>{formatDistance(c.distance_m)}</Text>
          </View>
          <StatusDot status={c.status} />
        </Pressable>
      )}
    />
  );
}
