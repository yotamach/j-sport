import { Redirect, Stack } from 'expo-router';

import { useAuth } from '../../auth/AuthProvider';
import { Splash } from '../../components/Splash';

export default function AuthLayout() {
  const { ready, user } = useAuth();
  if (!ready) return <Splash />;
  if (user) return <Redirect href="/" />;
  return <Stack screenOptions={{ headerShown: false }} />;
}
