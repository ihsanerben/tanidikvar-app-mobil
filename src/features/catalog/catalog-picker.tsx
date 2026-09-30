import { useState } from "react";
import { View } from "react-native";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { FormField } from "@/components/ui/form-field";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { SelectionField } from "@/components/ui/selection-field";
import { Button } from "@/components/ui/button";
import { PagedList } from "@/components/ui/paged-list";
import { universityList, programList, universityDetail } from "./api";
import type { Schema } from "@/lib/api/types";
export function CatalogPicker({
  universityId,
  universityName,
  programName,
  showProgram = true,
  compact = false,
  onUniversity,
  onProgram,
}: {
  universityId?: string;
  universityName?: string;
  programName?: string;
  showProgram?: boolean;
  compact?: boolean;
  onUniversity: (item: Schema["UniversityResponse"]) => void;
  onProgram: (item: Schema["ProgramSummaryResponse"]) => void;
}) {
  const university = useQuery({ ...universityDetail(universityId ?? ""), enabled: !!universityId && !universityName });
  const [pickedProgram,setPickedProgram] = useState<string>();
  const [kind, setKind] = useState<"university" | "program" | null>(null);
  return (
    <View className="gap-3">
      <SelectionField compact={compact} label="Üniversite" value={universityName || university.data?.name || (compact ? "Seç" : "Üniversite seç")} onPress={() => setKind("university")} expanded={kind==='university'} />
      {showProgram && <SelectionField compact={compact} label="Program" value={programName || pickedProgram || (compact ? "Seç" : "Program seç")} disabled={!universityId} onPress={() => setKind("program")} expanded={kind==='program'} />}
      <BottomSheet
        scroll={false}
        visible={kind !== null}
        title={kind === "university" ? "Üniversite seç" : "Program seç"}
        close={() => setKind(null)}
      >
        {kind && (
          <Picker
            key={kind}
            kind={kind}
            universityId={universityId}
            onUniversity={(item) => {
              setPickedProgram(undefined);
              onUniversity(item);
              setKind(null);
            }}
            onProgram={(item) => {
              setPickedProgram(item.name);
              onProgram(item);
              setKind(null);
            }}
          />
        )}
      </BottomSheet>
    </View>
  );
}
function Picker({
  kind,
  universityId,
  onUniversity,
  onProgram,
}: {
  kind: "university" | "program";
  universityId?: string;
  onUniversity: (item: Schema["UniversityResponse"]) => void;
  onProgram: (item: Schema["ProgramSummaryResponse"]) => void;
}) {
  const [draft, setDraft] = useState("");
  const [q, setQ] = useState("");
  const universities = useInfiniteQuery({
    ...universityList({ q }),
    enabled: kind === "university",
  });
  const programs = useInfiniteQuery({
    ...programList({ q, universityId }),
    enabled: kind === "program",
  });
  function universityRow({ item }: { item: Schema["UniversityResponse"] }) {
    return (
      <Button
        variant="secondary"
        label={item.name ?? "Üniversite"}
        onPress={() => onUniversity(item)}
      />
    );
  }
  function programRow({ item }: { item: Schema["ProgramSummaryResponse"] }) {
    return (
      <Button
        variant="secondary"
        label={item.name ?? "Program"}
        onPress={() => onProgram(item)}
      />
    );
  }
  return (
    <View className="h-96 gap-3">
      <FormField
        hideLabel placeholder="Katalogda ara" label="Katalogda ara"
        value={draft}
        onChangeText={setDraft}
        onSubmitEditing={() => setQ(draft)}
      />
      <Button label="Ara" onPress={() => setQ(draft)} />
      {kind === "university" ? (
        <PagedList query={universities} renderItem={universityRow} />
      ) : (
        <PagedList query={programs} renderItem={programRow} />
      )}
    </View>
  );
}
