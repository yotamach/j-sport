import * as Facebook from 'expo-auth-session/providers/facebook';
import { Link } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { api } from '../../api/client';
import { useAuth } from '../../auth/AuthProvider';
import { Button, Field, s } from '../../components/ui';
import { colors } from '../../lib/theme';

WebBrowser.maybeCompleteAuthSession();

const FB_APP_ID = process.env.EXPO_PUBLIC_FACEBOOK_APP_ID;

export default function Login() {
  const { signIn } = useAuth();
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      await signIn(await api.login(login, password));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={s.screen}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: 24, gap: 16, flexGrow: 1, justifyContent: 'center' }}>
          <Text style={{ fontSize: 36, fontWeight: '800', color: colors.primary, textAlign: 'center' }}>Jsport</Text>
          <Text style={{ textAlign: 'center', color: colors.muted, marginBottom: 12 }}>Courts near you, players to play with</Text>
          <Field label="Email or username" value={login} onChangeText={setLogin} autoComplete="username" />
          <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry autoComplete="password" />
          {error && <Text style={s.error}>{error}</Text>}
          <Button title="Log in" onPress={submit} loading={busy} disabled={!login || !password} />
          {FB_APP_ID ? <FacebookButton appId={FB_APP_ID} onError={setError} /> : null}
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 8 }}>
            <Text style={{ color: colors.muted }}>New here?</Text>
            <Link href="/register" style={{ color: colors.primary, fontWeight: '600' }}>
              Create an account
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function FacebookButton({ appId, onError }: { appId: string; onError: (m: string) => void }) {
  const { signIn } = useAuth();
  const [request, response, promptAsync] = Facebook.useAuthRequest({ clientId: appId });

  useEffect(() => {
    if (response?.type !== 'success') return;
    const token = response.authentication?.accessToken ?? response.params.access_token;
    if (!token) return;
    api
      .facebook(token)
      .then(signIn)
      .catch((e: Error) => onError(e.message));
  }, [response, signIn, onError]);

  return <Button title="Continue with Facebook" variant="secondary" disabled={!request} onPress={() => void promptAsync()} />;
}
