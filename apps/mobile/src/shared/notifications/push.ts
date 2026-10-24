import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { env } from '../config/env';

export type PushPlatformName = 'IOS' | 'ANDROID';

export type PushRegistrationResult =
  | { status: 'unsupported' | 'denied' | 'error'; message?: string }
  | { status: 'granted'; token: string; platform: PushPlatformName };

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

function resolveProjectId(): string | null {
  if (env.easProjectId) return env.easProjectId;
  const extra = Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined;
  return extra?.eas?.projectId ?? null;
}

async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('default', {
    name: 'Avisos de Foundly',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
  });
}

export async function registerForPushNotifications(): Promise<PushRegistrationResult> {
  if (!Device.isDevice) {
    return {
      status: 'unsupported',
      message: 'Las notificaciones push requieren un dispositivo físico.',
    };
  }

  let permission = await Notifications.getPermissionsAsync();
  if (permission.status !== 'granted') {
    permission = await Notifications.requestPermissionsAsync();
  }
  if (permission.status !== 'granted') {
    return { status: 'denied' };
  }

  await ensureAndroidChannel();

  const projectId = resolveProjectId();
  if (!projectId) {
    return { status: 'error', message: 'Falta el projectId de EAS para las notificaciones push.' };
  }

  try {
    const token = await Notifications.getExpoPushTokenAsync({ projectId });
    return {
      status: 'granted',
      token: token.data,
      platform: Platform.OS === 'ios' ? 'IOS' : 'ANDROID',
    };
  } catch (error) {
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'No pudimos obtener el token push.',
    };
  }
}

export function addPushTokenListener(listener: () => void): () => void {
  const subscription = Notifications.addPushTokenListener(listener);
  return () => subscription.remove();
}
