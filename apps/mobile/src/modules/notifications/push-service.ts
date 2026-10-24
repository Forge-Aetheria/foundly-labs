import {
  RegisterPushTokenDocument,
  UnregisterPushTokenDocument,
  PushPlatform,
  type RegisterPushTokenMutation,
  type UnregisterPushTokenMutation,
} from '@/shared/api/generated';
import { apiRequest } from '@/shared/api/client';
import { getAccessToken } from '@/shared/auth/supabase';
import { fail, ok, type ActionResult } from '@/shared/api/result';

export async function registerDeviceToken(
  token: string,
  platform: PushPlatform,
  deviceId?: string,
): Promise<ActionResult<true>> {
  const accessToken = await getAccessToken();
  if (!accessToken) return fail('UNAUTHENTICATED', 'Tu sesión ha expirado.');
  const result = await apiRequest<RegisterPushTokenMutation>(
    RegisterPushTokenDocument,
    { input: { token, platform, deviceId } },
    { token: accessToken },
  );
  return result.ok ? ok(true) : result;
}

export async function unregisterDeviceToken(token: string): Promise<ActionResult<true>> {
  const accessToken = await getAccessToken();
  if (!accessToken) return fail('UNAUTHENTICATED', 'Tu sesión ha expirado.');
  const result = await apiRequest<UnregisterPushTokenMutation>(
    UnregisterPushTokenDocument,
    { token },
    { token: accessToken },
  );
  return result.ok ? ok(true) : result;
}
