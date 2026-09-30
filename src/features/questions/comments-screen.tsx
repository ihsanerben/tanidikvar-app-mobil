import { shareLink } from '@/lib/share';
import { z } from "zod";
import { api } from "@/lib/api/client";
import { useState } from "react";
import { View } from "react-native";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { useCurrentUser } from '@/features/auth/use-current-user';
import { useLoginAction } from '@/features/auth/use-login-action';
import { Screen } from "@/components/ui/screen";
import { PageHeader } from "@/components/ui/page";
import { PagedList } from "@/components/ui/paged-list";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { ActionsMenu } from "@/components/ui/actions-menu";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { FeatureForm } from "@/components/ui/feature-form";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { ErrorState, Skeleton } from "@/components/ui/states";
import { idParams, sharePath } from "@/lib/navigation/params";
import type { Schema } from "@/lib/api/types";
import { orderDiscussion } from "./discussion-order";
import { commentList, questionsApi } from "./api";
import { commentSchema, reportSchema } from "./schemas";
export function CommentsScreen() {
  const p = idParams.extend({commentId:z.uuid().optional()}).safeParse(useLocalSearchParams());
  return (
    <Screen>
      {p.success ? <Comments key={`${p.data.id}:${p.data.commentId ?? ""}`} id={p.data.id} commentId={p.data.commentId} /> : <ErrorState error={null} />}
    </Screen>
  );
}
function Comments({ id, commentId }: { id: string; commentId?:string }) {
  const focused=useQuery({queryKey:["comments","detail",id,commentId],enabled:!!commentId,queryFn:({signal})=>api.call("get","/api/answers/{answer}/comments/{comment}",{params:{answer:id,comment:commentId!},signal})});
  const query = useInfiniteQuery(commentList(id));
  const me = useCurrentUser();
  const loginAction = useLoginAction();
  const [reportId, setReportId] = useState<string | null>(null);
  const [edit, setEdit] = useState<Schema["AnswerCommentResponse"] | null>(
    null,
  );
  const [reply,setReply]=useState<Schema["AnswerCommentResponse"]>();
  const [created,setCreated]=useState<Schema["AnswerCommentResponse"][]>([]);
  const [compose, setCompose] = useState(false);
  function render({ item }: { item: Schema["AnswerCommentResponse"] }) {
    return (
      <Card className={item.replyToId ? "ml-3 border-l-2 border-primary" : ""}>
        <View className="flex-row items-center gap-2"><Avatar name={item.authorName} size="small" /><Text variant="label">{item.authorName}</Text></View>
        <Text>{item.body}</Text>
        <Button label="Yanıtla" variant="secondary" onPress={()=>loginAction(()=>{setReply(item);setCompose(true);})}/>
        <Text variant="muted">{item.createdAt ? new Date(item.createdAt).toLocaleString('tr-TR') : ''}</Text>
        {item.editedAt && <Text variant="muted" className="text-metadata">Düzenlendi · {new Date(item.editedAt).toLocaleString("tr-TR", {timeZone:"Europe/Istanbul",day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"})}</Text>}<ActionsMenu title="Alt yorum işlemleri" popover>{close => <><Button label="Paylaş" icon="share" variant="menu" onPress={() => { return shareLink(`${sharePath('sorular',id)}#comment-${item.id}`, close); }} />{item.authorId === me.data?.id ? <Button label="Düzenle" icon="edit" variant="menu" onPress={() => { close(); setEdit(item); }} /> : <Button label="Şikâyet et" icon="flag" variant="menu" onPress={() => { close(); loginAction(() => setReportId(item.id!)); }} />}</>}</ActionsMenu>
      </Card>
    );
  }
  const header = (
    <View className="gap-4 pb-5">
      <PageHeader title="Alt yorumlar" />
      {commentId && <View className="gap-2 rounded-card border-2 border-primary p-2"><Text variant="label">Bildirimdeki yanıt</Text>{focused.isPending ? <Skeleton /> : focused.data ? render({item:focused.data}) : <ErrorState error={focused.error} retry={()=>void focused.refetch()} />}</View>}
      <Button label="Yorum yaz" onPress={() => loginAction(() => {setReply(undefined);setCompose(true);})} />
      <BottomSheet visible={!!reportId} title="Yorumu bildir" close={() => setReportId(null)}>
        <FeatureForm schema={reportSchema} defaults={{ reason: '' }} fields={[{ name: 'reason', label: 'Bildirim gerekçesi', multiline: true }]} label="Bildir" submit={values => questionsApi.reportComment(reportId!, values.reason)} onSuccess={() => setReportId(null)} />
      </BottomSheet>
      <BottomSheet
        visible={compose || !!edit}
        title={edit ? "Yorumu düzenle" : reply ? `${reply.authorName} kişisine yanıt` : "Yorum yaz"}
        close={() => {
          setCompose(false);
          setEdit(null);
        }}
      >
        <FeatureForm
          key={edit ? `${edit.id}:${edit.version}` : "new"}
          schema={commentSchema}
          defaults={{ body: edit?.body ?? "" }}
          fields={[{ name: "body", label: "Yorumun", multiline: true }]}
          label="Yorumu kaydet"
          reload={() => {
            void query.refetch().then((result) => {
              const latest = result.data?.pages
                .flatMap((page) => page.items ?? [])
                .find((item) => item.id === edit?.id);
              if (latest) setEdit(latest);
            });
          }}
          submit={(values) =>
            edit
              ? questionsApi.editComment(
                  id,
                  edit.id!,
                  values.body,
                  edit.version!,
                )
              : questionsApi.comment(id, values.body, reply?.id).then(result => {
                  setCreated(items => [...items, result]);
                  return result;
                })
          }
          onSuccess={() => {
            setCompose(false);
            setEdit(null);
            void query.refetch();
          }}
        />
      </BottomSheet>
    </View>
  );
  return <PagedList query={query} renderItem={render} header={header} mapItems={items=>orderDiscussion(items,created)} />;
}
