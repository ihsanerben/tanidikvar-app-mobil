import { useState } from "react";
import { useQueries } from "@tanstack/react-query";
import { Share, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { canCompare, comparisonOption, comparisonParams, comparisonWebUrl, type ComparisonParams } from "./comparison-model";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Page } from "@/components/ui/page";
import { ErrorState, Skeleton } from "@/components/ui/states";
import { Text } from "@/components/ui/text";
import { CatalogPicker } from "./catalog-picker";
import { netFields } from "./program-panels";
import { programDetail, universityStats, universityDetail } from "./api";

type Selection = { universityId?: string; universityName?: string; programId?: string; programName?: string };
const display = (value?: number | null, digits = 0) => value == null ? "Veri yok" : value.toLocaleString("tr-TR", { maximumFractionDigits: digits });
function Results({title,columns}: {title:string;columns:{title:string;values:{label:string;value:string}[]}[]}) {
  const labels=Array.from(new Set(columns.flatMap(column=>column.values.map(row=>row.label))));
  return <View className="gap-3"><Text variant="heading">{title}</Text><DataTable label={title} columns={["Ölçüt",...columns.map(column=>column.title)]} rows={labels.map(label=>[label,...columns.map(column=>column.values.find(row=>row.label===label)?.value ?? "Veri yok")])} /></View>;
}
function UniversityResults({selected,year}: {selected:Selection[];year:number}) {
  const queries=useQueries({queries:selected.map(item=>universityStats(item.universityId!))});
  if(queries.every(query=>query.isPending))return <Skeleton />;
  const columns=queries.map((query,index)=>({title:selected[index].universityName ?? "Üniversite",values:[
    {label:"Program",value:display(query.data?.programCount)},{label:"Akademik birim",value:display(query.data?.facultyCount)},{label:"Tercih seçeneği",value:display(query.data?.optionCount)},
    {label:"Kontenjan",value:display(query.data?.yearly?.find(item=>item.year===year)?.quota)},{label:"Yerleşen",value:display(query.data?.yearly?.find(item=>item.year===year)?.placed)},{label:"Doluluk (%)",value:display(query.data?.yearly?.find(item=>item.year===year)?.fillRate,2)},
  ]}));
  return <View className="gap-3">{queries.map((query,index) => query.isPending ? <Skeleton key={index} /> : query.isError ? <ErrorState key={index} error={query.error} retry={() => { void query.refetch(); }} /> : null)}<Results title={`${year} karşılaştırması`} columns={columns} /></View>;
}
function ProgramResults({selected,year}: {selected:Selection[];year:number}) {
  const queries=useQueries({queries:selected.map(item=>programDetail(item.programId!))});
  if(queries.every(query=>query.isPending))return <Skeleton />;
  const columns=queries.map((query,index)=>{
    const detail=query.data;const option=detail ? comparisonOption(detail,year) : undefined;const stat=option?.statistics?.find(item=>item.year===year);
    const academic=detail?.academicDetails?.find(item=>item.faculty===option?.faculty) ?? detail?.academicDetails?.[0];
    const staffCounts=[academic?.professorCount,academic?.associateProfessorCount,academic?.doctorFacultyMemberCount,academic?.researchAssistantCount];
    const staff=staffCounts.some(value=>value!=null) ? staffCounts.reduce<number>((sum,value)=>sum+(value ?? 0),0) : undefined;
    const net=[...(option?.statistics ?? [])].sort((a,b)=>(b.year ?? 0)-(a.year ?? 0)).find(item=>(item.year ?? 0)<=year && netFields.some(([key])=>item[key]!=null));
    return {title:`${selected[index].universityName ?? "Üniversite"} · ${selected[index].programName ?? "Program"}`,values:[
      {label:"Birim",value:option?.faculty || "—"},{label:"Başarı sırası",value:display(stat?.successRank)},{label:"Taban puan",value:display(stat?.minimumScore,3)},{label:"Kontenjan",value:display(stat?.quota)},{label:"Yerleşen",value:display(stat?.placed)},
      {label:"Akademik kadro",value:display(staff)},{label:"Profesör",value:display(academic?.professorCount)},{label:"Doçent",value:display(academic?.associateProfessorCount)},{label:"Dr. Öğr. Üyesi",value:display(academic?.doctorFacultyMemberCount)},{label:"Araştırma görevlisi",value:display(academic?.researchAssistantCount)},{label:"Akreditasyon",value:academic?.accreditationCode ?? "Veri yok"},{label:"Net verisinin yılı",value:display(net?.year)},
      ...netFields.map(([key,label])=>({label,value:display(key==='averageSecondaryScore' && net?.[key]!=null ? net[key]!/5 : net?.[key],2)})),
    ]};
  });
  return <View className="gap-3">{queries.map((query,index) => query.isPending ? <Skeleton key={index} /> : query.isError ? <ErrorState key={index} error={query.error} retry={() => { void query.refetch(); }} /> : null)}<Results title={`${year} karşılaştırması`} columns={columns} /></View>;
}
export function CompareScreen() {
  const parsed = comparisonParams.safeParse(useLocalSearchParams());
  return parsed.success ? <Comparison params={parsed.data} /> : <Page title="Karşılaştır"><ErrorState error={null} retry={() => router.replace('/compare')} /></Page>;
}
function Comparison({ params }: { params: ComparisonParams }) {
  const { mode, year } = params;
  const [showResults, setShowResults] = useState(() => canCompare(params));
  const [shareError, setShareError] = useState<unknown>();
  const slots = [1, 2, 3] as const;
  const universityIds = [...new Set(slots.map(slot => params[`u${slot}`]).filter(Boolean))];
  const programIds = mode === 'PROGRAM' ? [...new Set(slots.map(slot => params[`p${slot}`]).filter(Boolean))] : [];
  const universities = useQueries({ queries: universityIds.map(universityDetail) });
  const programs = useQueries({ queries: programIds.map(programDetail) });
  const selected: Selection[] = slots.map(slot => ({
    universityId: params[`u${slot}`] || undefined,
    programId: params[`p${slot}`] || undefined,
    universityName: universities[universityIds.indexOf(params[`u${slot}`])]?.data?.name,
    programName: programs[programIds.indexOf(params[`p${slot}`])]?.data?.summary?.name,
  }));
  function update(index: number, value: Selection) {
    const slot = slots[index];
    router.setParams({ [`u${slot}`]: value.universityId ?? selected[index].universityId ?? '', [`p${slot}`]: value.programId ?? '' });
    setShowResults(false);
  }
  const valid = selected.filter(item => mode === 'PROGRAM' ? item.universityId && item.programId : item.universityId);
  const unique = new Set(valid.map(item => mode === 'PROGRAM' ? item.programId : item.universityId)).size === valid.length;
  const mismatch = mode === 'PROGRAM' && selected.some(item => { const summary = programs[programIds.indexOf(item.programId ?? '')]?.data?.summary; return summary?.universityId && summary.universityId !== item.universityId; });
  const ready = canCompare(params) && !mismatch;
  async function share() {
    setShareError(undefined);
    try { await Share.share({ message: comparisonWebUrl(params) }); } catch (error) { setShareError(error); }
  }
  return <Page back={false} eyebrow="Karar aracı" title={mode === "PROGRAM" ? "Programları karşılaştır" : "Üniversiteleri karşılaştır"}>
    <Text>Seçenekleri aynı yılın verileriyle yan yana inceleyin.</Text>
    <View className="flex-row gap-2"><View className="min-w-0 flex-1"><Select label="Karşılaştırma türü" value={mode} options={[{ value: "UNIVERSITY", label: "Üniversite" }, { value: "PROGRAM", label: "Program" }]} onChange={value => { router.setParams({ mode: value, p1: '', p2: '', p3: '' }); setShowResults(false); }} /></View><View className="min-w-0 flex-1"><Select label="Karşılaştırma yılı" value={year} options={Array.from({ length: new Date().getFullYear() - 2014 }, (_, index) => { const value = String(new Date().getFullYear() - index); return { value, label: value }; })} onChange={value => { router.setParams({ year: value }); setShowResults(false); }} /></View></View>
    {selected.map((item, index) => <Card compact key={index}><Text variant="heading">{index + 1}. seçenek{index === 2 ? " (isteğe bağlı)" : ""}</Text>
      <CatalogPicker key={`${item.universityId ?? ""}:${item.programId ?? ""}`} showProgram={mode === "PROGRAM"} universityId={item.universityId} universityName={item.universityName} programName={item.programName}
        onUniversity={university => update(index, { universityId: university.id, universityName: university.name, programId: undefined, programName: undefined })}
        onProgram={program => update(index, { programId: program.id, programName: program.name })} />
      {!!item.universityId && <Button label="Seçeneği temizle" variant="secondary" onPress={() => { const slot = slots[index]; router.setParams({ [`u${slot}`]: '', [`p${slot}`]: '' }); setShowResults(false); }} />}
    </Card>)}
    {!unique && <Text accessibilityRole="alert" className="text-danger">Aynı seçeneği birden fazla kez seçme.</Text>}
    <Button label="Karşılaştır" disabled={!ready} onPress={() => setShowResults(true)} />
    {mismatch && <Text accessibilityRole="alert" className="text-danger">Program seçilen üniversiteye ait değil. Programı yeniden seç.</Text>}
    {universities.map((query,index) => query.isError ? <ErrorState key={`university-${index}`} error={query.error} retry={() => { void query.refetch(); }} /> : null)}
    {mode === 'PROGRAM' && programs.map((query,index) => query.isError ? <ErrorState key={`program-${index}`} error={query.error} retry={() => { void query.refetch(); }} /> : null)}
    {ready && <Button label="Karşılaştırmayı paylaş" variant="secondary" onPress={() => { void share(); }} />}
    {shareError != null && <ErrorState error={shareError} retry={() => { void share(); }} />}
    {showResults && ready && (mode === "PROGRAM" ? <ProgramResults selected={valid} year={Number(year)} /> : <UniversityResults selected={valid} year={Number(year)} />)}
  </Page>;
}
