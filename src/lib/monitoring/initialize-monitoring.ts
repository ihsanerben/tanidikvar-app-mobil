import * as Sentry from '@sentry/react-native';
import * as Updates from 'expo-updates';
import { isRunningInExpoGo } from 'expo';
import { env } from '@/lib/env';
import { scrubEvent, scrubTransaction } from './privacy';
let initialized = false;
export function initializeMonitoring() {
  if (initialized) return;
  Sentry.init({
    dsn: env.EXPO_PUBLIC_SENTRY_DSN || undefined,
    enabled: Boolean(env.EXPO_PUBLIC_SENTRY_DSN), environment: env.EXPO_PUBLIC_APP_VARIANT,
    enableNative: !isRunningInExpoGo(),
    sendDefaultPii: false, tracesSampleRate: 0.1,
    beforeBreadcrumb(breadcrumb) {
      if (breadcrumb.category?.startsWith('http') || breadcrumb.category?.includes('navigation')) return null;
      return { category: breadcrumb.category, level: breadcrumb.level, timestamp: breadcrumb.timestamp };
    },
    beforeSend: scrubEvent,
    beforeSendTransaction: scrubTransaction,
  });
  Sentry.setTags({ 'app.variant': env.EXPO_PUBLIC_APP_VARIANT, 'update.id': Updates.updateId ?? 'embedded', 'update.channel': Updates.channel ?? 'development' });
  initialized = true;
}
