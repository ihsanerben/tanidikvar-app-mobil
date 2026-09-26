import { Redirect, useLocalSearchParams } from 'expo-router';
import { AuthForm } from './auth-form';
import { authApi } from './api';
import { loginSchema, returnToSchema } from './schemas';
import { destinationHref } from '@/lib/navigation/destination';
import { useAuth } from '@/lib/auth/auth-context';

export function LoginScreen() {
  const { status } = useAuth();
  const params = useLocalSearchParams();
  const destination = returnToSchema.safeParse(params.returnTo);
  if (status === 'authenticated') return <Redirect href={destinationHref(destination.success ? destination.data : '/')} />;
  return <AuthForm title="Oturum aç" description=""
    schema={loginSchema} defaults={{ email: '', password: '' }}
    fields={[{ name: 'email', label: 'E-posta', kind: 'email', testID: 'login-email' }, { name: 'password', label: 'Parola', kind: 'password', testID: 'login-password' }]}
    submitLabel="Oturum aç" testID="login-submit" submit={authApi.login}
    links={[{ href: '/register', label: 'Hesabın yok mu? Hesap oluştur' }, { href: '/forgot-password', label: 'Şifremi unuttum' }]} />;
}
