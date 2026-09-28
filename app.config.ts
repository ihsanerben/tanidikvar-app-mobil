import type { ConfigContext, ExpoConfig } from 'expo/config';

type AppVariant = 'development' | 'preview' | 'production';

const variants: Record<AppVariant, { name: string; identifier: string }> = {
  development: { name: 'TanıdıkVar Dev', identifier: 'com.tanidikvar.app.dev' },
  preview: { name: 'TanıdıkVar Preview', identifier: 'com.tanidikvar.app.preview' },
  production: { name: 'TanıdıkVar', identifier: 'com.tanidikvar.app' },
};

export default ({ config }: ConfigContext): ExpoConfig => {
  const requestedVariant = process.env.APP_VARIANT ?? 'development';
  if (!(requestedVariant in variants)) {
    throw new Error(`Desteklenmeyen APP_VARIANT: ${requestedVariant}`);
  }

  const variant = variants[requestedVariant as AppVariant];
  const projectId = process.env.EAS_PROJECT_ID || '0ccbc744-7c80-44b0-879e-9249eff10d42';
  if (projectId && !/^[0-9a-f-]{36}$/i.test(projectId)) throw new Error('EAS_PROJECT_ID UUID olmalıdır.');
  const linkHost = process.env.APP_LINK_HOST || (requestedVariant === 'production' ? 'tanidikvar.com.tr' : undefined);
  if (linkHost && !/^[a-z0-9]+(?:[.-][a-z0-9]+)*\.[a-z]{2,}$/i.test(linkHost)) throw new Error('APP_LINK_HOST yalnız hostname olmalıdır.');
  if (requestedVariant !== 'development') {
    const api = new URL(process.env.EXPO_PUBLIC_API_URL ?? '');
    if (api.protocol !== 'https:' || api.username || api.password || api.search || api.hash || api.pathname !== '/') throw new Error('Preview/production için güvenli API origin gereklidir.');
    if (!projectId) throw new Error('Preview/production için EAS_PROJECT_ID gereklidir.');
    if (process.env.EXPO_PUBLIC_APP_VARIANT !== requestedVariant) throw new Error('Public ve build ortamları eşleşmelidir.');
  }
  return {
    ...config,
    name: variant.name,
    slug: 'tanidikvar-app',
    owner: 'ihsanerben',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: requestedVariant === 'production' ? 'tanidikvar' : requestedVariant === 'preview' ? 'tanidikvar-preview' : 'tanidikvar-dev',
    extra: { eas: { projectId }, linkHost },
    ...(projectId ? { updates: { url: `https://u.expo.dev/${projectId}` } } : {}),
    userInterfaceStyle: 'light',
    runtimeVersion: { policy: 'fingerprint' },
    ios: {
      bundleIdentifier: variant.identifier,
      icon: './assets/images/icon.png',
      supportsTablet: true,
      associatedDomains: linkHost ? [`applinks:${linkHost}`] : [],
      infoPlist: { ITSAppUsesNonExemptEncryption: false },
    },
    android: {
      package: variant.identifier,
      blockedPermissions: ['android.permission.RECORD_AUDIO', 'android.permission.READ_CONTACTS', 'android.permission.ACCESS_FINE_LOCATION', 'android.permission.ACCESS_COARSE_LOCATION', 'android.permission.READ_EXTERNAL_STORAGE', 'android.permission.WRITE_EXTERNAL_STORAGE', ...(requestedVariant === 'development' ? [] : ['android.permission.SYSTEM_ALERT_WINDOW'])],
      ...(process.env.GOOGLE_SERVICES_JSON ? { googleServicesFile: process.env.GOOGLE_SERVICES_JSON } : {}),
      intentFilters: linkHost ? [{ action: 'VIEW', autoVerify: true, category: ['BROWSABLE', 'DEFAULT'],
        data: [...['/soru/', '/universite/', '/program/', '/profiles/', '/tanidik/', '/sehir/'].map(pathPrefix => ({ scheme: 'https', host: linkHost, pathPrefix })), ...['/verify-email', '/reset-password', '/e-posta-dogrula', '/parola-yenile', '/karsilastir', '/sorular', '/populer', '/universiteler', '/programlar', '/tanidiklar', '/arama', '/siralama', '/istatistikler', '/hakkimizda', '/durum', '/soru-sor'].map(path => ({ scheme: 'https', host: linkHost, path }))],
      }] : [],
      adaptiveIcon: {
        backgroundColor: '#163F36',
        foregroundImage: './assets/images/android-icon-foreground.png',
        monochromeImage: './assets/images/android-icon-monochrome.png',
      },
      predictiveBackGestureEnabled: true,
    },
    web: { bundler: 'metro', output: 'static', favicon: './assets/images/favicon.png' },
    plugins: [
      'expo-router',
      ['expo-secure-store', { faceIDPermission: false }],
      ['./plugins/with-local-network-permission', { development: requestedVariant === 'development' }],
      'expo-notifications',
      ['@sentry/react-native/expo', { organization: process.env.SENTRY_ORG, project: process.env.SENTRY_PROJECT }],
      [
        'expo-splash-screen',
        {
          backgroundColor: '#F7F8FA',
          image: './assets/images/splash-icon.png',
          imageWidth: 88,
        },
      ],
    ],
    experiments: { typedRoutes: true, reactCompiler: true },
  };
};
