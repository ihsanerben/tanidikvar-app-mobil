import { useState } from "react";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { View } from "react-native";
import { z } from "zod";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Choice } from "@/components/ui/choice";
import { FeatureForm } from "@/components/ui/feature-form";
import { FormField } from "@/components/ui/form-field";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/states";
import { Text } from "@/components/ui/text";
import { api } from "@/lib/api/client";
import type { Schema } from "@/lib/api/types";
import { nextPage } from "@/lib/query/pagination";
import { ManagerPage } from "./manager-shell";
import { ManagerCatalogSync } from "./catalog-sync";

type Kind = "UNIVERSITY" | "DEPARTMENT" | "TAG";
type Entry = Schema["CatalogResponse"];
const createSchema = z.object({ name: z.string().trim().min(1).max(200), reason: z.string().trim().min(5).max(1000) });
const editSchema = createSchema;
const statusSchema = z.object({ reason: z.string().trim().min(5).max(1000) });
const bulkSchema = z.object({ universities: z.string().max(100000), departments: z.string().max(200000), reason: z.string().trim().min(5).max(1000) }).refine(value => value.universities.trim() || value.departments.trim(), { message: "En az bir kayıt yaz.", path: ["universities"] });
const tagBulkSchema = z.object({ tags: z.string().trim().min(1).max(100000), reason: z.string().trim().min(5).max(1000) });
const lines = (value: string) => value.split(/\r?\n/).map(name => name.trim()).filter(Boolean);
const themeSchema = z.object({ city: z.string().max(120), institutionType: z.string().max(80), description: z.string().max(2000), websiteUrl: z.union([z.literal(""), z.url().startsWith("https://")]), logoUrl: z.union([z.literal(""), z.url().startsWith("https://")]), accentPrimary: z.string().regex(/^#[0-9a-fA-F]{6}$/), accentSoft: z.string().regex(/^#[0-9a-fA-F]{6}$/), accentForeground: z.string().regex(/^#[0-9a-fA-F]{6}$/), reason: z.string().trim().min(5).max(1000) });
function EntryCard({ entry, kind }: { entry: Entry; kind: Kind }) {
  const [action, setAction] = useState<"edit" | "status" | "theme" | null>(null);
  const client = useQueryClient();
  const university = useQuery({ queryKey: ["manager", "catalog", "university-details", entry.id], enabled: kind === "UNIVERSITY" && action === "theme" && !!entry.id, queryFn: ({ signal }) => api.call("get", "/api/universities/{id}", { params: { id: entry.id! }, signal }) });
  const usage = useQuery({ queryKey: ["manager", "catalog", "usage", kind, entry.id], enabled: action === "status" && !!entry.id, queryFn: ({ signal }) => api.call("get", "/api/manager/catalog-usage/{kind}/{id}", { params: { kind, id: entry.id! }, authenticated: true, signal }) });
  const mutation = useMutation({ mutationFn: (body: { name?: string; reason: string }) => action === "edit"
    ? api.call("put", "/api/manager/catalog/{kind}/{id}", { params: { kind, id: entry.id! }, body: { name: body.name!, version: entry.version ?? 0, reason: body.reason }, authenticated: true })
    : api.call("put", "/api/manager/catalog/{kind}/{id}/status", { params: { kind, id: entry.id! }, body: { deleted: !entry.deletedAt, version: entry.version ?? 0, reason: body.reason }, authenticated: true }),
    onSuccess: async () => { setAction(null); await client.invalidateQueries({ queryKey: ["manager", "catalog", kind] }); } });
  const theme = useMutation({ mutationFn: (body: z.infer<typeof themeSchema>) => api.call("put", "/api/manager/universities/{id}/details", { params: { id: entry.id! }, body: { ...body, version: university.data?.version ?? entry.version }, authenticated: true }), onSuccess: async () => { setAction(null); await Promise.all([client.invalidateQueries({ queryKey: ["manager", "catalog", kind] }), client.invalidateQueries({ queryKey: ["catalog", "university", entry.id] })]); } });
  return <Card className="gap-2 border-[#e0e3ec]"><Text variant="heading">{entry.name}</Text><Text variant="muted">{entry.deletedAt ? "Pasif" : "Aktif"}</Text>
    <View className="flex-row flex-wrap gap-2"><Button label="Düzenle" variant="secondary" onPress={() => setAction("edit")} /><Button label={entry.deletedAt ? "Aktife al" : "Pasife al"} variant="secondary" onPress={() => setAction("status")} />{kind === "UNIVERSITY" && <Button label="Tema ve detaylar" variant="secondary" onPress={() => setAction("theme")} />}</View>
    <BottomSheet visible={!!action} title={action === "edit" ? "Kaydı düzenle" : action === "theme" ? "Üniversite teması ve detayları" : entry.deletedAt ? "Kaydı aktife al" : "Kaydı pasife al"} close={() => { if (!mutation.isPending && !theme.isPending) setAction(null); }}>
      {action === "edit" ? <FeatureForm key={`${entry.version}-edit`} schema={editSchema} defaults={{ name: entry.name ?? "", reason: "" }} fields={[{ name: "name", label: "Ad" }, { name: "reason", label: "Gerekçe", multiline: true }]} label="Kaydet" submit={body => mutation.mutateAsync(body)} />
        : action === "theme" ? university.isPending ? <Skeleton /> : university.isError ? <ErrorState error={university.error} retry={() => void university.refetch()} /> : <>
          <View className="h-12 rounded-control" style={{ backgroundColor: /^#[0-9a-fA-F]{6}$/.test(university.data?.accentPrimary ?? "") ? university.data!.accentPrimary : "#6a499e" }} />
          <FeatureForm key={university.data?.version} schema={themeSchema} defaults={{ city: university.data?.city ?? "", institutionType: university.data?.institutionType ?? "", description: university.data?.description ?? "", websiteUrl: university.data?.websiteUrl ?? "", logoUrl: university.data?.logoUrl ?? "", accentPrimary: university.data?.accentPrimary ?? "#6a499e", accentSoft: university.data?.accentSoft ?? "#f3ecfa", accentForeground: university.data?.accentForeground ?? "#ffffff", reason: "" }} fields={[{ name: "city", label: "Şehir" }, { name: "institutionType", label: "Kurum türü" }, { name: "description", label: "Açıklama", multiline: true }, { name: "websiteUrl", label: "Web sitesi" }, { name: "logoUrl", label: "Logo adresi" }, { name: "accentPrimary", label: "Ana renk (#RRGGBB)" }, { name: "accentSoft", label: "Yumuşak renk (#RRGGBB)" }, { name: "accentForeground", label: "Yazı rengi (#RRGGBB)" }, { name: "reason", label: "Gerekçe", multiline: true }]} label="Detayları kaydet" submit={body => theme.mutateAsync(body)} />
          {theme.isError && <ErrorState error={theme.error} />}
        </> : <>
          {usage.isPending ? <Skeleton /> : usage.isError ? <ErrorState error={usage.error} retry={() => void usage.refetch()} /> : <Text variant="muted">Kullanım: {usage.data?.profiles ?? 0} profil · {usage.data?.questions ?? 0} soru. Pasifleştirme mevcut bağlantıları silmez.</Text>}
          <FeatureForm key={`${entry.version}-status`} schema={statusSchema} defaults={{ reason: "" }} fields={[{ name: "reason", label: "Gerekçe", multiline: true }]} label="Kararı kaydet" submit={body => mutation.mutateAsync(body)} />
        </>}
      {mutation.isError && <ErrorState error={mutation.error} />}
    </BottomSheet>
  </Card>;
}
export function ManagerCatalogScreen({ tags = false }: { tags?: boolean }) {
  const [kind, setKind] = useState<Kind>(tags ? "TAG" : "UNIVERSITY");
  const [draft, setDraft] = useState("");
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const client = useQueryClient();
  const query = useInfiniteQuery({ queryKey: ["manager", "catalog", kind, search], initialPageParam: 0,
    queryFn: ({ pageParam, signal }) => api.call("get", "/api/manager/catalog/{kind}", { params: { kind }, query: { q: search || undefined, includeDeleted: true, page: pageParam, size: 50 }, authenticated: true, signal }), getNextPageParam: nextPage });
  const create = useMutation({ mutationFn: (body: z.infer<typeof createSchema>) => api.call("post", "/api/manager/catalog/{kind}", { params: { kind }, body, authenticated: true }), onSuccess: async () => { setCreateOpen(false); await client.invalidateQueries({ queryKey: ["manager", "catalog", kind] }); } });
  const bulk = useMutation({ mutationFn: async (body: { universities?: string; departments?: string; tags?: string; reason: string }) => {
    if (tags) {
      const list = lines(body.tags ?? "");
      if (list.length > 1000) throw new Error("En fazla 1000 tag eklenebilir.");
      return api.call("post", "/api/manager/catalog/tags/bulk-import", { body: { tags: list, reason: body.reason }, authenticated: true });
    }
    const universities = lines(body.universities ?? ""), departments = lines(body.departments ?? "");
    if (universities.length > 500 || departments.length > 1000) throw new Error("En fazla 500 üniversite ve 1000 bölüm eklenebilir.");
    return api.call("post", "/api/manager/catalog/bulk-import", { body: { universities, departments, reason: body.reason }, authenticated: true });
  }, onSuccess: async () => { setBulkOpen(false); await client.invalidateQueries({ queryKey: ["manager", "catalog", kind] }); } });
  const items = query.data?.pages.flatMap(page => page.items ?? []) ?? [];
  return <ManagerPage title={tags ? "Tagler" : "Üniversiteler ve bölümler"}>
    {!tags && <ManagerCatalogSync />}
    {!tags && <Choice label="Katalog" value={kind} options={[{ value: "UNIVERSITY", label: "Üniversiteler" }, { value: "DEPARTMENT", label: "Bölümler" }]} onChange={value => setKind(value as Kind)} />}
    <FormField label="Kayıt ara" value={draft} onChangeText={setDraft} onSubmitEditing={() => setSearch(draft)} />
    <Button label="Ara" variant="secondary" onPress={() => setSearch(draft)} /><Button label="Yeni kayıt ekle" onPress={() => setCreateOpen(true)} />
    <Button label={tags ? "Toplu tag ekle" : "Toplu üniversite ve bölüm ekle"} variant="secondary" onPress={() => setBulkOpen(true)} />
    <Text variant="muted">{query.data?.pages[0]?.totalElements ?? 0} kayıt</Text>
    {query.isPending ? <Skeleton /> : query.isError && !query.data ? <ErrorState error={query.error} retry={() => void query.refetch()} /> : items.length ? items.map(entry => <EntryCard key={entry.id} entry={entry} kind={kind} />) : <EmptyState title="Kayıt bulunamadı" />}
    {query.hasNextPage && <Button label="Daha fazla göster" variant="secondary" pending={query.isFetchingNextPage} onPress={() => void query.fetchNextPage()} />}
    <BottomSheet visible={createOpen} title="Yeni kayıt ekle" close={() => { if (!create.isPending) setCreateOpen(false); }}>
      <FeatureForm schema={createSchema} defaults={{ name: "", reason: "" }} fields={[{ name: "name", label: "Ad" }, { name: "reason", label: "Ekleme gerekçesi", multiline: true }]} label="Ekle" submit={body => create.mutateAsync(body)} />
      {create.isError && <ErrorState error={create.error} />}
    </BottomSheet>
    <BottomSheet visible={bulkOpen} title={tags ? "Toplu tag ekle" : "Toplu üniversite ve bölüm ekle"} close={() => { if (!bulk.isPending) setBulkOpen(false); }}>
      <Text>Her satıra bir kayıt yaz. Mevcut veya yinelenen adlar atlanır.</Text>
      {tags ? <FeatureForm schema={tagBulkSchema} defaults={{ tags: "", reason: "" }} fields={[{ name: "tags", label: "Tagler", multiline: true }, { name: "reason", label: "İşlem gerekçesi" }]} label="Toplu ekle" submit={body => bulk.mutateAsync(body)} />
        : <FeatureForm schema={bulkSchema} defaults={{ universities: "", departments: "", reason: "" }} fields={[{ name: "universities", label: "Üniversiteler", multiline: true }, { name: "departments", label: "Bölümler", multiline: true }, { name: "reason", label: "İşlem gerekçesi" }]} label="Toplu ekle" submit={body => bulk.mutateAsync(body)} />}
      {bulk.isError && <ErrorState error={bulk.error} />}
    </BottomSheet>
  </ManagerPage>;
}
