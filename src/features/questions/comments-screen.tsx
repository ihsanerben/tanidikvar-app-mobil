import { useState } from "react";
import { View } from "react-native";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { authApi, authKeys } from "@/features/auth/api";
import { Screen } from "@/components/ui/screen";
import { PageHeader } from "@/components/ui/page";
import { PagedList } from "@/components/ui/paged-list";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { FeatureForm } from "@/components/ui/feature-form";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { ErrorState } from "@/components/ui/states";
import { idParams } from "@/lib/navigation/params";
import type { Schema } from "@/lib/api/types";
import { commentList, questionsApi } from "./api";
import { commentSchema } from "./schemas";
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
  const me = useQuery({
    queryKey: authKeys.me(),
    queryFn: ({ signal }) => authApi.me(signal),
    staleTime: 30_000,
  });
  const [edit, setEdit] = useState<Schema["AnswerCommentResponse"] | null>(
    null,
  );
  const [compose, setCompose] = useState(false);
  function render({ item }: { item: Schema["AnswerCommentResponse"] }) {
    return (
      <Card>
        <Text variant="label">{item.authorName}</Text>
        <Text>{item.body}</Text>
        {item.authorId === me.data?.id && (
          <Button
            label="Yorumunu düzenle"
            variant="secondary"
            onPress={() => setEdit(item)}
          />
        )}
      </Card>
    );
  }
  const header = (
    <View className="gap-4 pb-5">
      <PageHeader title="Alt yorumlar" />
      <Button label="Yorum yaz" onPress={() => setCompose(true)} />
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
