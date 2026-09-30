import {useState} from 'react';
import {Pressable,View} from 'react-native';
import {useQuery} from '@tanstack/react-query';
import {Text} from '@/components/ui/text';
import {BottomSheet} from '@/components/ui/bottom-sheet';
import type {Schema} from '@/lib/api/types';
import {achievementsQuery,achievementCatalogQuery} from './api';
export function AchievementMedallion({achievement,definition,compact=false,profile=false}:{achievement?:Schema['AchievementResponse'];definition?:Schema['AchievementDefinitionResponse'];compact?:boolean;profile?:boolean}){
 const[open,setOpen]=useState(false);
 const title=achievement?.title??definition?.title??'Rozet';
 return <><Pressable accessibilityRole="button" accessibilityLabel={`${title}: ${achievement?'kazanıldı':'kilitli'}. Ayrıntıyı aç`} onPress={()=>setOpen(true)} className={`${profile?'h-10 w-10':compact?'h-14 w-14':'h-20 w-20'} items-center justify-center rounded-full border-2 ${achievement?'border-gold bg-surface':'border-border bg-subtle'}`}><Text className={`${profile?'text-xl':compact?'text-2xl':'text-3xl'} ${achievement?'text-primary':'text-muted'}`}>{definition?.icon??'★'}</Text></Pressable><BottomSheet visible={open} close={()=>setOpen(false)} title={title}><Text className="text-center text-5xl text-primary">{definition?.icon??'★'}</Text><Text>{definition?.description??'Topluluğa yaptığın katkılar için kazanılan başarı rozeti.'}</Text><Text variant="muted">{achievement?`${achievement.awardedAt?new Date(achievement.awardedAt).toLocaleDateString('tr-TR'):''} tarihinde kazanıldı.`:'Bu görevi tamamladığında rozetin kilidi otomatik açılır.'}</Text></BottomSheet></>;
}
export function FeaturedAchievements({id}:{id:string}){
 const earned=useQuery(achievementsQuery(id)),catalog=useQuery(achievementCatalogQuery());
 const items=earned.data?.filter(item=>item.featured).slice(0,3)??[];
 if(!items.length)return null;
 return <View accessibilityLabel="Seçilen rozetler" className="absolute -bottom-[22px] left-0 right-0 z-10 flex-row items-center justify-center gap-[9px]">{items.map(item=><View key={item.id} className="h-11 w-11 items-center justify-center rounded-full bg-[#FBF7ED]"><AchievementMedallion profile achievement={item} definition={catalog.data?.find(d=>d.key===item.key)}/></View>)}</View>;
}
