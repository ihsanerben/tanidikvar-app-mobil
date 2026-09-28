import {useState} from 'react';
import {Pressable,View} from 'react-native';
import {useQuery} from '@tanstack/react-query';
import {Text} from '@/components/ui/text';
import {BottomSheet} from '@/components/ui/bottom-sheet';
import type {Schema} from '@/lib/api/types';
import {achievementsQuery,achievementCatalogQuery} from './api';
export function AchievementMedallion({achievement,definition}:{achievement?:Schema['AchievementResponse'];definition?:Schema['AchievementDefinitionResponse']}){
 const[open,setOpen]=useState(false);
 const title=achievement?.title??definition?.title??'Rozet';
 return <><Pressable accessibilityRole="button" accessibilityLabel={`${title}: ${achievement?'kazanıldı':'kilitli'}. Ayrıntıyı aç`} onPress={()=>setOpen(true)} className={`h-20 w-20 items-center justify-center rounded-full border-2 ${achievement?'border-gold bg-primary-soft':'border-border bg-subtle'}`}><Text className={`text-3xl ${achievement?'text-primary':'text-muted'}`}>{definition?.icon??'★'}</Text></Pressable><BottomSheet visible={open} close={()=>setOpen(false)} title={title}><Text className="text-center text-5xl text-primary">{definition?.icon??'★'}</Text><Text>{definition?.description??'Topluluğa yaptığın katkılar için kazanılan başarı rozeti.'}</Text><Text variant="muted">{achievement?`${achievement.awardedAt?new Date(achievement.awardedAt).toLocaleDateString('tr-TR'):''} tarihinde kazanıldı.`:'Bu görevi tamamladığında rozetin kilidi otomatik açılır.'}</Text></BottomSheet></>;
}
export function FeaturedAchievements({id}:{id:string}){
 const earned=useQuery(achievementsQuery(id)),catalog=useQuery(achievementCatalogQuery());
 const items=earned.data?.filter(item=>item.featured)??[];
 if(!items.length)return null;
 return <View className="gap-3"><Text variant="label">Öne çıkan rozetler</Text><View className="flex-row flex-wrap gap-4">{items.map(item=><View key={item.id} className="w-24 items-center gap-2"><AchievementMedallion achievement={item} definition={catalog.data?.find(d=>d.key===item.key)}/><Text className="text-center text-caption">{item.title}</Text></View>)}</View></View>;
}
