import { shareLink } from '@/lib/share';
import { useRef, useState, type ReactNode } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { useInfiniteQuery, useMutation } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLoginAction } from '@/features/auth/use-login-action';
import { Text } from '@/components/ui/text';
import { FormField } from '@/components/ui/form-field';
import { Button } from '@/components/ui/button';
import { ActionsMenu } from '@/components/ui/actions-menu';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { FeatureForm } from '@/components/ui/feature-form';
import { ErrorState, useOffline } from '@/components/ui/states';
import { sharePath } from '@/lib/navigation/params';
import type { Schema } from '@/lib/api/types';
import { commentList, questionsApi } from './api';
import { commentSchema, reportSchema } from './schemas';
import { orderDiscussion, discussionPreview } from './discussion-order';

export function AnswerDiscussion({ answerId, questionId, questionTitle, userId, unavailable, metadata, likeAction }: { answerId: string; questionId: string; questionTitle: string; userId?: string; unavailable: boolean; metadata: string; likeAction?: ReactNode }) {
  const query = useInfiniteQuery(commentList(answerId));
  const loginAction = useLoginAction();
  const offline = useOffline();
  const input = useRef<TextInput>(null);
  const [reply, setReply] = useState<{id:string;name:string}>();
  const [edit, setEdit] = useState<Schema['AnswerCommentResponse']>();
  const [report, setReport] = useState<string>();
  const form = useForm({ resolver: zodResolver(commentSchema), defaultValues: { body: '' } });
  const [createdComments,setCreatedComments]=useState<Schema["AnswerCommentResponse"][]>([]);
  const mutation = useMutation({
    mutationFn: ({body,replyToId}: {body:string;replyToId?:string}) => questionsApi.comment(answerId, body, replyToId), retry: 0,
    onSuccess: async (created) => { setCreatedComments(items=>[...items,created]); form.reset(); setReply(undefined); await query.refetch(); },
  });
  const loaded = query.data?.pages.flatMap(page => page.items ?? []) ?? [];
  const comments = orderDiscussion(loaded, createdComments);
  const preview = discussionPreview(comments, createdComments);
  const total = Math.max(query.data?.pages[0]?.totalElements ?? 0, comments.length);
  const submit = form.handleSubmit(values => loginAction(() => mutation.mutate({body:values.body.trim(),replyToId:reply?.id})));
  return <View className="gap-2">
    <View className="flex-row items-center gap-1"><Text variant="muted" className="min-w-0 flex-1">{metadata}</Text>{likeAction}{total > 0 && <Text variant="muted" className="text-metadata">{total} yorum</Text>}</View>
    {/* The embedded preview stays bounded; the complete discussion uses its virtualized route. */}
    {preview.map(item => <View key={item.id} className={item.replyToId ? "ml-3 border-l-2 border-primary pl-3" : "border-l-2 border-border pl-3"}>
      <View className="flex-row items-start gap-1"><View className="min-w-0 flex-1"><Text><Text variant="label">{item.authorName} </Text>{item.body}</Text><View className="flex-row flex-wrap items-center gap-x-3"><Text variant="muted">{item.createdAt ? new Date(item.createdAt).toLocaleString('tr-TR',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit',timeZone:'Europe/Istanbul'}) : ''}</Text>{item.editedAt && <Text variant="muted" className="text-metadata">Düzenlendi · {new Date(item.editedAt).toLocaleString("tr-TR", {timeZone:"Europe/Istanbul",day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"})}</Text>}<Pressable accessibilityRole="button" accessibilityLabel={`${item.authorName} kişisine yanıtla`} disabled={unavailable||mutation.isPending} onPress={() => loginAction(() => { setReply({id:item.id!,name:item.authorName ?? "Üye"}); input.current?.focus(); })} className="min-h-touch-ios justify-center"><Text variant="muted" className="text-primary">Yanıtla</Text></Pressable></View></View><ActionsMenu title="Alt yorum işlemleri" popover>{close => <><Button label="Paylaş" icon="share" variant="menu" onPress={() => { return shareLink(`${sharePath('sorular',questionId,questionTitle)}#comment-${item.id}`, close); }} />{item.authorId === userId ? <Button label="Düzenle" icon="edit" variant="menu" onPress={() => { close(); setEdit(item); }} /> : <Button label="Şikâyet et" icon="flag" variant="menu" onPress={() => { close(); loginAction(() => setReport(item.id)); }} />}</>}</ActionsMenu></View>
    </View>)}
    <BottomSheet visible={!!edit} title="Alt yorumu düzenle" close={() => setEdit(undefined)}>{edit && <FeatureForm key={`${edit.id}:${edit.version}`} schema={commentSchema} defaults={{body:edit.body ?? ''}} fields={[{name:'body',label:'Yorum',multiline:true}]} reload={() => void query.refetch().then(result => { const latest=result.data?.pages.flatMap(page=>page.items??[]).find(item=>item.id===edit.id); if(latest)setEdit(latest); })} submit={values => questionsApi.editComment(answerId,edit.id!,values.body,edit.version!)} onSuccess={() => { setEdit(undefined); void query.refetch(); }} onCancel={() => setEdit(undefined)} />}</BottomSheet>
    <BottomSheet visible={!!report} title="Yorumu şikâyet et" close={() => setReport(undefined)}>{report && <FeatureForm schema={reportSchema} defaults={{reason:''}} fields={[{name:'reason',label:'Şikâyet nedeni',multiline:true}]} label="Şikâyeti gönder" submit={values => questionsApi.reportComment(report,values.reason)} onSuccess={() => setReport(undefined)} onCancel={() => setReport(undefined)} />}</BottomSheet>
    {total > preview.length && <Button label={`Tüm yorumları gör (${total})`} variant="secondary" onPress={() => router.push({ pathname:'/answers/[id]/comments',params:{id:answerId} })} />}
    {reply && <View className="flex-row items-center justify-between"><Text variant="muted">{reply.name} kişisine yanıt</Text><Button label="Vazgeç" variant="secondary" onPress={() => { setReply(undefined); form.reset(); }} /></View>}
    {!unavailable && <View className="flex-row items-center gap-2"><View className="min-w-0 flex-1"><Controller control={form.control} name="body" render={({field,fieldState}) => <FormField ref={element => { field.ref(element); input.current = element; }} label="Yorum ekle" hideLabel compact placeholder={reply ? 'Yanıtını yaz…' : 'Yorum ekle…'} value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={fieldState.error?.message} editable={!mutation.isPending} maxLength={2000} onSubmitEditing={submit} />} /></View><Button label="Gönder" pending={mutation.isPending} disabled={offline} onPress={submit} /></View>}
    {mutation.isError && <ErrorState error={mutation.error} retry={() => mutation.reset()} />}
    {query.isError && <ErrorState error={query.error} retry={() => void query.refetch()} />}

  </View>;
}
