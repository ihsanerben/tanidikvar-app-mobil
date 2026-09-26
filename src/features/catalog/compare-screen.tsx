import { useState } from "react";
import { useQueries } from "@tanstack/react-query";
import { ScrollView, View } from "react-native";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Choice } from "@/components/ui/choice";
import { Page } from "@/components/ui/page";
import { ErrorState, Skeleton } from "@/components/ui/states";
import { Text } from "@/components/ui/text";
import type { Schema } from "@/lib/api/types";
import { CatalogPicker } from "./catalog-picker";
import { programDetail, universityStats } from "./api";

type Selection = { universityId?: string; universityName?: string; programId?: string; programName?: string };
const display = (value?: number | null, digits = 0) => value == null ? "Veri yok" : value.toLocaleString("tr-TR", { maximumFractionDigits: digits });
const netFields = [
  ["averageSecondaryScore", "Diploma notu"], ["tytTurkishNet", "TYT Türkçe"], ["tytSocialNet", "TYT Sosyal"], ["tytMathNet", "TYT Matematik"], ["tytScienceNet", "TYT Fen"],
  ["aytMathNet", "AYT Matematik"], ["aytPhysicsNet", "AYT Fizik"], ["aytChemistryNet", "AYT Kimya"], ["aytBiologyNet", "AYT Biyoloji"], ["aytLiteratureNet", "AYT Edebiyat"],
  ["aytHistory1Net", "AYT Tarih-1"], ["aytGeography1Net", "AYT Coğrafya-1"], ["aytHistory2Net", "AYT Tarih-2"], ["aytPhilosophyNet", "AYT Felsefe"], ["aytReligionNet", "AYT Din"], ["foreignLanguageNet", "YDT"],
] as const;
type Detail = Schema["ProgramDetailResponse"];
function bestOption(detail: Detail, year: number) {
  const options = detail.options ?? [];
  return [...options].sort((a, b) => {
    const rank = (item: typeof a) => item.statistics?.find(stat => stat.year === year)?.successRank ?? Number.MAX_SAFE_INTEGER;
    return rank(a) - rank(b);
  })[0];
}
function ResultColumn({ title, values }: { title: string; values: { label: string; value: string }[] }) {
  return <View className="w-40 gap-2 rounded-card border border-border bg-surface p-3"><Text variant="heading">{title}</Text>
    {values.map(row => <View key={row.label} className="min-h-12 border-t border-border pt-2"><Text className="text-metadata text-muted">{row.label}</Text><Text className="text-caption font-semibold">{row.value}</Text></View>)}
  </View>;
}
function UniversityResults({ selected, year }: { selected: Selection[]; year: number }) {
  const queries = useQueries({ queries: selected.map(item => ({ ...universityStats(item.universityId!), enabled: !!item.universityId })) });
  return <View className="gap-3"><Text variant="heading">{year} karşılaştırması</Text><ScrollView horizontal contentContainerClassName="gap-2 pb-2">
    {queries.map((query, index) => query.isPending ? <Skeleton key={selected[index].universityId} /> : query.isError ? <ErrorState key={selected[index].universityId} error={query.error} retry={() => void query.refetch()} /> : <ResultColumn key={selected[index].universityId} title={selected[index].universityName ?? "Üniversite"} values={[
      { label: "Program", value: display(query.data.programCount) }, { label: "Akademik birim", value: display(query.data.facultyCount) },
      { label: "Tercih seçeneği", value: display(query.data.optionCount) },
      { label: "Kontenjan", value: display(query.data.yearly?.find(item => item.year === year)?.quota) },
      { label: "Yerleşen", value: display(query.data.yearly?.find(item => item.year === year)?.placed) },
      { label: "Doluluk", value: display(query.data.yearly?.find(item => item.year === year)?.fillRate, 2) },
    ]} />)}
  </ScrollView></View>;
}
function ProgramResults({ selected, year }: { selected: Selection[]; year: number }) {
  const queries = useQueries({ queries: selected.map(item => ({ ...programDetail(item.programId!), enabled: !!item.programId })) });
  return <View className="gap-3"><Text variant="heading">{year} karşılaştırması</Text><ScrollView horizontal contentContainerClassName="gap-2 pb-2">
    {queries.map((query, index) => {
      if (query.isPending) return <Skeleton key={selected[index].programId} />;
      if (query.isError) return <ErrorState key={selected[index].programId} error={query.error} retry={() => void query.refetch()} />;
      const option = bestOption(query.data, year);
      const stat = option?.statistics?.find(item => item.year === year);
      const academic = query.data.academicDetails?.find(item => item.faculty === option?.faculty) ?? query.data.academicDetails?.[0];
      const staff = academic && [academic.professorCount, academic.associateProfessorCount, academic.doctorFacultyMemberCount, academic.researchAssistantCount].reduce<number>((sum, value) => sum + (value ?? 0), 0);
      const net = option?.statistics?.find(item => item.year === year) ?? option?.statistics?.find(item => (item.year ?? 0) < year && netFields.some(([key]) => item[key] != null));
      return <ResultColumn key={selected[index].programId} title={`${selected[index].universityName} · ${selected[index].programName}`} values={[
        { label: "Birim", value: option?.faculty || "—" }, { label: "Başarı sırası", value: display(stat?.successRank) },
        { label: "Taban puan", value: display(stat?.minimumScore, 3) }, { label: "Kontenjan", value: display(stat?.quota) },
        { label: "Akademik kadro", value: display(staff || undefined) }, { label: "Profesör", value: display(academic?.professorCount) },
        ...netFields.filter(([key]) => net?.[key] != null).map(([key, label]) => ({ label, value: display(key === "averageSecondaryScore" ? (net?.[key] ?? 0) / 5 : net?.[key], 2) })),
      ]} />;
    })}
  </ScrollView></View>;
}
export function CompareScreen() {
  const [mode, setMode] = useState<"UNIVERSITY" | "PROGRAM">("UNIVERSITY");
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [selected, setSelected] = useState<Selection[]>([{}, {}, {}]);
  const [showResults, setShowResults] = useState(false);
  function update(index: number, value: Selection) {
    setSelected(old => old.map((item, i) => i === index ? { ...item, ...value } : item));
    setShowResults(false);
  }
  const valid = selected.filter(item => mode === "PROGRAM" ? item.universityId && item.programId : item.universityId);
  const unique = new Set(valid.map(item => mode === "PROGRAM" ? item.programId : item.universityId)).size === valid.length;
  return <Page title={mode === "PROGRAM" ? "Programları karşılaştır" : "Üniversiteleri karşılaştır"}>
    <Text>Seçenekleri aynı yılın verileriyle yan yana inceleyin.</Text>
    <Choice label="Karşılaştırma türü" value={mode} options={[{ value: "UNIVERSITY", label: "Üniversite" }, { value: "PROGRAM", label: "Program" }]} onChange={value => { setMode(value); setShowResults(false); }} />
    <Choice label="Karşılaştırma yılı" value={year} options={Array.from({ length: 11 }, (_, index) => { const value = String(new Date().getFullYear() - index); return { value, label: value }; })} onChange={value => { setYear(value); setShowResults(false); }} />
    {selected.map((item, index) => <Card key={index}><Text variant="heading">{index + 1}. seçenek{index === 2 ? " (isteğe bağlı)" : ""}</Text>
      <CatalogPicker showProgram={mode === "PROGRAM"} universityId={item.universityId} universityName={item.universityName} programName={item.programName}
        onUniversity={university => update(index, { universityId: university.id, universityName: university.name, programId: undefined, programName: undefined })}
        onProgram={program => update(index, { programId: program.id, programName: program.name })} />
    </Card>)}
    {!unique && <Text accessibilityRole="alert" className="text-danger">Aynı seçeneği birden fazla kez seçme.</Text>}
    <Button label="Karşılaştır" disabled={valid.length < 2 || !unique} onPress={() => setShowResults(true)} />
    {showResults && (mode === "PROGRAM" ? <ProgramResults selected={valid} year={Number(year)} /> : <UniversityResults selected={valid} year={Number(year)} />)}
  </Page>;
}
