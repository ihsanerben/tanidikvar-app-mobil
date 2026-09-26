import { AuthForm } from './auth-form';
import { authApi } from './api';
import { emailSchema } from './schemas';

export function ResendScreen() {
  return <AuthForm surface title="Doğrulama e-postasını yeniden gönder" description=""
    schema={emailSchema} defaults={{ email: '' }}
    fields={[{ name: 'email', label: 'E-posta', kind: 'email', testID: 'resend-email' }]}
    submitLabel="Gönder" testID="resend-submit" submit={authApi.resend}
    successMessage="Adres uygunsa doğrulama e-postası gönderildi."
    links={[{ href: '/login', label: '← Oturum açmaya dön' }]} />;
}
