import { useState } from 'react';
import { Keyboard, View } from 'react-native';
import { useMutation } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '@/lib/api/client';
import { ApiError } from '../../../packages/api-client/errors';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Text } from '@/components/ui/text';
import { ErrorState, useOffline } from '@/components/ui/states';

export const contactSchema = z.object({
  name: z.string().trim().min(1, 'Adını yaz.').max(120),
  email: z.email('Geçerli bir e-posta adresi yaz.').max(254),
  subject: z.string().trim().min(1, 'Bir konu yaz.').max(160),
  message: z.string().trim().min(10, 'Mesajın en az 10 karakter olmalı.').max(5000),
});
export function ContactForm({identity,suggestion=false}: {identity?:{name:string;email:string};suggestion?:boolean} = {}) {
  const form = useForm({ resolver: zodResolver(contactSchema), defaultValues: { name:identity?.name ?? '',email:identity?.email ?? '',subject:'',message:'' } });
  const offline = useOffline();
  const [sent,setSent] = useState(false);
  const mutation = useMutation({ mutationFn: (body: z.infer<typeof contactSchema>) => api.call('post','/api/contact',{body}), retry:0,
    onSuccess: () => { form.reset(); setSent(true); },
    onError: error => { if(error instanceof ApiError) for(const name of ['name','email','subject','message'] as const) if(error.fieldErrors[name]) form.setError(name,{message:error.fieldErrors[name]}); },
  });
  const field = (name: keyof z.infer<typeof contactSchema>, label: string, maxLength: number) => <Controller control={form.control} name={name} render={({field,fieldState}) => <FormField compact ref={field.ref} label={label} value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={fieldState.error?.message} maxLength={maxLength} multiline={name==='message'} keyboardType={name==='email'?'email-address':'default'} autoCapitalize={name==='email'?'none':'sentences'} autoComplete={name==='email'?'email':name==='name'?'name':undefined} editable={!mutation.isPending} />} />;
  return <View className="gap-2 rounded-card border border-border bg-surface p-3">
    {!identity && <View className="flex-row items-start gap-2"><View className="min-w-0 flex-1">{field('name','Adın',120)}</View><View className="min-w-0 flex-1">{field('email','E-posta adresin',254)}</View></View>}
    {field('subject',suggestion?'Başlık':'Konu',160)}{field('message',suggestion?'Açıklama':'Mesajın',5000)}
    <Button fullWidth label={mutation.isPending?'Gönderiliyor…':suggestion?'Öneriyi gönder':'Mesajı gönder'} disabled={offline || mutation.isPending} onPress={form.handleSubmit(values => { Keyboard.dismiss(); setSent(false); mutation.mutate(values); })} />
    {sent && <Text accessibilityRole="alert" className="text-success">Mesajın gönderildi. En kısa sürede sana döneceğiz.</Text>}
    {mutation.isError && <ErrorState error={mutation.error} />}
    {offline && <Text variant="muted">Göndermek için internete bağlan.</Text>}
  </View>;
}
