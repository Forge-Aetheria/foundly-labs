import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as Device from 'expo-device';
import { requireOptionalNativeModule } from 'expo-modules-core';
import { Platform } from 'react-native';
import { env } from '../config/env';

type NotificationsModule = typeof import('expo-notifications');

export type PushPlatformName = 'IOS' | 'ANDROID';

export type PushRegistrationResult =
  | { status: 'unsupported' | 'denied' | 'error'; message?: string }
  | { status: 'granted'; token: string; platform: PushPlatformName };

const EXPO_GO_MESSAGE =
  'Las notificaciones push requieren un development build de Expo. Expo Go solo admite notificaciones locales.';

let notificationsPromise: Promise<NotificationsModule | null> | null = null;
let handlerConfigured = false;

/** Expo Go does not ship the remote-notifications native module (SDK 53+). */
export function isExpoGo(): boolean {
  const storeClient =
    (ExecutionEnvironment as typeof ExecutionEnvironment | undefined)?.StoreClient ?? 'storeClient';
  const environment: string = Constants.executionEnvironment;
  return environment === storeClient || Constants.appOwnership === 'expo';
}

/** Android Expo Go lacks this module; a development build registers it. */
function hasAndroidNotificationsModule(): boolean {
  if (Platform.OS !== 'android') return true;
  try {
    return Boolean(requireOptionalNativeModule('ExpoTopicSubscriptionModule'));
  } catch {
    return false;
  }
}

/** Whether this runtime can ever obtain a remote push token. */
export function canUsePushNotifications(): boolean {
  return !isExpoGo() && hasAndroidNotificationsModule();
}

/**
 * Lazily load expo-notifications. In Expo Go / runtimes without the Android
 * native module this returns null without evaluating any native module.
 * Any unexpected native resolution error also degrades to null.
 */
async function getNotifications(): Promise<NotificationsModule | null> {
  if (!canUsePushNotifications()) return null;
  if (notificationsPromise) return notificationsPromise;

  notificationsPromise = Promise.resolve()
    .then(() => {
      // Lazy CommonJS load: Metro bundles the JS, but the native module is only
      // evaluated when the runtime actually supports remote notifications.
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const Notifications = require('expo-notifications') as NotificationsModule;
      if (!handlerConfigured) {
        Notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowBanner: true,
            shouldShowList: true,
            shouldPlaySound: true,
            shouldSetBadge: false,
          }),
        });
        handlerConfigured = true;
      }
      return Notifications;
    })
    .catch(() => null);

  return notificationsPromise;
}

function resolveProjectId(): string | null {
  if (env.easProjectId) return env.easProjectId;
  const extra = Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined;
  return extra?.eas?.projectId ?? null;
}

async function ensureAndroidChannel(Notifications: NotificationsModule): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('default', {
    name: 'Avisos de Foundly',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
  });
}

export async function registerForPushNotifications(): Promise<PushRegistrationResult> {
  if (!canUsePushNotifications()) {
    return { status: 'unsupported', message: EXPO_GO_MESSAGE };
  }
  if (!Device.isDevice) {
    return {
      status: 'unsupported',
      message: 'Las notificaciones push requieren un dispositivo físico.',
    };
  }

  const Notifications = await getNotifications();
  if (!Notifications) {
    return { status: 'unsupported', message: EXPO_GO_MESSAGE };
  }

  try {
    let permission = await Notifications.getPermissionsAsync();
    if (permission.status !== 'granted') {
      permission = await Notifications.requestPermissionsAsync();
    }
    if (permission.status !== 'granted') {
      return { status: 'denied' };
    }

    await ensureAndroidChannel(Notifications);

    const projectId = resolveProjectId();
    if (!projectId) {
      return { status: 'error', message: 'Falta el projectId de EAS para las notificaciones push.' };
    }

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

export async function subscribePushToken(listener: () => void): Promise<() => void> {
  try {
    const Notifications = await getNotifications();
    if (!Notifications) return () => undefined;
    const subscription = Notifications.addPushTokenListener(listener);
    return () => subscription.remove();
  } catch {
    return () => undefined;
  }
}

export async function subscribeNotificationResponses(
  listener: () => void,
): Promise<() => void> {
  try {
    const Notifications = await getNotifications();
    if (!Notifications) return () => undefined;
    const subscription = Notifications.addNotificationResponseReceivedListener(listener);
    return () => subscription.remove();
  } catch {
    return () => undefined;
  }
}
