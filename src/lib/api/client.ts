import { createTypedClient } from '../../../packages/api-client/typed-client';
import { tokenManager } from '@/lib/auth/token-manager';
import { env } from '@/lib/env';

export const api = createTypedClient(env.EXPO_PUBLIC_API_URL, tokenManager);
