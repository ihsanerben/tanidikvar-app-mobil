import { Redirect, Stack, usePathname, useGlobalSearchParams } from 'expo-router';

import { useAuth } from '@/lib/auth/auth-context';
import { preserveDestination } from '@/lib/navigation/destination';
import { requiresSession } from '@/lib/navigation/access';

export default function ProtectedLayout() {
  const { status } = useAuth();
  const pathname = usePathname();
  const path = preserveDestination(pathname, useGlobalSearchParams());
  if (status !== 'authenticated' && requiresSession(pathname)) return <Redirect href={{ pathname: '/login', params: { returnTo: path } }} />;
  return <Stack screenOptions={{ headerShown: false }} />;
}
