import { useState } from "react";
import { View } from "react-native";
import { useInfiniteQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { nextPage } from "@/lib/query/pagination";
import type { Schema } from "@/lib/api/types";
import { Button } from "@/components/ui/button";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { PagedList } from "@/components/ui/paged-list";
import { FormField } from "@/components/ui/form-field";
export function TagPicker({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
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
        onPress={() =>
          onChange(
            active
              ? selected.filter((id) => id !== item.id)
              : [...selected, item.id!],
          )
        }
      />
    );
  }
  return (
    <>
      <Button
        label={`Etiketler (${selected.length}/5)`}
        variant="secondary"
        onPress={() => setOpen(true)}
      />
      <BottomSheet
        scroll={false}
        visible={open}
        title="Etiket seç"
        close={() => setOpen(false)}
      >
        <View className="h-96 gap-3">
          <FormField
            label="Etiket ara"
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
