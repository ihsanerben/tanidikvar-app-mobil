import { statusLabels } from "./labels";
import { useState } from "react";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { View } from "react-native";
import { z } from "zod";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { FeatureForm } from "@/components/ui/feature-form";
import { FormField } from "@/components/ui/form-field";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/states";
import { Text } from "@/components/ui/text";
import { api } from "@/lib/api/client";
import type { Schema } from "@/lib/api/types";
import { nextPage } from "@/lib/query/pagination";
import { ManagerPage } from "./manager-shell";

const reasonSchema = z.object({ reason: z.string().trim().min(5).max(1000) });
type Report = Schema["ManagedContentReportResponse"];
type QuestionReport = Schema["QuestionReportResponse"];
function QuestionReportCard({ report }: { report: QuestionReport }) {
  const [decision, setDecision] = useState<"RESOLVED" | "DISMISSED" | null>(null);
  const client = useQueryClient();
  const mutation = useMutation({ mutationFn: (body: { reason: string }) => api.call("put", "/api/manager/reports/{id}", { params: { id: report.id! }, body: { status: decision!, reason: body.reason, version: report.version }, authenticated: true }), onSuccess: async () => { setDecision(null); await client.invalidateQueries({ queryKey: ["manager", "question-reports"] }); } });
  return <Card className="gap-2 border-manager-border"><Text variant="heading">{report.questionTitle || "Soru şikâyeti"}</Text>
    <Text>Gerekçe: {report.reason || "Belirtilmedi"}</Text><Text variant="muted">{report.questionAuthorName || "Üye"} · {statusLabels[report.status ?? ""] ?? report.status}</Text>
    {report.questionId && <Button label="Soruyu incele" variant="secondary" onPress={() => router.push({ pathname: "/manager/questions/[id]", params: { id: report.questionId! } })} />}
    {report.status === "OPEN" && <View className="flex-row flex-wrap gap-2"><Button label="Çözüldü" onPress={() => setDecision("RESOLVED")} /><Button label="İhlal yok" variant="secondary" onPress={() => setDecision("DISMISSED")} /></View>}
    <BottomSheet visible={!!decision} title={decision === "RESOLVED" ? "Şikâyeti çöz" : "Şikâyeti reddet"} close={() => { if (!mutation.isPending) setDecision(null); }}>
      <FeatureForm schema={reasonSchema} defaults={{ reason: "" }} fields={[{ name: "reason", label: "Karar gerekçesi", multiline: true }]} label="Kararı kaydet" submit={body => mutation.mutateAsync(body)} />
      {mutation.isError && <ErrorState error={mutation.error} />}
    </BottomSheet>
  </Card>;
}
function ReportCard({ report }: { report: Report }) {
  const [decision, setDecision] = useState<"RESOLVED" | "DISMISSED" | null>(null);
  const client = useQueryClient();
  const mutation = useMutation({ mutationFn: (body: { reason: string }) => api.call("put", "/api/manager/content-reports/{id}", { params: { id: report.id! }, body: { status: decision!, reason: body.reason, version: report.version }, authenticated: true }), onSuccess: async () => { setDecision(null); await client.invalidateQueries({ queryKey: ["manager", "reports"] }); } });
  return <Card className="gap-2 border-manager-border"><Text variant="heading">{report.questionTitle || report.targetType || "İçerik raporu"}</Text>
    <Text numberOfLines={3}>{report.contentBody}</Text><Text>Gerekçe: {report.reason || "Belirtilmedi"}</Text>
    <Text variant="muted">{report.targetType} · {report.authorName || "Üye"} · {statusLabels[report.status ?? ""] ?? report.status}</Text>
    {report.questionId && <Button label="Soruyu incele" variant="secondary" onPress={() => router.push({ pathname: "/manager/questions/[id]", params: { id: report.questionId! } })} />}
    {report.status === "OPEN" && <View className="flex-row flex-wrap gap-2"><Button label="Çözüldü" onPress={() => setDecision("RESOLVED")} /><Button label="İhlal yok" variant="secondary" onPress={() => setDecision("DISMISSED")} /></View>}
    <BottomSheet visible={!!decision} title={decision === "RESOLVED" ? "Raporu çöz" : "Raporu reddet"} close={() => { if (!mutation.isPending) setDecision(null); }}>
      <FeatureForm schema={reasonSchema} defaults={{ reason: "" }} fields={[{ name: "reason", label: "Karar gerekçesi", multiline: true }]} label="Kararı kaydet" submit={body => mutation.mutateAsync(body)} />
      {mutation.isError && <ErrorState error={mutation.error} />}
    </BottomSheet>
  </Card>;
}
export function ManagerReportsScreen() {
  const [draft, setDraft] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("OPEN");
  const query = useInfiniteQuery({ queryKey: ["manager", "reports", search, status], initialPageParam: 0,
    queryFn: ({ pageParam, signal }) => api.call("get", "/api/manager/content-reports", { query: { q: search || undefined, status: status || undefined, page: pageParam, size: 20 }, authenticated: true, signal }), getNextPageParam: nextPage });
  const questions = useInfiniteQuery({ queryKey: ["manager", "question-reports", search, status], initialPageParam: 0,
    queryFn: ({ pageParam, signal }) => api.call("get", "/api/manager/reports", { query: { q: search || undefined, status: status || undefined, page: pageParam, size: 20 }, authenticated: true, signal }), getNextPageParam: nextPage });
  const items = query.data?.pages.flatMap(page => page.items ?? []) ?? [];
  const questionItems = questions.data?.pages.flatMap(page => page.items ?? []) ?? [];
  return <ManagerPage title="İçerik raporları"><FormField label="Rapor ara" value={draft} onChangeText={setDraft} onSubmitEditing={() => setSearch(draft)} />
    <Select label="Durum" value={status} options={[{ value: "OPEN", label: "Açık" }, { value: "RESOLVED", label: "Çözülen" }, { value: "DISMISSED", label: "Reddedilen" }, { value: "", label: "Tümü" }]} onChange={setStatus} />
    <Button label="Ara" variant="secondary" onPress={() => setSearch(draft)} />
    <Text variant="heading">Soru şikâyetleri ({questions.data?.pages[0]?.totalElements ?? 0})</Text>
    {questions.isPending ? <Skeleton /> : questions.isError && !questions.data ? <ErrorState error={questions.error} retry={() => void questions.refetch()} /> : questionItems.length ? questionItems.map(report => <QuestionReportCard key={report.id} report={report} />) : <EmptyState title="Soru şikâyeti bulunamadı" />}
    {questions.hasNextPage && <Button label="Daha fazla soru şikâyeti" variant="secondary" pending={questions.isFetchingNextPage} onPress={() => void questions.fetchNextPage()} />}
    <Text variant="heading">Yorum ve yanıt şikâyetleri ({query.data?.pages[0]?.totalElements ?? 0})</Text>
    {query.isPending ? <Skeleton /> : query.isError && !query.data ? <ErrorState error={query.error} retry={() => void query.refetch()} /> : items.length ? items.map(report => <ReportCard key={report.id} report={report} />) : <EmptyState title="Rapor bulunamadı" />}
    {query.hasNextPage && <Button label="Daha fazla göster" variant="secondary" pending={query.isFetchingNextPage} onPress={() => void query.fetchNextPage()} />}
  </ManagerPage>;
}
