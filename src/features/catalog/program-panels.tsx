import { useState } from 'react';
import { View } from 'react-native';
import type { Schema } from '@/lib/api/types';
import { Card } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { Metric } from '@/components/ui/metric';
import { Tabs } from '@/components/ui/tabs';
import { Text } from '@/components/ui/text';
export const netFields = [ ['averageSecondaryScore','Diploma notu'],['tytTurkishNet','TYT Türkçe'],['tytSocialNet','TYT Sosyal'],['tytMathNet','TYT Matematik'],['tytScienceNet','TYT Fen'],['aytMathNet','AYT Matematik'],['aytPhysicsNet','AYT Fizik'],['aytChemistryNet','AYT Kimya'],['aytBiologyNet','AYT Biyoloji'],['aytLiteratureNet','AYT Edebiyat'],['aytHistory1Net','AYT Tarih-1'],['aytGeography1Net','AYT Coğrafya-1'],['aytHistory2Net','AYT Tarih-2'],['aytGeography2Net','AYT Coğrafya-2'],['aytPhilosophyNet','AYT Felsefe'],['aytReligionNet','AYT Din'],['foreignLanguageNet','YDT'] ] as const;
type Option=Schema['AdmissionOptionResponse'];
const closing=(option:Option)=>option.statistics?.find(row=>row.successRank!=null && row.minimumScore!=null) ?? option.statistics?.find(row=>row.successRank!=null) ?? option.statistics?.find(row=>row.minimumScore!=null);
export function ProgramOptions({options,name}: {options:Option[];name?:string}) {
  const [selected,setSelected]=useState('');
  const sorted=[...options].sort((a,b)=>(closing(a)?.successRank ?? Number.MAX_SAFE_INTEGER)-(closing(b)?.successRank ?? Number.MAX_SAFE_INTEGER));
  const active=sorted.find(option=>option.id===selected) ?? sorted[0];
  if(!active)return <Text variant="muted">Tercih seçeneği bulunamadı.</Text>;
  const stat=closing(active);const latest=active.statistics?.[0];
  const nets=(active.statistics ?? []).filter(row=>netFields.some(([key])=>row[key]!=null)).slice(0,3);
  const fields=netFields.filter(([key])=>nets.some(row=>row[key]!=null));
  return <View className="gap-3"><Tabs variant="navigation" label="Program seçenekleri" value={active.id ?? ''} onChange={setSelected} options={sorted.map(option=>({value:option.id ?? '',label:[option.faculty,option.language,option.scholarship,option.specialQuotaType].filter(Boolean).join(' · ') || option.programCode || 'Tercih seçeneği'}))} />
    <Card><Text variant="heading">{[name,active.language,active.scholarship,active.specialQuotaType].filter(Boolean).join(' · ')}</Text><Text variant="muted">{[active.faculty,active.programCode,active.scoreType,active.educationType,active.durationYears?`${active.durationYears} yıl`:null].filter(Boolean).join(' · ')}</Text><View className="flex-row gap-2"><Metric inset label={`Kaçla kapattı? · ${stat?.year ?? 'Veri yok'}`} value={stat?.successRank == null?'Veri yok':`${stat.successRank.toLocaleString('tr-TR')} sıra`} /><Metric inset label="Taban puan" value={stat?.minimumScore} /><Metric inset label="Kontenjan / yerleşen" value={`${latest?.quota ?? 'Veri yok'} / ${latest?.placed ?? 'Veri yok'}`} /></View>
      <DataTable compact fit label="Yıllara göre kontenjan, yerleşen, taban puan ve başarı sırası" columns={['Yıl','Kontenjan','Yerleşen','Taban puan','Başarı sırası']} rows={(active.statistics ?? []).map(row=>[row.year == null ? undefined : String(row.year),row.quota,row.placed,row.minimumScore,row.successRank])} />
      {!!nets.length && <><Text variant="label">Programa son yerleşen öğrencinin diploma notu ve netleri</Text><DataTable compact label="Diploma notu ve netler" columns={['Yıl',...fields.map(([,label])=>label)]} rows={nets.map(row=>[row.year == null ? undefined : String(row.year),...fields.map(([key])=>key==='averageSecondaryScore' && row[key]!=null ? row[key]!/5 : row[key])])} /></>}
    </Card>
  </View>;
}
export function ProgramAcademic({data}: {data:Schema['ProgramDetailResponse']}) {
  const [selected,setSelected]=useState('');
  const details=data.academicDetails ?? [];
  const active=details.find((item,index)=>(item.academicUnitId ?? String(index))===selected) ?? details[0];
  const fees=(data.options ?? []).filter(item=>!active || item.faculty===active.faculty).map(item=>item.annualFee).filter((fee):fee is number=>fee!=null);
  if(!active && data.summary?.institutionType!=='VAKIF')return null;
  return <Card><Text variant="heading">Programın ortak bilgileri</Text><Text variant="muted">Akademik bilgiler aynı yerleşkedeki burslu, indirimli ve ücretli kontenjan seçenekleri için ortaktır.</Text>{details.length>1 && <Tabs variant="navigation" label="Akademik birimler" value={active ? active.academicUnitId ?? String(details.indexOf(active)) : ''} onChange={setSelected} options={details.map((item,index)=>({value:item.academicUnitId ?? String(index),label:item.faculty ?? 'Akademik birim'}))} />}
    {active && <><Text variant="label">{active.faculty}</Text><View className="flex-row gap-2"><Metric inset label="Akademik kadro" value={[active.professorCount,active.associateProfessorCount,active.doctorFacultyMemberCount,active.researchAssistantCount].reduce<number>((sum,value)=>sum+(value ?? 0),0) || 'Veri yok'} /><Metric inset label="Akreditasyon" value={active.accreditationCode ?? 'Veri yok'} /></View><Text variant="muted">{active.accreditationDescription ?? 'Resmî kayıtta açıklama yok'}</Text><DataTable compact fit label="Akademik kadro" columns={['Profesör','Doçent','Dr. Öğr. Üyesi','Araştırma görevlisi']} rows={[[active.professorCount,active.associateProfessorCount,active.doctorFacultyMemberCount,active.researchAssistantCount]]} /></>}
    {data.summary?.institutionType==='VAKIF' && <Metric inset label="Yıllık ücret" value={fees.length?`${Math.max(...fees).toLocaleString('tr-TR')} TL`:'Kaynakta belirtilmemiş'} />}
  </Card>;
}
