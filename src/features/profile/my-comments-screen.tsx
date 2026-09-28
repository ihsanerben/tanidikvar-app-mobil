import { useState } from "react";
import { useInfiniteQuery, useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { Pressable, View } from "react-native";
import { z } from "zod";
import { Card } from "@/components/ui/card";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { StatAction } from "@/components/ui/stat-action";
import { Tabs } from "@/components/ui/tabs";
import { Select } from "@/components/ui/select";
import { FeatureForm } from "@/components/ui/feature-form";
import { PageHeader } from "@/components/ui/page";
import { PagedList } from "@/components/ui/paged-list";
import { Screen } from "@/components/ui/screen";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { Avatar } from "@/components/ui/avatar";
import { ActionsMenu } from "@/components/ui/actions-menu";
import type { Schema } from "@/lib/api/types";
import { Text } from "@/components/ui/text";
import { api } from "@/lib/api/client";
import { questionDetail } from "@/features/questions/api";
import { QuestionContext } from "@/features/questions/question-context";
import { ApiError } from "../../../packages/api-client/errors";
import { nextPage } from "@/lib/query/pagination";

const params = z.object({
  kind: z.enum(["tanidik", "community", "anonymous"]).default("tanidik"),
  anonymous: z.enum(["true", "false"]).default("false"),
  scope: z.enum(["GENERAL", "UNIVERSITY", "UNIVERSITY_DEPARTMENT"]).optional(),
});
type Comment = Schema["AnswerResponse"] & Partial<Schema["AdminAnswerResponse"]> & { questionTitle?: string };
const editSchema = z.object({ body: z.string().trim().min(1).max(5000) });

export function MyCommentsScreen() {
  const parsed = params.safeParse(useLocalSearchParams());
  if (!parsed.success) return <Screen><ErrorState error={null} retry={() => router.replace("/my-comments")} /></Screen>;
  return <MyComments filters={{...parsed.data, kind:parsed.data.kind === "anonymous" ? "tanidik" : parsed.data.kind, anonymous:parsed.data.kind === "anonymous" ? "true" : parsed.data.anonymous}} />;
}

function MyComments({ filters }: { filters: z.infer<typeof params> }) {
  const tanidik = useInfiniteQuery({
    queryKey: ["my-comments", "tanidik-source", filters.kind, filters.scope, filters.anonymous], initialPageParam: 0, staleTime: 30_000,
    queryFn: async ({ pageParam, signal }) => {
      const page = await api.call("get", "/api/me/admin-answers", { query: { scope: filters.scope, anonymous: filters.anonymous === "true", page: pageParam, size: 20 }, authenticated: true, signal });
      return { ...page, items: (page.items ?? []) };
    }, getNextPageParam: nextPage, enabled: filters.kind !== "community",
  });
  const community = useInfiniteQuery({
    queryKey: ["my-comments", "community", filters.scope, filters.anonymous], initialPageParam: 0, staleTime: 30_000,
    queryFn: async ({ pageParam, signal }) => {
      const page = await api.call("get", "/api/me/answers", { query: { scope: filters.scope, anonymous: filters.anonymous === "true", page: pageParam, size: 20 }, authenticated: true, signal });
      return { ...page, items: (page.items ?? []).map(row => ({ ...row.answer, questionTitle: row.questionTitle })) };
    }, getNextPageParam: nextPage, enabled: filters.kind === "community",
  });
  const selected = filters.kind === "community" ? community : tanidik;
  return <Screen><PagedList query={selected} renderItem={({ item }) => <CommentCard key={`${filters.kind}:${item.id}`} item={item} kind={filters.kind} />}
    empty={<EmptyState title="Bu kapsamda henüz yorumun yok" description="Farklı bir yorum türü veya kapsam seçebilirsin." />}
    header={<View className="gap-4 pb-5">
    <PageHeader title="Yorumlarım" backHref="/profil" backLabel="Hesabıma dön" />
    <View className="flex-row items-center gap-2"><View className="min-w-0 flex-1"><Tabs compact variant="filled" label="Yorum türü" value={filters.kind} options={[
      { value: "tanidik", label: "Tanıdık yorumları" }, { value: "community", label: "Topluluk yorumları" },
    ]} onChange={kind => router.setParams({ kind, anonymous:filters.anonymous, scope: filters.scope })} /></View>
    <StatAction icon="view" selected={filters.anonymous === "true"} label={filters.anonymous === "true" ? "Normal yorumlarını göster" : "Seçili türdeki anonim yorumlarını göster"}
      onPress={() => router.setParams({kind:filters.kind,anonymous:filters.anonymous === "true" ? "false" : "true"})} />
    </View>
    <Select label="Kapsam" value={filters.scope ?? ""} options={[
      { value: "", label: "Tümü" }, { value: "GENERAL", label: "Genel" }, { value: "UNIVERSITY", label: "Üniversite" }, { value: "UNIVERSITY_DEPARTMENT", label: "Üniversite + Bölüm" },
    ]} onChange={scope => router.setParams({ kind: filters.kind, scope })} />
  </View>} /></Screen>;
}

function CommentCard({ item, kind }: { item: Comment; kind: "tanidik" | "community" | "anonymous" }) {
  const [dialog, setDialog] = useState<"edit" | "status" | null>(null);
  const client = useQueryClient();
  const tanidik = kind !== "community";
  const question = useQuery({...questionDetail(item.questionId || ""),enabled:!!item.questionId,retry:false});
  const edit = useMutation({ mutationFn: (body: { body: string }) => tanidik
    ? api.call("put", "/api/admin-answers/{id}", { params: { id: item.id! }, body: { ...body, version: item.version ?? 0 }, authenticated: true })
    : api.call("put", "/api/answers/{id}", { params: { id: item.id! }, body: { ...body, version: item.version ?? 0 }, authenticated: true }),
    onSuccess: async () => { setDialog(null); await client.invalidateQueries({ queryKey: ["my-comments"] }); } });
  const status = useMutation({ mutationFn: () => tanidik
    ? api.call("put", "/api/admin-answers/{id}/status", { params: { id: item.id! }, body: { deleted: !item.deletedAt, version: item.version ?? 0 }, authenticated: true })
    : api.call("put", "/api/answers/{id}/status", { params: { id: item.id! }, body: { deleted: !item.deletedAt, version: item.version ?? 0 }, authenticated: true }),
    onSuccess: async () => { setDialog(null); await client.invalidateQueries({ queryKey: ["my-comments"] }); } });
  return <Card>
    <View className="flex-row items-center gap-2"><Avatar name={item.anonymous ? "Anonim" : item.authorName} educationStatus={item.educationStatus} tanidik={tanidik} size="small" /><View className="min-w-0 flex-1"><Text variant="label">{item.anonymous ? "Anonim Tanıdık" : item.authorName ?? "Yorumun"}</Text><Text variant="muted">{item.universityName} · {item.departmentName}</Text></View></View>
    <Text variant="heading">{question.data?.title || item.questionTitle || (question.isPending ? "Soru yükleniyor…" : question.error instanceof ApiError && question.error.status === 404 ? "Soru artık görüntülenemiyor" : "Soru başlığı yüklenemedi")}</Text>
    {question.isError && !(question.error instanceof ApiError && question.error.status === 404) && <ErrorState error={question.error} retry={()=>void question.refetch()} />}
    {question.data && <QuestionContext question={question.data} />}
    <Text>{item.deletedAt ? "Bu yorum kaldırıldı." : item.body}</Text>
    <View className="flex-row items-center justify-between gap-2">
      <Text variant="muted">{item.publishedAt ? new Date(item.publishedAt).toLocaleString("tr-TR") : ""}</Text>
      {item.questionId && <Pressable accessibilityRole="link" onPress={() => router.push({ pathname: "/questions/[id]", params: { id: item.questionId! } })} className="min-h-touch-ios android:min-h-touch-android min-w-touch-ios android:min-w-touch-android justify-center"><Text className="text-primary underline">Soru detayı</Text></Pressable>}
    </View>
    <Text variant="muted">{item.likeCount ?? 0} faydalı oy{item.editedAt ? " · Düzenlendi" : ""}</Text>
    {item.id && <ActionsMenu title="Yorum işlemleri">{!item.deletedAt && <Button label="Düzenle" variant="secondary" onPress={() => setDialog("edit")} />}<Button label={item.deletedAt ? "Geri getir" : "Kaldır"} variant="secondary" onPress={() => setDialog("status")} /></ActionsMenu>}
    <BottomSheet visible={!!dialog} title={dialog === "edit" ? "Yorumu düzenle" : item.deletedAt ? "Yorumu geri getir" : "Yorumu kaldır"} close={() => { if (!edit.isPending && !status.isPending) setDialog(null); }}>
      {dialog === "edit" ? <FeatureForm key={item.version} schema={editSchema} defaults={{ body: item.body ?? "" }} fields={[{ name: "body", label: "Yorum", multiline: true }]} label="Kaydet" submit={body => edit.mutateAsync(body)} />
        : <><Text>{item.deletedAt ? "Yorum yeniden görünür olacak." : "Yorum görünür listelerden kaldırılacak."}</Text><Button label={item.deletedAt ? "Geri getir" : "Kaldır"} variant={item.deletedAt ? "primary" : "danger"} pending={status.isPending} onPress={() => status.mutate()} /></>}
      {edit.isError && <ErrorState error={edit.error} />}{status.isError && <ErrorState error={status.error} />}
    </BottomSheet>
  </Card>;
}
