import { Redirect, Stack, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, Text } from 'react-native';

import { useAuth } from '../../auth/AuthProvider';
import { Avatar } from '../../components/ui';
import { SideMenu } from '../../components/SideMenu';
import { Splash } from '../../components/Splash';
import { LocationProvider } from '../../lib/location';
import { listenForResponses, registerForPush } from '../../lib/notifications';
import { colors } from '../../lib/theme';

export default function AppLayout() {
  const { ready, user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    registerForPush().catch((e) => console.warn('push registration failed', e));
    return listenForResponses();
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!ready) return <Splash />;
  if (!user) return <Redirect href="/login" />;
  if (!user.favorite_sport) return <Redirect href="/onboarding" />;

  return (
    <LocationProvider>
      <Stack
        screenOptions={{
          headerTitleAlign: 'center',
          headerStyle: { backgroundColor: colors.card },
          headerShadowVisible: false,
          // Top bar per spec: menu (left) · app name → home (center) · profile (right)
          headerLeft: () => (
            <Pressable onPress={() => setMenuOpen(true)} hitSlop={12} accessibilityLabel="Open menu">
              <Text style={{ fontSize: 24, color: colors.text }}>☰</Text>
            </Pressable>
          ),
          headerTitle: () => (
            <Pressable onPress={() => router.dismissTo('/')} accessibilityLabel="Home">
              <Text style={{ fontSize: 20, fontWeight: '800', color: colors.primary }}>Jsport</Text>
            </Pressable>
          ),
          headerRight: () => (
            <Pressable onPress={() => router.push('/profile')} accessibilityLabel="My profile">
              <Avatar user={user} size={32} />
            </Pressable>
          ),
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="court/[id]" options={{ presentation: 'modal', headerShown: false }} />
      </Stack>
      <SideMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </LocationProvider>
  );
}
