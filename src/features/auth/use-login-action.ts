import { router, useGlobalSearchParams, usePathname } from 'expo-router';
import { useAuth } from '@/lib/auth/auth-context';
import { preserveDestination } from '@/lib/navigation/destination';
export function useLoginAction() {
  const { status } = useAuth();
  const path = preserveDestination(usePathname(), useGlobalSearchParams());
  return (action: () => void) => {
    if (status === 'authenticated') action();
    else router.push({ pathname: '/login', params: { returnTo: path } });
  };
}
