import { AuthForm } from './auth-form';
import { authApi } from './api';
import { closeSchema } from './schemas';

export function CloseScreen() {
  return <AuthForm title="Hesabını kapat" description="Hesabın pasifleştirilir ve bütün oturumların kapatılır. Geçmiş katkı ve denetim kayıtları korunur. Bu işlem verilerini tamamen silmez."
    schema={closeSchema} defaults={{ password: '' }}
    fields={[{ name: 'password', label: 'Mevcut şifren', kind: 'password', testID: 'close-password' }, { name: 'confirmation', label: 'Onay için HESABIMI KAPAT yaz', testID: 'close-confirmation' }]}
    submitLabel="Hesabımı kapat" testID="close-submit" submit={values => authApi.close({ password: values.password })}
    links={[{ href: '/profil', label: 'Vazgeç' }]} />;
}
