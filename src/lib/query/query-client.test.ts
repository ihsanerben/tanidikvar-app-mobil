import { onlineManager } from '@tanstack/react-query';
import * as Network from 'expo-network';
import { connectQueryToNativeLifecycle } from './query-client';
jest.mock('@/lib/monitoring/report-api-error', () => ({ reportApiError: jest.fn() }));
jest.mock('expo-network', () => ({ getNetworkStateAsync: jest.fn(), addNetworkStateListener: jest.fn() }));
it('does not let the initial network snapshot overwrite a newer offline event', async () => {
  let resolve!: (state: Network.NetworkState) => void;
  jest.mocked(Network.getNetworkStateAsync).mockReturnValue(new Promise(done => { resolve=done; }));
  const remove=jest.fn();
  let listener!: (state: Network.NetworkState) => void;
  jest.mocked(Network.addNetworkStateListener).mockImplementation(fn => { listener=fn;return { remove }; });
  onlineManager.setOnline(true);
  const disconnect=connectQueryToNativeLifecycle();
  listener({isConnected:false,isInternetReachable:false});
  resolve({isConnected:true,isInternetReachable:true});
  await Promise.resolve();
  expect(onlineManager.isOnline()).toBe(false);
  disconnect();expect(remove).toHaveBeenCalled();onlineManager.setOnline(true);
});
