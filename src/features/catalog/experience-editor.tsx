import {useState} from 'react';
import {View} from 'react-native';
import {Controller} from 'react-hook-form';
import {z} from 'zod';
import {api} from '@/lib/api/client';
import {FeatureForm} from '@/components/ui/feature-form';
import {FormField} from '@/components/ui/form-field';
import {Select} from '@/components/ui/select';
import {Text} from '@/components/ui/text';
import {experienceTemplates} from './experience-card';
import {useContributionClose} from './contribution-dialog';
const schema=z.object({templateType:z.string(),body:z.string().trim().min(20,'Yorumun en az 20 karakter olmalı.').max(5000,'En fazla 5.000 karakter yazabilirsin.')});
export function ExperienceEditor({universityId,programId,after,templateType}:{universityId:string;programId?:string;templateType?:string;after:()=>void}) {
 const [saved,setSaved]=useState(0);
 const close=useContributionClose();
 return <View className="gap-3">{saved>0&&<Text accessibilityRole="alert" className="text-success">Deneyimin yayınlandı.</Text>}<FeatureForm key={saved} schema={schema} defaults={{templateType:templateType??'WHY_I_CHOSE',body:''}} fields={[]} label="Yorumu paylaş" submit={body=>api.call('post','/api/experiences',{body:{universityId,programId,...body,title:experienceTemplates.find(option=>option.value===body.templateType)!.label,sentiment:'NEUTRAL'},authenticated:true})} onSuccess={()=>{setSaved(value=>value+1);after();close?.();}}>{form=><View className="gap-4">{!templateType&&<Controller control={form.control} name="templateType" render={({field})=><Select label="Hangi soruyu yanıtlamak istersin?" value={field.value} onChange={field.onChange} options={experienceTemplates}/>}/>}<Controller control={form.control} name="body" render={({field,fieldState})=><FormField label="Yorumun" placeholder="Deneyimini paylaş" value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} multiline maxLength={5000} editable={!form.formState.isSubmitting} error={fieldState.error?.message}/>}/><Text variant="muted" className="text-caption">Yorumun en az 20 karakter olmalı.</Text></View>}</FeatureForm></View>;
}
