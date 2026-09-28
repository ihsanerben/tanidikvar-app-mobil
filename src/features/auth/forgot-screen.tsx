import { AuthForm } from './auth-form';
import { authApi } from './api';
import { emailSchema } from './schemas';

export function ForgotScreen() {
  return <AuthForm eyebrow="Hesap güvenliği" surface title="Şifreni yenile" description="Hesabına bağlı e-posta adresini yaz. Şifreni güvenle yenileyebilmen için sana bir bağlantı göndereceğiz."
    schema={emailSchema} defaults={{ email: '' }}
    fields={[{ name: 'email', label: 'E-posta', kind: 'email', testID: 'forgot-email' }]}
    submitLabel="Yenileme bağlantısı gönder" testID="forgot-submit" submit={authApi.forgot}
    successMessage="Adres uygunsa şifre yenileme e-postası gönderildi."
    links={[{ href: '/login', label: '← Oturum açmaya dön' }]} />;
}
