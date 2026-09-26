import Constants from 'expo-constants';
import { isRunningInExpoGo } from 'expo';
import { incomingLink } from '@/lib/navigation/incoming-link';

export function redirectSystemPath({ path }: { path: string; initial: boolean }) {
  return incomingLink(path, Constants.expoConfig?.extra?.linkHost, isRunningInExpoGo()) ?? '/invalid-link';
}
