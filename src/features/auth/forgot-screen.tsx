import { AuthForm } from './auth-form';
import { authApi } from './api';
import { emailSchema } from './schemas';

export function ForgotScreen() {
  return <AuthForm title="Şifreni yenile" description="Hesabına bağlı e-posta adresini yaz."
    schema={emailSchema} defaults={{ email: '' }}
    fields={[{ name: 'email', label: 'E-posta', kind: 'email', testID: 'forgot-email' }]}
    submitLabel="Yenileme kodu gönder" testID="forgot-submit" submit={authApi.forgot}
    successMessage="Adres uygunsa şifre yenileme e-postası gönderildi."
    links={[{ href: '/reset-password', label: 'Yenileme kodunu gir' }, { href: '/login', label: 'Girişe dön' }]} />;
}
