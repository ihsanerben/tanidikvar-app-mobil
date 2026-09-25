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
  return <AuthForm title="TanıdıkVar'a giriş yap" description="Üniversite deneyimlerini paylaşan topluluğa katıl."
    schema={loginSchema} defaults={{ email: '', password: '' }}
    fields={[{ name: 'email', label: 'E-posta', kind: 'email', testID: 'login-email' }, { name: 'password', label: 'Şifre', kind: 'password', testID: 'login-password' }]}
    submitLabel="Giriş yap" testID="login-submit" submit={authApi.login}
    links={[{ href: '/register', label: 'Hesap oluştur' }, { href: '/forgot-password', label: 'Şifremi unuttum' }, { href: '/verify-email', label: 'E-postamı doğrula' }]} />;
}
