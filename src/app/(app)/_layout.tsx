import { Redirect, Stack, usePathname, useGlobalSearchParams } from 'expo-router';

import { useAuth } from '@/lib/auth/auth-context';
import { preserveDestination } from '@/lib/navigation/destination';

export default function ProtectedLayout() {
  const { status } = useAuth();
  const path = preserveDestination(usePathname(), useGlobalSearchParams());
  if (status !== 'authenticated') return <Redirect href={{ pathname: '/login', params: { returnTo: path } }} />;
  return <Stack screenOptions={{ headerShown: false }} />;
}
