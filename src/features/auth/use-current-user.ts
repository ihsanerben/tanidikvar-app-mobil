import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth/auth-context';
import { authApi, authKeys } from './api';
export function useCurrentUser() {
  const { status } = useAuth();
  return useQuery({ queryKey: authKeys.me(), queryFn: ({ signal }) => authApi.me(signal), staleTime: 30_000, enabled: status === 'authenticated' });
}
