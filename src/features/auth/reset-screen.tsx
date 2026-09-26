import { router, useLocalSearchParams } from 'expo-router';
import { AuthForm } from './auth-form';
import { authApi } from './api';
import { actionParamsSchema, resetSchema } from './schemas';

export function ResetScreen() {
  const params = actionParamsSchema.safeParse(useLocalSearchParams());
  const token = params.success ? params.data.token ?? '' : '';
  return <AuthForm surface key={token} title="Yeni parola belirle"
    description="Yeni şifreni belirle. E-postadaki bağlantıda bulunan güvenlik bilgisi arka planda otomatik olarak kullanılır."
    schema={resetSchema} defaults={{ token, password: '' }}
    fields={[{ name: 'token', label: 'Yenileme kodu', kind: 'token', testID: 'reset-token' }, { name: 'password', label: 'Yeni şifre', kind: 'new-password', testID: 'reset-password' }]}
    submitLabel="Parolayı değiştir" testID="reset-submit" submit={authApi.reset}
    onSuccess={() => router.replace('/login')}
    links={[{ href: '/login', label: 'Giriş yap' }, { href: '/forgot-password', label: 'Yeni kod iste' }]} />;
}
