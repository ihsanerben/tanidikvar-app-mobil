import { useWatch, type Control } from 'react-hook-form';
import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import type { UniversityThemeValues } from './catalog-screen';
const safe=(value:string|undefined,fallback:string)=>/^#[0-9a-fA-F]{6}$/.test(value ?? '')?value!:fallback;
export function ThemePreview({control,name}: {control:Control<UniversityThemeValues>;name?:string}) {
  const [primary,soft,foreground,city,type,description]=useWatch({control,name:['accentPrimary','accentSoft','accentForeground','city','institutionType','description']});
  return <View className="gap-3 rounded-card border border-manager-border p-4" style={{backgroundColor:safe(soft,'#F3ECFA')}}><Text variant="muted">Canlı önizleme · {city} · {type}</Text><Text variant="heading" style={{color:safe(primary,'#6A499E')}}>{name ?? 'Üniversite'}</Text><Text>{description || 'Üniversite açıklaması'}</Text><View className="self-start rounded-control px-3 py-2" style={{backgroundColor:safe(primary,'#6A499E')}}><Text className="text-caption font-semibold" style={{color:safe(foreground,'#FFFFFF')}}>Soru sor</Text></View></View>;
}
