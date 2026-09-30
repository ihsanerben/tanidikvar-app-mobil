import {useState,useEffect,useRef} from 'react';
import {View} from 'react-native';
import {useMutation,useQueryClient,type InfiniteData} from '@tanstack/react-query';
import type {Schema} from '@/lib/api/types';
import {api} from '@/lib/api/client';
import {useAuth} from '@/lib/auth/auth-context';
import {useLoginAction} from '@/features/auth/use-login-action';
import {Card} from '@/components/ui/card';
import {Text} from '@/components/ui/text';
import {Button} from '@/components/ui/button';
import {RadioGroup} from '@/components/ui/radio-group';
import {ErrorState,useOffline} from '@/components/ui/states';
import {ContributionByline} from './contribution-byline';
import {decisionKeys} from './decision-queries';
export function Poll({poll,saved,participationReady=true,canVote=false}:{poll:Schema['PollResponse'];saved?:string;participationReady?:boolean;canVote?:boolean}) {
 const client=useQueryClient(),{status}=useAuth(),login=useLoginAction(),offline=useOffline();
 const submitting=useRef(false);
 const [now,setNow]=useState(()=>Date.now());
 useEffect(()=>{if(!poll.closesAt)return;const timer=setInterval(()=>setNow(Date.now()),30_000);return()=>clearInterval(timer);},[poll.closesAt]);
 const closed=!!poll.closesAt&&new Date(poll.closesAt).getTime()<=now;
 const mutation=useMutation({
  mutationFn:(optionId:string)=>api.call('put','/api/polls/{id}/vote',{params:{id:poll.id!},body:{optionId},authenticated:true}),retry:0,
  onSuccess:(updated,optionId)=>{
   client.setQueriesData<InfiniteData<Schema['PageResponsePollResponse']>>({queryKey:decisionKeys.all,predicate:query=>query.queryKey.includes('polls')},current=>current?{...current,pages:current.pages.map(page=>({...page,items:page.items?.map(item=>item.id===updated.id?updated:item)}))}:current);
   client.setQueryData([...decisionKeys.all,'poll',poll.id],updated);
   client.setQueriesData<Schema['PollParticipationResponse'][]>({queryKey:[...decisionKeys.all,'poll-votes'],predicate:query=>query.queryKey.includes(poll.id!)},current=>current?[...current.filter(item=>item.pollId!==poll.id),{pollId:poll.id,optionId}]:current);
   void client.invalidateQueries({queryKey:decisionKeys.context(poll.universityId!,poll.programId)});
  },
 });
 const result=mutation.data??poll;
 const selected=mutation.isPending||mutation.isSuccess?mutation.variables??saved:saved;
 const disabled=status!=='authenticated'||!canVote||closed||!participationReady||offline||mutation.isPending;
 function vote(optionId:string){
  if(disabled||submitting.current||optionId===saved||!poll.id||(poll.closesAt&&new Date(poll.closesAt).getTime()<=Date.now()))return;
  submitting.current=true;
  void mutation.mutateAsync(optionId).catch(()=>undefined).finally(()=>{submitting.current=false;});
 }
 const options=(result.options??[]).filter(item=>!!item.id).map(item=>({value:item.id!,label:`${item.label||'Seçenek'}${item.id===saved?' · ✓ Senin oyun':''}`,detail:`%${result.totalVotes?Math.round((item.voteCount??0)/result.totalVotes*100):0}`,progress:(item.voteCount??0)/Math.max(result.totalVotes??0,1)*100,caption:`${item.voteCount??0} oy`}));
 return <Card compact className="h-full p-2"><View className="flex-row flex-wrap gap-1"><Text variant="muted">{result.totalVotes??0} oy</Text><Text variant="muted">{closed?'Anket sona erdi':'Üniversitenin öğrencilerine ve Tanıdıklarına açık'}</Text>{saved&&<Text variant="label" className="text-primary">✓ Oy verdin</Text>}</View><ContributionByline compact authorId={result.authorId} authorName={result.authorName} createdAt={result.createdAt} activeAdmin={result.activeAdmin} educationStatus={result.educationStatus}/><Text variant="unstyled" accessibilityRole="header" className="font-bold text-primary text-caption leading-4">{result.question}</Text>
  <RadioGroup compact label="Anket seçenekleri" value={selected??''} options={options} disabled={disabled} onChange={vote}/>
  {mutation.isPending&&<Text accessibilityRole="alert" variant="muted">Kaydediliyor…</Text>}
  {mutation.isSuccess&&<Text accessibilityRole="alert" className="text-success">Oyun kaydedildi.</Text>}
  {mutation.isError&&<ErrorState error={mutation.error} retry={()=>{if(mutation.variables)vote(mutation.variables);}}/>}
  {!closed&&status==='authenticated'&&!canVote&&<Text variant="muted">Bu ankete bu üniversitenin öğrencileri ve Tanıdıkları katılabilir.</Text>}
  {!closed&&status==='authenticated'&&!participationReady&&<Text variant="muted">Önceki oyun yükleniyor.</Text>}
  {!closed&&offline&&<Text variant="muted">Oy vermek için internete bağlan.</Text>}
  {!closed&&status!=='authenticated'&&<Button label="Oy vermek için giriş yap" variant="secondary" onPress={()=>login(()=>undefined)}/>}
 </Card>;
}
