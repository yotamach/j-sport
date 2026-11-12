import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { Platform } from 'react-native';

import { api } from '../api/client';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/** Action buttons shown when the user long-presses / pulls down a banner (spec: extend by 45 min, take a freed court). */
async function registerCategories() {
  await Notifications.setNotificationCategoryAsync('session_warning', [
    { identifier: 'extend', buttonTitle: 'Extend 45 min', options: { opensAppToForeground: false } },
    { identifier: 'release', buttonTitle: 'Release court', options: { isDestructive: true, opensAppToForeground: false } },
  ]);
  await Notifications.setNotificationCategoryAsync('court_free', [
    { identifier: 'open', buttonTitle: 'Take it', options: { opensAppToForeground: true } },
  ]);
}

export async function registerForPush(): Promise<void> {
  if (!Device.isDevice) return; // push tokens need a physical device
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }
  let { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') status = (await Notifications.requestPermissionsAsync()).status;
  if (status !== 'granted') return;
  await registerCategories();

  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  if (!projectId) {
    console.warn('No EAS projectId — run `npx eas-cli init` to enable push notifications.');
    return;
  }
  const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
  await api.putPushToken(data);
}

export function listenForResponses() {
  const sub = Notifications.addNotificationResponseReceivedListener(async (res) => {
    const data = res.notification.request.content.data as Record<string, string | boolean>;
    const action = res.actionIdentifier;
    try {
      if (data.type === 'session_warning' && action === 'extend') await api.extend(String(data.session_id));
      else if (data.type === 'session_warning' && action === 'release') await api.release(String(data.session_id));
      else if (data.court_id) router.push({ pathname: '/court/[id]', params: { id: String(data.court_id) } });
    } catch (e) {
      console.warn('notification action failed', e);
    }
  });
  return () => sub.remove();
}
