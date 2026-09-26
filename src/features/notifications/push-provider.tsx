import { createContext, type PropsWithChildren, useContext, useEffect } from 'react';
import { useMutation, onlineManager } from '@tanstack/react-query';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { nativeNotifications as Notifications } from './native-notifications';
import * as SecureStore from 'expo-secure-store';
import { AppState, Platform } from 'react-native';
import { useAuth } from '@/lib/auth/auth-context';
import { tokenManager } from '@/lib/auth/token-manager';
import { registerPushDevice, unregisterPushDevice } from './api';
import { createPushRegistration, type PushState } from './push-registration';

const preferenceKey = 'push.enabled';
const projectId = Constants.easConfig?.projectId ?? Constants.expoConfig?.extra?.eas?.projectId;
const registration = createPushRegistration({
  supported: () => Notifications !== null && Device.isDevice && typeof projectId === 'string',
  authenticated: () => tokenManager.getStatus() === 'authenticated',
  generation: tokenManager.getGeneration,
  preference: async () => (await SecureStore.getItemAsync(preferenceKey)) === 'true',
  savePreference: enabled => SecureStore.setItemAsync(preferenceKey, String(enabled)),
  async permission(ask) {
    if (!Notifications) return { granted: false, canAskAgain: false };
    if (Platform.OS === 'android') await Notifications.setNotificationChannelAsync('activity', { name: 'Topluluk bildirimleri', importance: Notifications.AndroidImportance.DEFAULT });
    let permission = await Notifications.getPermissionsAsync();
    if (ask && !permission.granted && permission.canAskAgain) permission = await Notifications.requestPermissionsAsync();
    return permission;
  },
  token: async () => {
    if (!Notifications) throw new Error('Push notifications unavailable');
    return (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  },
  register: token => registerPushDevice(token, Platform.OS === 'ios' ? 'IOS' : 'ANDROID'),
  unregister: unregisterPushDevice,
});
const PushContext = createContext<{ state: PushState; busy: boolean; error: unknown; run(action: 'enable' | 'disable' | 'sync'): void } | null>(null);
export function PushProvider({ children }: PropsWithChildren) {
  const { status } = useAuth();
  const { mutate, reset, data, error, isPending } = useMutation({ mutationFn: registration, retry: 0, networkMode: 'always' });
  useEffect(() => {
    if (!Notifications || status !== 'authenticated') { reset(); return; }
    const sync = () => { if (onlineManager.isOnline()) mutate('sync'); };
    sync();
    const network = onlineManager.subscribe(online => { if (online) sync(); });
    const app = AppState.addEventListener('change', state => { if (state === 'active') sync(); });
    const token = Notifications.addPushTokenListener(sync);
    return () => { app.remove(); token?.remove(); network(); };
  }, [status, mutate, reset]);
  return <PushContext.Provider value={{ state: Notifications ? data ?? 'disabled' : 'unavailable', busy: isPending, error, run: mutate }}>{children}</PushContext.Provider>;
}
export function usePush() {
  const value = useContext(PushContext);
  if (!value) throw new Error('PushProvider is required');
  return value;
}
