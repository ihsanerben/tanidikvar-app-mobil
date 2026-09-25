import { z } from 'zod';

export const environmentSchema = z.object({
  EXPO_PUBLIC_APP_VARIANT: z.enum(['development', 'preview', 'production']).default('development'),
  EXPO_PUBLIC_API_URL: z.url(),
  EXPO_PUBLIC_SENTRY_DSN: z.url().optional().or(z.literal('')),
}).superRefine((value, ctx) => {
  const url = new URL(value.EXPO_PUBLIC_API_URL);
  if (url.username || url.password || url.search || url.hash || (url.pathname !== '/' && url.pathname !== ''))
    ctx.addIssue({ code: 'custom', path: ['EXPO_PUBLIC_API_URL'], message: 'API adresi yalnız origin içermelidir.' });
  if (url.protocol !== 'https:' && !(value.EXPO_PUBLIC_APP_VARIANT === 'development' && url.protocol === 'http:'))
    ctx.addIssue({ code: 'custom', path: ['EXPO_PUBLIC_API_URL'], message: 'Preview ve production için HTTPS gereklidir.' });
});
