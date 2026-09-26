import { useState } from "react";
import { useQueries } from "@tanstack/react-query";
import { View } from "react-native";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Card } from "@/components/ui/card";
import { Tabs } from "@/components/ui/tabs";
import { Select } from "@/components/ui/select";
import { Page } from "@/components/ui/page";
import { ErrorState, Skeleton } from "@/components/ui/states";
import { Text } from "@/components/ui/text";
import type { Schema } from "@/lib/api/types";
import { CatalogPicker } from "./catalog-picker";
import { netFields } from "./program-panels";
import { programDetail, universityStats } from "./api";

type Selection = { universityId?: string; universityName?: string; programId?: string; programName?: string };
const display = (value?: number | null, digits = 0) => value == null ? "Veri yok" : value.toLocaleString("tr-TR", { maximumFractionDigits: digits });
type Detail = Schema["ProgramDetailResponse"];
function bestOption(detail: Detail, year: number) {
  const options = detail.options ?? [];
  return [...options].sort((a, b) => {
    const rank = (item: typeof a) => item.statistics?.find(stat => stat.year === year)?.successRank ?? Number.MAX_SAFE_INTEGER;
    return rank(a) - rank(b);
  })[0];
}
function Results({title,columns}: {title:string;columns:{title:string;values:{label:string;value:string}[]}[]}) {
  const labels=Array.from(new Set(columns.flatMap(column=>column.values.map(row=>row.label))));
  return <View className="gap-3"><Text variant="heading">{title}</Text><DataTable label={title} columns={["Ölçüt",...columns.map(column=>column.title)]} rows={labels.map(label=>[label,...columns.map(column=>column.values.find(row=>row.label===label)?.value ?? "Veri yok")])} /></View>;
}
function UniversityResults({selected,year}: {selected:Selection[];year:number}) {
  const queries=useQueries({queries:selected.map(item=>universityStats(item.universityId!))});
  if(queries.some(query=>query.isPending))return <Skeleton />;
  const failed=queries.find(query=>!query.data);
  if(failed)return <ErrorState error={failed.error} retry={()=>void failed.refetch()} />;
  const columns=queries.map((query,index)=>({title:selected[index].universityName ?? "Üniversite",values:[
    {label:"Program",value:display(query.data?.programCount)},{label:"Akademik birim",value:display(query.data?.facultyCount)},{label:"Tercih seçeneği",value:display(query.data?.optionCount)},
    {label:"Kontenjan",value:display(query.data?.yearly?.find(item=>item.year===year)?.quota)},{label:"Yerleşen",value:display(query.data?.yearly?.find(item=>item.year===year)?.placed)},{label:"Doluluk (%)",value:display(query.data?.yearly?.find(item=>item.year===year)?.fillRate,2)},
  ]}));
  return <Results title={`${year} karşılaştırması`} columns={columns} />;
}
function ProgramResults({selected,year}: {selected:Selection[];year:number}) {
  const queries=useQueries({queries:selected.map(item=>programDetail(item.programId!))});
  if(queries.some(query=>query.isPending))return <Skeleton />;
  const failed=queries.find(query=>!query.data);
  if(failed)return <ErrorState error={failed.error} retry={()=>void failed.refetch()} />;
  const columns=queries.map((query,index)=>{
    const detail=query.data!;const option=bestOption(detail,year);const stat=option?.statistics?.find(item=>item.year===year);
    const academic=detail.academicDetails?.find(item=>item.faculty===option?.faculty) ?? detail.academicDetails?.[0];
    const staff=academic && [academic.professorCount,academic.associateProfessorCount,academic.doctorFacultyMemberCount,academic.researchAssistantCount].reduce<number>((sum,value)=>sum+(value ?? 0),0);
    const net=[...(option?.statistics ?? [])].sort((a,b)=>(b.year ?? 0)-(a.year ?? 0)).find(item=>(item.year ?? 0)<=year && netFields.some(([key])=>item[key]!=null));
    return {title:`${selected[index].universityName} · ${selected[index].programName}`,values:[
      {label:"Birim",value:option?.faculty || "—"},{label:"Başarı sırası",value:display(stat?.successRank)},{label:"Taban puan",value:display(stat?.minimumScore,3)},{label:"Kontenjan",value:display(stat?.quota)},{label:"Yerleşen",value:display(stat?.placed)},
      {label:"Akademik kadro",value:display(staff || undefined)},{label:"Profesör",value:display(academic?.professorCount)},{label:"Doçent",value:display(academic?.associateProfessorCount)},{label:"Dr. Öğr. Üyesi",value:display(academic?.doctorFacultyMemberCount)},{label:"Araştırma görevlisi",value:display(academic?.researchAssistantCount)},{label:"Akreditasyon",value:academic?.accreditationCode ?? "Veri yok"},{label:"Net verisinin yılı",value:display(net?.year)},
      ...netFields.map(([key,label])=>({label,value:display(key==='averageSecondaryScore' && net?.[key]!=null ? net[key]!/5 : net?.[key],2)})),
    ]};
  });
  return <Results title={`${year} karşılaştırması`} columns={columns} />;
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
    <Tabs label="Karşılaştırma türü" value={mode} options={[{ value: "UNIVERSITY", label: "Üniversite" }, { value: "PROGRAM", label: "Program" }]} onChange={value => { setMode(value); setShowResults(false); }} />
    <Select label="Karşılaştırma yılı" value={year} options={Array.from({ length: 11 }, (_, index) => { const value = String(new Date().getFullYear() - index); return { value, label: value }; })} onChange={value => { setYear(value); setShowResults(false); }} />
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
