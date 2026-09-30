import {View,Pressable} from 'react-native';
import {router} from 'expo-router';
import {Avatar} from '@/components/ui/avatar';
import {Text} from '@/components/ui/text';
export function ContributionByline({authorId,authorName,createdAt,activeAdmin,educationStatus,compact=false}:{compact?:boolean;authorId?:string;authorName?:string;createdAt?:string;activeAdmin?:boolean;educationStatus?:string}) {
 const name=authorName?.trim()||'Topluluk üyesi',date=createdAt?new Date(createdAt):null;
 return <View className={compact?"flex-row items-center gap-1.5":"flex-row items-center gap-4"}><Avatar name={name} size="small" tanidik={activeAdmin} educationStatus={educationStatus}/><View className="min-w-0 flex-1 gap-0.5">{authorId?<Pressable accessibilityRole="link" accessibilityLabel={`${name}, profili aç`} className="min-h-touch-ios justify-center" onPress={()=>router.push({pathname:'/profiles/[id]',params:{id:authorId}})}><Text variant="label" className={compact?"text-metadata leading-4":undefined}>{name}</Text></Pressable>:<Text variant="label" className={compact?"text-metadata leading-4":undefined}>{name}</Text>}{date&&!Number.isNaN(date.getTime())&&<Text variant="muted" className={compact?"text-[10px] leading-3":"text-caption"}>{date.toLocaleDateString('tr-TR',{day:'numeric',month:'long',year:'numeric'})}</Text>}</View></View>;
}
