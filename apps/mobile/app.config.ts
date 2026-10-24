import type { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'Foundly Tenant',
  slug: 'foundly-tenant',
  version: '0.1.0',
  orientation: 'portrait',
  scheme: 'foundly-mobile',
  userInterfaceStyle: 'light',
  icon: './assets/icon.png',
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.foundlylabs.tenant',
  },
  android: {
    package: 'com.foundlylabs.tenant',
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#FFFFFF',
    },
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    [
      'expo-splash-screen',
      {
        image: './assets/splash-icon.png',
        resizeMode: 'contain',
        backgroundColor: '#FFFFFF',
      },
    ],
    [
      'expo-notifications',
      {
        icon: './assets/adaptive-icon.png',
        color: '#5B4CF5',
      },
    ],
  ],
  extra: {
    eas: {
      projectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID ?? '',
    },
  },
};

export default config;
