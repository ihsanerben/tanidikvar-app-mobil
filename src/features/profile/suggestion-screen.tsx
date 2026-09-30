import {useQuery} from '@tanstack/react-query';
import {Linking,View} from 'react-native';
import {Page} from '@/components/ui/page';
import {Text} from '@/components/ui/text';
import {ActionButton} from '@/components/ui/action-button';
import {ErrorState,Skeleton} from '@/components/ui/states';
import {ContactForm} from '@/features/catalog/contact-form';
import {useCurrentUser} from '@/features/auth/use-current-user';
import {myProfile} from './api';
export function SuggestionScreen(){
 const user=useCurrentUser(),profile=useQuery(myProfile());
 const name=[profile.data?.firstName,profile.data?.lastName].filter(Boolean).join(' ')||user.data?.email||'';
 return <Page title="Geliştirme öner" backHref="/profil" backLabel="Hesabıma dön" help="Sistemde geliştirilmesini istediğin bir özelliği veya yaşadığın bir sorunu yaz. Nasıl bir değişiklik beklediğini açıklaman bize yardımcı olur.">
  {user.isPending||profile.isPending?<Skeleton variant="form"/>:!user.data||!profile.data?<ErrorState error={user.error||profile.error} retry={()=>{void user.refetch();void profile.refetch();}}/>:<ContactForm suggestion identity={{name,email:user.data.email!}}/>}
  <View className="gap-2 rounded-card border border-border bg-surface p-3"><Text variant="heading">Doğrudan yaz</Text><Text variant="muted">Önerini e-posta ile de paylaşabilirsin.</Text><ActionButton label="tanidikvar@gmail.com" action={()=>Linking.openURL('mailto:tanidikvar@gmail.com')}/></View>
 </Page>;
}
