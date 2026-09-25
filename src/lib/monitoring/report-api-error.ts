import * as Sentry from '@sentry/react-native';
import { ApiError } from '../../../packages/api-client/errors';
export function reportApiError(error: unknown) {
  if (!(error instanceof ApiError) || error.status < 500) return;
  Sentry.captureMessage('API request failed', { level: 'error', tags: {
    'api.code': /^[A-Z_]{1,60}$/.test(error.code) ? error.code : 'UNKNOWN',
    'api.status': String(error.status),
    ...(error.requestId ? { traceId: error.requestId } : {}),
  } });
}
