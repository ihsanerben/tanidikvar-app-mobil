import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { z } from "zod";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { ActionsMenu } from "@/components/ui/actions-menu";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FeatureForm } from "@/components/ui/feature-form";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/states";
import { Text } from "@/components/ui/text";
import { api } from "@/lib/api/client";
import type { Schema } from "@/lib/api/types";
import { ManagerPage } from "./manager-shell";

const route = z.object({ id: z.uuid() });
const reasonSchema = z.object({ reason: z.string().trim().min(5).max(1000) });
type Content = Schema["ManagedContentResponse"];
function ReviewCard({ item, questionId }: { item: Content; questionId: string }) {
  const client = useQueryClient();
  const [open, setOpen] = useState(false);
  const mutation = useMutation({ mutationFn: (body: { reason: string }) => api.call("put", "/api/manager/content/{kind}/{id}/status", {
    params: { id: item.id!, kind: item.kind! }, body: { hidden: !item.moderatedAt, version: item.version, reason: body.reason }, authenticated: true,
  }), onSuccess: async () => { setOpen(false); await Promise.all([client.invalidateQueries({ queryKey: ["manager", "question", questionId] }), client.invalidateQueries({ queryKey: ["manager", "content"] })]); } });
  return <Card className="gap-2 border-manager-border"><Text variant="heading">{item.title || (item.kind === "QUESTION" ? "Soru" : "Yorum")}</Text>
    <Text>{item.body}</Text><Text variant="muted">{item.authorName || "Üye"} · {item.deletedAt ? "Silinmiş" : item.moderatedAt ? "Gizli" : "Görünür"}</Text>
    {item.id && item.kind && <ActionsMenu title="İçerik işlemleri"><Button label={item.moderatedAt ? "Görünür yap" : "Gizle"} variant="secondary" onPress={() => setOpen(true)} /></ActionsMenu>}
    <BottomSheet visible={open} title={item.moderatedAt ? "İçeriği görünür yap" : "İçeriği gizle"} close={() => { if (!mutation.isPending) setOpen(false); }}>
      <FeatureForm schema={reasonSchema} defaults={{ reason: "" }} fields={[{ name: "reason", label: "Gerekçe", multiline: true }]} label="Kararı kaydet" submit={body => mutation.mutateAsync(body)} />
      {mutation.isError && <ErrorState error={mutation.error} />}
    </BottomSheet>
  </Card>;
}
export function ManagerQuestionScreen() {
  const parsed = route.safeParse(useLocalSearchParams());
  return parsed.success ? <Detail id={parsed.data.id} /> : <ManagerPage title="Soru inceleme"><ErrorState error={null} /></ManagerPage>;
}
function Detail({ id }: { id: string }) {
  const [page, setPage] = useState(0);
  const query = useQuery({ queryKey: ["manager", "question", id, page], queryFn: ({ signal }) => api.call("get", "/api/manager/questions/{id}", { params: { id }, query: { page, size: 20 }, authenticated: true, signal }) });
  const answerQuery = query.data?.answers;
  return <ManagerPage title="Soru inceleme"><Button label="← İçeriğe dön" variant="secondary" onPress={() => router.push("/manager/content")} />
    {query.isPending ? <Skeleton /> : query.isError ? <ErrorState error={query.error} retry={() => void query.refetch()} /> : query.data?.question ? <>
      <ReviewCard item={query.data.question} questionId={id} />
      <Text variant="heading">Yorumlar ({answerQuery?.totalElements ?? 0})</Text>
      {(answerQuery?.items ?? []).map(item => <ReviewCard key={item.id} item={item} questionId={id} />)}
      {!answerQuery?.items?.length && <EmptyState title="Yorum yok" />}
      {(answerQuery?.totalElements ?? 0) > (answerQuery?.size ?? 20) && <><Text variant="muted">Sayfa {page + 1} · {answerQuery?.totalElements} yorum</Text>
        {page > 0 && <Button label="Önceki yorumlar" variant="secondary" onPress={() => setPage(page - 1)} />}
        {(page + 1) * (answerQuery?.size ?? 20) < (answerQuery?.totalElements ?? 0) && <Button label="Sonraki yorumlar" variant="secondary" onPress={() => setPage(page + 1)} />}</>}
    </> : <EmptyState title="Soru bulunamadı" />}
  </ManagerPage>;
}
