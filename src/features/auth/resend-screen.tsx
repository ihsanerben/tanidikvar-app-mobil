import { AuthForm } from './auth-form';
import { authApi } from './api';
import { emailSchema } from './schemas';

export function ResendScreen() {
  return <AuthForm title="Yeni doğrulama kodu" description="E-posta adresini yeniden doğrulamak için kod iste."
    schema={emailSchema} defaults={{ email: '' }}
    fields={[{ name: 'email', label: 'E-posta', kind: 'email', testID: 'resend-email' }]}
    submitLabel="Kod gönder" testID="resend-submit" submit={authApi.resend}
    successMessage="Adres uygunsa doğrulama e-postası gönderildi."
    links={[{ href: '/verify-email', label: 'Kodu gir' }, { href: '/login', label: 'Girişe dön' }]} />;
}
