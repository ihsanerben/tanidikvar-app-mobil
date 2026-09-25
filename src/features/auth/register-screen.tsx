import { AuthForm } from './auth-form';
import { authApi } from './api';
import { registerSchema } from './schemas';

export function RegisterScreen() {
  return <AuthForm title="Aramıza katıl" description="E-posta adresini doğruladıktan sonra giriş yapabilirsin."
    schema={registerSchema} defaults={{ email: '', password: '' }}
    fields={[{ name: 'email', label: 'E-posta', kind: 'email', testID: 'register-email' }, { name: 'password', label: 'Şifre', kind: 'new-password', testID: 'register-password' }]}
    submitLabel="Hesap oluştur" testID="register-submit" submit={authApi.register}
    successMessage="Adres uygunsa doğrulama e-postası gönderildi. E-postandaki kodla devam edebilirsin."
    links={[{ href: '/verify-email', label: 'Doğrulama kodunu gir' }, { href: '/login', label: 'Girişe dön' }]} />;
}
