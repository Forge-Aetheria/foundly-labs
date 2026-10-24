import { useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { useEffect, useRef } from 'react';
import { useSession } from '../auth/session-context';
import { PushPlatform } from '@/shared/api/generated';
import { registerDeviceToken, unregisterDeviceToken } from '@/modules/notifications/push-service';
import { addPushTokenListener, registerForPushNotifications } from './push';

export function usePushRegistration(): void {
  const { status, tenantId, registerBeforeSignOut } = useSession();
  const router = useRouter();
  const tokenRef = useRef<{ token: string; platform: PushPlatform } | null>(null);

  useEffect(() => {
    if (status !== 'authenticated' || !tenantId) return;
    let cancelled = false;

    const register = async () => {
      const result = await registerForPushNotifications();
      if (cancelled || result.status !== 'granted') return;
      const platform = result.platform === 'IOS' ? PushPlatform.Ios : PushPlatform.Android;
      tokenRef.current = { token: result.token, platform };
      await registerDeviceToken(result.token, platform);
    };

    void register();
    return () => {
      cancelled = true;
    };
  }, [status, tenantId]);

  useEffect(() => {
    if (status !== 'authenticated') return;
    return registerBeforeSignOut(async () => {
      const current = tokenRef.current;
      if (current) {
        await unregisterDeviceToken(current.token);
        tokenRef.current = null;
      }
    });
  }, [registerBeforeSignOut, status]);

  useEffect(() => {
    if (status !== 'authenticated') return;
    return addPushTokenListener(() => {
      void (async () => {
        const result = await registerForPushNotifications();
        if (result.status !== 'granted') return;
        const platform = result.platform === 'IOS' ? PushPlatform.Ios : PushPlatform.Android;
        tokenRef.current = { token: result.token, platform };
        await registerDeviceToken(result.token, platform);
      })();
    });
  }, [status]);

  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(() => {
      router.push('/(tabs)/notificaciones');
    });
    return () => subscription.remove();
  }, [router]);
}
