# Contract: Push Notifications

**Feature**: `specs/mobile/001-tenant-mobile-app` | **Date**: 2026-10-24

## Client lifecycle

1. After a successful login (never before), read `Device.isDevice`.
2. If not a physical device, mark `unsupported` and skip.
3. Read current permission with `getPermissionsAsync`; request only if `undetermined`.
4. If denied, mark `denied`, keep the app fully usable, and expose a settings hint.
5. Create the Android channel `default` (importance `MAX`, vibration, sound) before requesting a token.
6. Obtain the token with `getExpoPushTokenAsync({ projectId })`, where `projectId` comes from `expoConfig.extra.eas.projectId` or `EXPO_PUBLIC_EAS_PROJECT_ID`.
7. Call `registerPushToken({ token, platform, deviceId? })`.
8. On `Notifications.addPushTokenListener`, re-register the new token.
9. On logout, call `unregisterPushToken({ token })` best-effort, then clear local push state.
10. On notification tap (`addNotificationResponseReceivedListener`), navigate to `/(tabs)/notificaciones`.

## Token format and scoping

- Accepted: `ExponentPushToken[...]` and `ExpoPushToken[...]`.
- The server resolves `tenantId`/`userId` from the JWT; client input cannot choose a tenant.
- Re-registering the same token from another account reassigns it to the new tenant/user.

## Server delivery contract

- When a notification is persisted (new online booking, subscription warnings), the API sends an Expo push message to every token of the tenant.
- Batches of up to 100 messages to `https://exp.host/--/api/v2/push/send`.
- Payload includes `title`, `body`, `sound: 'default'`, `data: { type, notificationId }` for deep linking.
- Tokens returning `DeviceNotRegistered` are deleted; transient failures are retried with backoff.
- Push delivery failures never fail the originating business mutation.

## Environment

- `EXPO_PUBLIC_EAS_PROJECT_ID` (public), Supabase public keys, `EXPO_PUBLIC_API_URL`.
- No secret keys are embedded in the app bundle.
- Remote push requires an Expo development build; Expo Go is only valid for UI flows.

## Verification

- Test device receives a push originated by an API notification.
- Denied permission: no registration, no crash, full app functionality.
- Logout: token is unregistered and no further tenant pushes arrive.
