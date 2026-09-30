import {ExperienceEditor} from "./experience-editor";
import {useContributionClose} from "./contribution-dialog";
import { Switch } from "@/components/ui/switch";
import { useState } from 'react';
import { Controller, useFieldArray, type UseFormReturn } from 'react-hook-form';
import { z } from 'zod';
import { View } from 'react-native';
import { api } from '@/lib/api/client';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { Tabs } from '@/components/ui/tabs';
import { Select } from '@/components/ui/select';
import { FormField } from '@/components/ui/form-field';
import { Button } from '@/components/ui/button';
import { FeatureForm } from '@/components/ui/feature-form';
const metricLabels = ['Haftalık çalışma saati','Devam zorunluluğu (%)','Proje yoğunluğu (%)','Sınav yoğunluğu (%)','İngilizce kullanım oranı','Grup çalışması oranı','Kampüste geçirilen saat','Aylık barınma maliyeti','Aylık ulaşım maliyeti','Aylık yemek maliyeti'];
const metricKeys = ['WEEKLY_STUDY_HOURS','ATTENDANCE_LEVEL','PROJECT_INTENSITY','EXAM_INTENSITY','ENGLISH_PERCENT','GROUP_WORK_PERCENT','CAMPUS_HOURS','MONTHLY_HOUSING_COST','MONTHLY_TRANSPORT_COST','MONTHLY_FOOD_COST'];
const metricSchema=z.object({metricKey:z.string().min(1),value:z.string().refine(value => value.trim()!=='' && Number.isFinite(Number(value)) && Number(value)>=0 && Number(value)<=1000000,'0–1.000.000 arasında bir değer gir.')});

const careerSchema=z.object({sector:z.string().trim().min(2).max(120),firstRole:z.string().trim().min(2).max(120),companyType:z.string().trim().min(2).max(80),jobSearchMonths:z.string().regex(/^\d+$/).refine(value => Number(value)<=120),graduateStudy:z.boolean()});
const pollSchema=z.object({question:z.string().trim().min(10).max(300),options:z.array(z.object({label:z.string().trim().min(1,'Seçeneği yaz.').max(120)})).min(2).max(6),verifiedOnly:z.boolean()});
export function ContextContribution({universityId,programId,after,kind}: {universityId:string;programId?:string;after:()=>void;kind?:"metric"|"experience"}) {
  const [tab,setTab]=useState<string>(kind??'metric');
  return <Card><Text variant="heading">Deneyiminle katkı yap</Text>{!kind&&<Tabs label="Katkı türü" value={tab} onChange={setTab} options={[{value:'metric',label:'Gerçek hayat ölçümü'},{value:'experience',label:'Deneyim'},...(programId?[{value:'career',label:'Kariyer yolculuğu'}]:[])]} />}
    {tab==='metric' ? <FeatureForm schema={metricSchema} defaults={{metricKey:metricKeys[0],value:''}} fields={[{name:'value',label:'Değer',numeric:true}]} submit={values=>api.call('put','/api/context-metrics',{body:{universityId,programId,metricKey:values.metricKey,value:Number(values.value)},authenticated:true})} onSuccess={after}>{form=><Controller control={form.control} name="metricKey" render={({field})=><Select label="Ölçüm" value={field.value} onChange={field.onChange} options={metricKeys.map((value,index)=>({value,label:metricLabels[index]}))} />} />}</FeatureForm>
    : tab==='experience' ? <ExperienceEditor universityId={universityId} programId={programId} after={after}/>
    : programId && <FeatureForm schema={careerSchema} defaults={{sector:'',firstRole:'',companyType:'',jobSearchMonths:'',graduateStudy:false}} fields={[{name:'sector',label:'Sektör'},{name:'firstRole',label:'İlk rol'},{name:'companyType',label:'Şirket türü'},{name:'jobSearchMonths',label:'İş bulma süresi (ay)',numeric:true}]} label="Anonim katkı yap" submit={values=>api.call('put','/api/career-outcomes',{body:{universityId,programId,...values,jobSearchMonths:Number(values.jobSearchMonths)},authenticated:true})} onSuccess={after}>{form=><Controller control={form.control} name="graduateStudy" render={({field})=><View className="flex-row items-center gap-2"><Text className="min-w-0 flex-1">Yüksek lisans yaptım/yapıyorum</Text><Switch accessibilityLabel="Yüksek lisans yaptım/yapıyorum" value={field.value} onValueChange={field.onChange} /></View>} />}</FeatureForm>}
  </Card>;
}
function PollFields({form}: {form:UseFormReturn<z.infer<typeof pollSchema>>}) {
  const options=useFieldArray({control:form.control,name:'options'});
  return <View className="gap-3"><Controller control={form.control} name="question" render={({field,fieldState})=><FormField label="Soru" value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={fieldState.error?.message} />} />
    <Text variant="label">Seçenekler</Text>{options.fields.map((option,index)=><View key={option.id} className="gap-1"><Controller control={form.control} name={`options.${index}.label`} render={({field,fieldState})=><FormField label={`Seçenek ${index+1}`} value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={fieldState.error?.message} />} />{options.fields.length>2 && <Button variant="secondary" label={`Seçenek ${index+1} kaldır`} onPress={()=>options.remove(index)} />}</View>)}
    <Button variant="secondary" label="Seçenek ekle" disabled={options.fields.length>=6} onPress={()=>options.append({label:''})} />
    <Text variant="muted">Bu üniversitenin öğrencileri ve Tanıdıkları oy verebilir.</Text>
  </View>;
}
export function PollCreate({universityId,programId,after}: {universityId:string;programId?:string;after:()=>void;kind?:"metric"|"experience"}) {
  const close=useContributionClose();
  return <View className="gap-3"><Text variant="muted">Topluluğa açık bir soru sor; en az iki farklı seçenek ekle.</Text><FeatureForm schema={pollSchema} defaults={{question:'',options:[{label:''},{label:''}],verifiedOnly:false}} fields={[]} label="Anketi yayınla" submit={values=>api.call('post','/api/polls',{body:{universityId,programId,question:values.question,options:values.options.map(item=>item.label),verifiedOnly:values.verifiedOnly},authenticated:true})} onSuccess={()=>{after();close?.();}}>{form=><PollFields form={form} />}</FeatureForm></View>;
}
