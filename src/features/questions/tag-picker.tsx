import { useState } from "react";
import { View } from "react-native";
import { useInfiniteQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { nextPage } from "@/lib/query/pagination";
import type { Schema } from "@/lib/api/types";
import { SelectionField } from "@/components/ui/selection-field";
import { Button } from "@/components/ui/button";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { PagedList } from "@/components/ui/paged-list";
import { FormField } from "@/components/ui/form-field";
export function TagPicker({
  selected,
  selectedTags = [],
  onChange,
}: {
  selected: string[];
  selectedTags?: Schema["CatalogResponse"][];
  onChange: (ids: string[]) => void;
}) {
  const [names, setNames] = useState<Record<string,string>>(() => Object.fromEntries(selectedTags.filter(tag=>tag.id).map(tag=>[tag.id!,tag.name || "Etiket"])));
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [q, setQ] = useState("");
  const query = useInfiniteQuery({
    queryKey: ["catalog", "tags", q],
    initialPageParam: 0,
    staleTime: 300_000,
    enabled: open,
    queryFn: ({ pageParam, signal }) =>
      api.call("get", "/api/tags", {
        query: { q, page: pageParam, size: 20 },
        signal,
      }),
    getNextPageParam: nextPage,
  });
  function render({ item }: { item: Schema["CatalogResponse"] }) {
    const active = selected.includes(item.id!);
    return (
      <Button
        variant={active ? "primary" : "secondary"}
        label={`${active ? "✓ " : ""}${item.name}`}
        disabled={!active && selected.length >= 5}
        onPress={() => {
          setNames(old=>({...old,[item.id!]:item.name || "Etiket"}));
          onChange(
            active
              ? selected.filter((id) => id !== item.id)
              : [...selected, item.id!],
          );
        }}
      />
    );
  }
  return (
    <>
      <SelectionField label="Etiket" value={selected.length ? `${selected.length} etiket seçildi` : 'Tüm etiketler'} onPress={()=>setOpen(true)} expanded={open} />
      {!!selected.length && <View className="flex-row flex-wrap gap-2">{selected.map((id,index)=><Button key={id} variant="secondary" label={`#${names[id] || query.data?.pages.flatMap(page=>page.items ?? []).find(tag=>tag.id===id)?.name || `Etiket ${index+1}`} · Kaldır`} onPress={()=>onChange(selected.filter(value=>value!==id))} />)}</View>}
      <BottomSheet
        scroll={false}
        visible={open}
        title="Etiket seç"
        close={() => setOpen(false)}
      >
        <View className="h-96 gap-3">
          <FormField
            hideLabel placeholder="Etiket ara" label="Etiket ara"
            value={draft}
            onChangeText={setDraft}
            onSubmitEditing={() => setQ(draft)}
          />
          <Button label="Ara" onPress={() => setQ(draft)} />
          <PagedList query={query} renderItem={render} />
        </View>
        <Button
          label="Seçimi temizle"
          variant="secondary"
          onPress={() => onChange([])}
        />
      </BottomSheet>
    </>
  );
}
