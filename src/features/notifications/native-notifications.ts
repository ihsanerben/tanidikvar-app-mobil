import { isRunningInExpoGo } from 'expo';
import { Platform } from 'react-native';

// Do not evaluate expo-notifications or register native listeners inside Expo Go.
export const nativeNotifications: typeof import('expo-notifications') | null =
  Platform.OS === 'web' || isRunningInExpoGo()
    ? null
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    : require('expo-notifications');
