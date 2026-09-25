import { reportApiError } from '@/lib/monitoring/report-api-error';
import { focusManager, onlineManager, QueryClient, QueryCache, MutationCache } from '@tanstack/react-query';
import * as Network from 'expo-network';
import { AppState } from 'react-native';
import { ApiError } from '../../../packages/api-client/errors';

export const queryClient = new QueryClient({
  queryCache: new QueryCache({ onError: reportApiError }),
  mutationCache: new MutationCache({ onError: reportApiError }),
  defaultOptions: {
    queries: { staleTime: 30_000, retry: (count, error) => count < 2 && !(error instanceof ApiError && error.status >= 400 && error.status < 500), refetchOnReconnect: true },
    mutations: { retry: 0, networkMode: 'always' },
  },
});

export function connectQueryToNativeLifecycle() {
  focusManager.setFocused(AppState.currentState === 'active');
  const appStateSubscription = AppState.addEventListener('change', (state) => {
    focusManager.setFocused(state === 'active');
  });

  onlineManager.setEventListener((setOnline) => {
    let active = true;
    let revision = 0;
    const initialRevision = revision;
    void Network.getNetworkStateAsync().then(state => {
      if (active && initialRevision === revision) setOnline(state.isConnected !== false && state.isInternetReachable !== false);
    }).catch(() => undefined);
    const networkSubscription = Network.addNetworkStateListener((state) => {
      revision++;
      if (active) setOnline(state.isConnected !== false && state.isInternetReachable !== false);
    });
    return () => { active = false; networkSubscription.remove(); };
  });

  return () => {
    appStateSubscription.remove();
    onlineManager.setEventListener(() => () => undefined);
  };
}
