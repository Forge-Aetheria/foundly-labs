import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { useSession } from '../auth/session-context';
import { PushPlatform } from '@/shared/api/generated';
import { registerDeviceToken, unregisterDeviceToken } from '@/modules/notifications/push-service';
import {
  canUsePushNotifications,
  registerForPushNotifications,
  subscribeNotificationResponses,
  subscribePushToken,
} from './push';

export function usePushRegistration(): void {
  const { status, tenantId, registerBeforeSignOut } = useSession();
  const router = useRouter();
  const tokenRef = useRef<{ token: string; platform: PushPlatform } | null>(null);

  useEffect(() => {
    if (status !== 'authenticated' || !tenantId || !canUsePushNotifications()) return;
    let cancelled = false;

    const register = async () => {
      try {
        const result = await registerForPushNotifications();
        if (cancelled || result.status !== 'granted') return;
        const platform = result.platform === 'IOS' ? PushPlatform.Ios : PushPlatform.Android;
        tokenRef.current = { token: result.token, platform };
        await registerDeviceToken(result.token, platform);
      } catch {
        // Push is optional: unsupported runtimes must never block the app shell.
      }
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
      if (!current) return;
      try {
        await unregisterDeviceToken(current.token);
      } catch {
        // Best effort: logout must always succeed.
      } finally {
        tokenRef.current = null;
      }
    });
  }, [registerBeforeSignOut, status]);

  useEffect(() => {
    if (status !== 'authenticated' || !canUsePushNotifications()) return;
    let active = true;
    let cleanup = () => undefined as void;

    void subscribePushToken(() => {
      void (async () => {
        try {
          const result = await registerForPushNotifications();
          if (result.status !== 'granted') return;
          const platform = result.platform === 'IOS' ? PushPlatform.Ios : PushPlatform.Android;
          tokenRef.current = { token: result.token, platform };
          await registerDeviceToken(result.token, platform);
        } catch {
          // Ignore token-refresh failures on unsupported runtimes.
        }
      })();
    }).then((unsubscribe) => {
      if (active) cleanup = unsubscribe;
      else unsubscribe();
    });

    return () => {
      active = false;
      cleanup();
    };
  }, [status]);

  useEffect(() => {
    if (!canUsePushNotifications()) return;
    let active = true;
    let cleanup = () => undefined as void;

    void subscribeNotificationResponses(() => {
      router.push('/(tabs)/notificaciones');
    }).then((unsubscribe) => {
      if (active) cleanup = unsubscribe;
      else unsubscribe();
    });

    return () => {
      active = false;
      cleanup();
    };
  }, [router]);
}
