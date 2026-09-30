import { Pressable, ScrollView } from 'react-native';
import { router, type Href } from 'expo-router';
import { Fragment } from 'react';
import { Text } from '@/components/ui/text';
export function CatalogBreadcrumb({items}: {items:{label:string;href?:Href}[]}) {
  return <ScrollView showsVerticalScrollIndicator={false} horizontal showsHorizontalScrollIndicator={false} className="flex-grow-0" contentContainerClassName="min-h-touch-ios items-center gap-2" accessibilityLabel="İçerik yolu">{items.map((item,index)=><Fragment key={`${index}:${item.label}`}>{index>0&&<Text variant="muted">›</Text>}{item.href?<Pressable accessibilityRole="link" accessibilityLabel={item.label} onPress={()=>router.push(item.href!)} className="min-h-touch-ios justify-center"><Text variant="muted" className="text-primary underline">{item.label}</Text></Pressable>:<Text variant="muted" numberOfLines={1}>{item.label}</Text>}</Fragment>)}</ScrollView>;
}
