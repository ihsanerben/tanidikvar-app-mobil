import { AuthForm } from './auth-form';
import { authApi } from './api';
import { registerSchema } from './schemas';

export function RegisterScreen() {
  return <AuthForm eyebrow="Topluluğa katıl" title="Hesap oluştur" description=""
    schema={registerSchema} defaults={{ email: '', password: '' }}
    fields={[{ name: 'email', label: 'E-posta', kind: 'email', testID: 'register-email' }, { name: 'password', label: 'Parola', kind: 'new-password', testID: 'register-password' }]}
    submitLabel="Hesap oluştur" testID="register-submit" submit={authApi.register}
    successTitle="E-postanı doğrula" successMessage="Doğrulama bağlantısı gönderildi. Ardından oturum açabilirsin."
    links={[{ href: '/login', label: 'Zaten hesabın var mı? Oturum aç' }]} />;
}
