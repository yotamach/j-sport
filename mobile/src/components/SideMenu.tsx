import { router, type Href } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Animated, Dimensions, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '../auth/AuthProvider';
import { colors } from '../lib/theme';

const WIDTH = Dimensions.get('window').width * 0.75; // spec: slides over 3/4 of the screen, left to right

type Item = { label: string; href: Href; ready?: boolean };

const ITEMS: Item[] = [
  { label: 'Search', href: '/soon/search' },
  { label: 'Friends', href: '/soon/friends' },
  { label: 'Tournaments', href: '/soon/tournaments' },
  { label: 'My teams', href: '/soon/teams' },
  { label: 'Challenge', href: '/soon/challenge' },
  { label: 'Favorites', href: '/soon/favorites' },
  { label: 'History', href: '/history', ready: true },
  { label: 'Chats', href: '/soon/chats' },
  { label: 'Notifications', href: '/soon/notifications' },
  { label: 'Settings', href: '/soon/settings' },
  { label: 'About', href: '/about', ready: true },
];

export function SideMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const x = useRef(new Animated.Value(-WIDTH)).current;
  const insets = useSafeAreaInsets();
  const { signOut, user } = useAuth();

  useEffect(() => {
    Animated.timing(x, { toValue: open ? 0 : -WIDTH, duration: 220, useNativeDriver: true }).start();
  }, [open, x]);

  const go = (href: Href) => {
    onClose();
    router.push(href);
  };

  return (
    <Modal visible={open} transparent animationType="none" onRequestClose={onClose}>
      <Pressable style={st.backdrop} onPress={onClose} />
      <Animated.View style={[st.panel, { paddingTop: insets.top + 16, transform: [{ translateX: x }] }]}>
        <Text style={st.hello}>Hi, {user?.full_name || user?.username}</Text>
        {ITEMS.map((it) => (
          <Pressable key={it.label} style={st.row} onPress={() => go(it.href)}>
            <Text style={st.rowText}>{it.label}</Text>
            {!it.ready && <Text style={st.soon}>soon</Text>}
          </Pressable>
        ))}
        <View style={{ flex: 1 }} />
        <Pressable
          style={[st.row, { marginBottom: insets.bottom + 8 }]}
          onPress={() => {
            onClose();
            void signOut();
          }}
        >
          <Text style={[st.rowText, { color: colors.danger }]}>Sign out</Text>
        </Pressable>
      </Animated.View>
    </Modal>
  );
}

const st = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: '#0006' },
  panel: { position: 'absolute', top: 0, bottom: 0, left: 0, width: WIDTH, backgroundColor: colors.card, paddingHorizontal: 20 },
  hello: { fontSize: 20, fontWeight: '700', marginBottom: 16, color: colors.text },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 13 },
  rowText: { fontSize: 16, color: colors.text },
  soon: { fontSize: 11, color: colors.muted, borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 6 },
});
