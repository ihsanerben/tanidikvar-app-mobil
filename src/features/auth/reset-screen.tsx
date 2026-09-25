import { useLocalSearchParams } from 'expo-router';
import { AuthForm } from './auth-form';
import { authApi } from './api';
import { actionParamsSchema, resetSchema } from './schemas';

export function ResetScreen() {
  const params = actionParamsSchema.safeParse(useLocalSearchParams());
  const token = params.success ? params.data.token ?? '' : '';
  return <AuthForm key={token} title="Yeni şifreni belirle"
    description={params.success ? 'E-postandaki kodu ve yeni şifreni yaz. Diğer oturumların kapatılacak.' : 'Bağlantıdaki kod geçersiz. E-postandaki kodu yapıştır.'}
    schema={resetSchema} defaults={{ token, password: '' }}
    fields={[{ name: 'token', label: 'Yenileme kodu', kind: 'token', testID: 'reset-token' }, { name: 'password', label: 'Yeni şifre', kind: 'new-password', testID: 'reset-password' }]}
    submitLabel="Şifreyi yenile" testID="reset-submit" submit={authApi.reset}
    successMessage="Şifren yenilendi. Yeni şifrenle giriş yapabilirsin."
    links={[{ href: '/login', label: 'Giriş yap' }, { href: '/forgot-password', label: 'Yeni kod iste' }]} />;
}
