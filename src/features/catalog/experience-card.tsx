import { shareLink } from '@/lib/share';
import {useEffect,useRef,useState} from 'react';
import {Pressable,ScrollView,View} from 'react-native';
import {z} from 'zod';
import {ActionsMenu} from '@/components/ui/actions-menu';
import {Button} from '@/components/ui/button';
import {BottomSheet} from '@/components/ui/bottom-sheet';
import {FeatureForm} from '@/components/ui/feature-form';
import {useLoginAction} from '@/features/auth/use-login-action';
import {reportSchema} from '@/features/questions/schemas';
import {api} from '@/lib/api/client';
import {sharePath} from '@/lib/navigation/params';
import type {Schema} from '@/lib/api/types';
import {Card} from '@/components/ui/card';
import {Text} from '@/components/ui/text';
import {ContributionByline} from './contribution-byline';
const editSchema=z.object({body:z.string().trim().min(20).max(5000)});
export const experienceTemplates=[{value:'WHY_I_CHOSE',label:'Ben neden burayı seçtim?'},{value:'WISH_I_KNEW',label:'Keşke tercih etmeden önce bilseydim'},{value:'EXPECTATION_REALITY',label:'Beklediğim / gerçekte olan'},{value:'CHOOSE_AGAIN',label:'Tekrar tercih eder miydim?'}];
const experienceTheme:Record<string,{surface:string;border:string,text:string}>= {
 WHY_I_CHOSE:{surface:'bg-student-soft',border:'border-student/40',text:'text-profile-student'},
 WISH_I_KNEW:{surface:'bg-scope-university',border:'border-scope-university-text/40',text:'text-scope-university-text'},
 EXPECTATION_REALITY:{surface:'bg-scope-program',border:'border-scope-program-text/40',text:'text-scope-program-text'},
 CHOOSE_AGAIN:{surface:'bg-candidate-soft',border:'border-candidate/40',text:'text-candidate'},
};
export function ExperienceTabs({value,onChange}:{value:string;onChange:(value:string)=>void}) {
 const scroll=useRef<ScrollView>(null),width=useRef(0),positions=useRef(new Map<string,{x:number;width:number}>());
 useEffect(()=>{const item=positions.current.get(value);if(item)scroll.current?.scrollTo({x:Math.max(0,item.x-(width.current-item.width)/2),animated:false});},[value]);
 return <ScrollView showsVerticalScrollIndicator={false} ref={scroll} onLayout={event=>{width.current=event.nativeEvent.layout.width;const item=positions.current.get(value);if(item)scroll.current?.scrollTo({x:Math.max(0,item.x-(width.current-item.width)/2),animated:false});}} horizontal showsHorizontalScrollIndicator={false} accessibilityRole="tablist" accessibilityLabel="Deneyim soruları" className="flex-grow-0 rounded-control border border-tab-border bg-tab-track" contentContainerClassName="min-w-full flex-row items-center gap-1 p-1">{experienceTemplates.map(option=>{const tone=experienceTheme[option.value];return <Pressable key={option.value} onLayout={event=>{positions.current.set(option.value,event.nativeEvent.layout);}} accessibilityRole="tab" accessibilityLabel={option.label} aria-selected={value===option.value} accessibilityState={{selected:value===option.value}} onPress={()=>onChange(option.value)} className={`min-h-touch-ios flex-grow justify-center rounded-control border px-3 py-2 ${tone.border} ${tone.surface} ${value===option.value?'border-2':''}`}><Text variant="unstyled" className={`text-center text-caption font-semibold ${tone.text}`}>{option.label}</Text></Pressable>;})}</ScrollView>;
}
export function ExperienceCard({item,userId,canEdit=false,after=()=>undefined}:{item:Schema['ExperienceResponse'];userId?:string;canEdit?:boolean;after?:()=>void}) {
 const [mode,setMode]=useState<'edit'|'report'>();
 const [latest,setLatest]=useState(item);
 const login=useLoginAction();
 const tone=experienceTheme[item.templateType??'']??experienceTheme.WHY_I_CHOSE;
 const title=experienceTemplates.find(option=>option.value===item.templateType)?.label;
 return <Card className={`border-2 ${tone.border}`}><View className="flex-row items-start gap-2"><View className="min-w-0 flex-1"><ContributionByline authorId={item.authorId} authorName={item.authorName} createdAt={item.createdAt} activeAdmin={item.activeAdmin} educationStatus={item.educationStatus}/></View><ActionsMenu title="Deneyim işlemleri" popover>{close=><><Button label="Paylaş" icon="share" variant="menu" onPress={()=>{ return shareLink(`${sharePath(item.programId?'programlar':'universiteler',item.programId??item.universityId!)}?sekme=deneyimler&icerik=${item.id}`, close); }}/>{item.authorId===userId?canEdit&&<Button label="Düzenle" icon="edit" variant="menu" onPress={()=>{close();setLatest(item);setMode('edit');}}/>:<Button label="Şikâyet et" icon="flag" variant="menu" onPress={()=>{close();login(()=>setMode('report'));}}/>}</>}</ActionsMenu></View>{title&&<View className={`self-start rounded-full px-2 py-1 ${tone.surface}`}><Text variant="muted" className={`font-semibold ${tone.text}`}>{title}</Text></View>}<Text className="leading-6">{item.body}</Text><BottomSheet visible={mode==='edit'} title="Deneyimini düzenle" close={()=>setMode(undefined)}><FeatureForm key={`${latest.id}:${latest.version}`} schema={editSchema} defaults={{body:latest.body??''}} fields={[{name:'body',label:'Yorumun',multiline:true}]} reload={()=>void api.call('get','/api/experiences/{id}',{params:{id:item.id!}}).then(setLatest)} submit={body=>api.call('put','/api/experiences/{id}',{params:{id:item.id!},body:{...body,title:latest.title!,version:latest.version!},authenticated:true})} onSuccess={()=>{setMode(undefined);after();}}/></BottomSheet><BottomSheet visible={mode==='report'} title="Deneyimi şikâyet et" close={()=>setMode(undefined)}><FeatureForm schema={reportSchema} defaults={{reason:''}} fields={[{name:'reason',label:'Şikâyet nedeni',multiline:true}]} label="Şikâyeti gönder" submit={body=>api.call('post','/api/experiences/{id}/reports',{params:{id:item.id!},body,authenticated:true})} onSuccess={()=>setMode(undefined)}/></BottomSheet></Card>;
}
