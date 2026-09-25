import Constants from 'expo-constants';
import { incomingLink } from '@/lib/navigation/incoming-link';

export function redirectSystemPath({ path }: { path: string; initial: boolean }) {
  return incomingLink(path, Constants.expoConfig?.extra?.linkHost) ?? '/invalid-link';
}
