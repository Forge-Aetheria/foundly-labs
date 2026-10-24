import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { registerForPushNotifications } from '../push';

jest.mock('expo-device', () => ({ isDevice: true }));
jest.mock('expo-constants', () => ({
  executionEnvironment: 'bare',
  expoConfig: { extra: { eas: { projectId: 'project-1' } } },
}));
jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  setNotificationChannelAsync: jest.fn(),
  getExpoPushTokenAsync: jest.fn(),
  addPushTokenListener: jest.fn(() => ({ remove: jest.fn() })),
}));

jest.mock('@/shared/config/env', () => ({
  env: {
    apiUrl: 'http://localhost:3002',
    supabaseUrl: 'https://example.supabase.co',
    supabaseAnonKey: 'key',
    easProjectId: 'project-1',
  },
}));

const mockedDevice = Device as unknown as { isDevice: boolean };
const mockedNotifications = Notifications as unknown as {
  getPermissionsAsync: jest.Mock;
  requestPermissionsAsync: jest.Mock;
  getExpoPushTokenAsync: jest.Mock;
};

describe('registerForPushNotifications', () => {
  beforeEach(() => {
    mockedDevice.isDevice = true;
    mockedNotifications.getPermissionsAsync.mockReset();
    mockedNotifications.requestPermissionsAsync.mockReset();
    mockedNotifications.getExpoPushTokenAsync.mockReset();
  });

  it('returns unsupported on simulators', async () => {
    mockedDevice.isDevice = false;
    await expect(registerForPushNotifications()).resolves.toMatchObject({ status: 'unsupported' });
  });

  it('returns denied without requesting a token', async () => {
    mockedNotifications.getPermissionsAsync.mockResolvedValue({ status: 'undetermined' });
    mockedNotifications.requestPermissionsAsync.mockResolvedValue({ status: 'denied' });
    await expect(registerForPushNotifications()).resolves.toEqual({ status: 'denied' });
    expect(mockedNotifications.getExpoPushTokenAsync).not.toHaveBeenCalled();
  });

  it('captures the Expo push token when permission is granted', async () => {
    mockedNotifications.getPermissionsAsync.mockResolvedValue({ status: 'granted' });
    mockedNotifications.getExpoPushTokenAsync.mockResolvedValue({
      data: 'ExponentPushToken[abc]',
    });
    await expect(registerForPushNotifications()).resolves.toEqual({
      status: 'granted',
      token: 'ExponentPushToken[abc]',
      platform: 'IOS',
    });
  });
});
