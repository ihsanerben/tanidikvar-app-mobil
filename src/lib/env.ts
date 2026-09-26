import Constants from 'expo-constants';
import { isRunningInExpoGo } from 'expo';
import { environmentSchema } from './env-schema';
import { developmentApiOrigin } from './development-api-origin';
const configured = environmentSchema.parse({
  EXPO_PUBLIC_APP_VARIANT: process.env.EXPO_PUBLIC_APP_VARIANT,
  EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL,
  EXPO_PUBLIC_SENTRY_DSN: process.env.EXPO_PUBLIC_SENTRY_DSN,
});
export const env = {
  ...configured,
  EXPO_PUBLIC_API_URL: developmentApiOrigin(configured.EXPO_PUBLIC_API_URL, Constants.expoConfig?.hostUri, isRunningInExpoGo(), configured.EXPO_PUBLIC_APP_VARIANT),
};
