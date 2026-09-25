import { Redirect } from 'expo-router';

import { useAuth } from '@/lib/auth/auth-context';

export default function IndexRoute() {
  const { status } = useAuth();
  if (status === 'authenticated') return <Redirect href="/(app)/(tabs)" />;
  return <Redirect href="/(auth)/login" />;
}
