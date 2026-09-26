import { useState } from "react";
import { View } from "react-native";
import { useInfiniteQuery } from "@tanstack/react-query";
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
import { ErrorState } from "@/components/ui/states";
import { idParams } from "@/lib/navigation/params";
import type { Schema } from "@/lib/api/types";
import { commentList, questionsApi } from "./api";
import { commentSchema, reportSchema } from "./schemas";
export function CommentsScreen() {
  const p = idParams.safeParse(useLocalSearchParams());
  return (
    <Screen>
      {p.success ? <Comments id={p.data.id} /> : <ErrorState error={null} />}
    </Screen>
  );
}
function Comments({ id }: { id: string }) {
  const query = useInfiniteQuery(commentList(id));
  const me = useCurrentUser();
  const loginAction = useLoginAction();
  const [reportId, setReportId] = useState<string | null>(null);
  const [edit, setEdit] = useState<Schema["AnswerCommentResponse"] | null>(
    null,
  );
  const [compose, setCompose] = useState(false);
  function render({ item }: { item: Schema["AnswerCommentResponse"] }) {
    return (
      <Card>
        <View className="flex-row items-center gap-2"><Avatar name={item.authorName} size="small" /><Text variant="label">{item.authorName}</Text></View>
        <Text>{item.body}</Text>
        <Text variant="muted">{item.createdAt ? new Date(item.createdAt).toLocaleString('tr-TR') : ''}</Text>
        <ActionsMenu title="Alt yorum işlemleri"><Button label="Yorumu bildir" variant="secondary" onPress={() => loginAction(() => setReportId(item.id!))} />
        {item.authorId === me.data?.id && (
          <Button
            label="Yorumunu düzenle"
            variant="secondary"
            onPress={() => setEdit(item)}
          />
        )}</ActionsMenu>
      </Card>
    );
  }
  const header = (
    <View className="gap-4 pb-5">
      <PageHeader title="Alt yorumlar" />
      <Button label="Yorum yaz" onPress={() => loginAction(() => setCompose(true))} />
      <BottomSheet visible={!!reportId} title="Yorumu bildir" close={() => setReportId(null)}>
        <FeatureForm schema={reportSchema} defaults={{ reason: '' }} fields={[{ name: 'reason', label: 'Bildirim gerekçesi', multiline: true }]} label="Bildir" submit={values => questionsApi.reportComment(reportId!, values.reason)} onSuccess={() => setReportId(null)} />
      </BottomSheet>
      <BottomSheet
        visible={compose || !!edit}
        title={edit ? "Yorumu düzenle" : "Yorum yaz"}
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
              : questionsApi.comment(id, values.body)
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
  return <PagedList query={query} renderItem={render} header={header} />;
}
