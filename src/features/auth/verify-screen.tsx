import { useLocalSearchParams } from 'expo-router';
import { AuthForm } from './auth-form';
import { authApi } from './api';
import { actionParamsSchema, verifySchema } from './schemas';

export function VerifyScreen() {
  const params = actionParamsSchema.safeParse(useLocalSearchParams());
  const token = params.success ? params.data.token ?? '' : '';
  return <AuthForm key={token} title="E-postanı doğrula"
    description={params.success ? 'E-postandaki doğrulama kodunu yapıştır.' : 'Bağlantıdaki kod geçersiz. E-postandaki kodu aşağıya yapıştır.'}
    schema={verifySchema} defaults={{ token }}
    fields={[{ name: 'token', label: 'Doğrulama kodu', kind: 'token', testID: 'verify-token' }]}
    submitLabel="Doğrula" testID="verify-submit" submit={authApi.verify} successMessage="E-postan doğrulandı. Giriş yapabilirsin."
    links={[{ href: '/login', label: 'Giriş yap' }, { href: '/resend-verification', label: 'Yeni kod iste' }]} />;
}
