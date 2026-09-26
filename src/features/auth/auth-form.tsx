import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Link, type Href } from 'expo-router';
import { useNetworkState } from 'expo-network';
import { Controller, useForm, useWatch, type DefaultValues, type FieldValues, type Path } from 'react-hook-form';
import { Keyboard, KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { z } from 'zod';

import { ApiError } from '../../../packages/api-client/errors';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Screen } from '@/components/ui/screen';
import { AppFooter } from '@/components/ui/app-footer';
import { Text } from '@/components/ui/text';

type Field<T extends FieldValues> = { name: Path<T>; label: string; kind?: 'email' | 'password' | 'new-password' | 'token'; testID: string };
type Props<T extends FieldValues> = {
  title: string; description: string; schema: z.ZodType<T, T>; defaults: DefaultValues<T>;
  fields: Field<T>[]; submitLabel: string; submit: (values: T) => Promise<unknown>;
  successMessage?: string; successTitle?: string; onSuccess?: () => void; links?: { href: Href; label: string }[]; testID: string; surface?: boolean;
};
export function AuthForm<T extends FieldValues>({ title, description, schema, defaults, fields, submitLabel, submit, successMessage, successTitle, onSuccess, links, testID, surface = false }: Props<T>) {
  const form = useForm<T>({ resolver: zodResolver(schema), defaultValues: defaults });
  const tokenField = fields.find(field => field.kind === 'token');
  const tokenNames: Path<T>[] = tokenField ? [tokenField.name] : [];
  const [token] = useWatch<T, Path<T>[]>({ control: form.control, name: tokenNames });
  const missingToken = !!tokenField && !token;
  const network = useNetworkState();
  const offline = network.isConnected === false || network.isInternetReachable === false;
  const mutation = useMutation({
    mutationFn: submit, retry: 0,
    onSuccess: () => { form.reset(defaults); onSuccess?.(); },
    onError: error => {
      if (error instanceof ApiError) {
        for (const field of fields) {
          if (error.fieldErrors[field.name]) form.setError(field.name, { message: error.fieldErrors[field.name] });
        }
      }
    },
  });
  const message = mutation.error instanceof ApiError ? mutation.error.message : 'İşlem tamamlanamadı. Tekrar deneyebilirsin.';
  return (
    <Screen>
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* A short, bounded form scrolls for the keyboard and large accessibility fonts; this is not a data list. */}
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="gap-4 pb-8 pt-2">
          <View className={surface ? 'gap-4 rounded-surface border border-border bg-surface px-dialog-x py-account-inset' : 'gap-4'}>
          <Text variant="title">{title}</Text>
          {mutation.isSuccess && successTitle ? <View accessibilityRole="alert" className="gap-2 rounded-card bg-primary-soft p-5"><Text variant="heading">{successTitle}</Text><Text>{successMessage}</Text></View> : <>
          {description ? <Text className="text-body text-muted">{description}</Text> : null}
          {fields.filter(field => field.kind !== 'token').map(field => (
            <Controller key={field.name} control={form.control} name={field.name}
              render={({ field: input, fieldState }) => (
                <FormField label={field.label} value={String(input.value ?? '')}
                  onChangeText={input.onChange} onBlur={input.onBlur} error={fieldState.error?.message}
                  testID={field.testID} editable={!mutation.isPending}
                  autoCapitalize="none" autoCorrect={false}
                  keyboardType={field.kind === 'email' ? 'email-address' : 'default'}
                  secureTextEntry={field.kind === 'password' || field.kind === 'new-password'}
                  textContentType={field.kind === 'email' ? 'emailAddress' : field.kind === 'password' ? 'password' : field.kind === 'new-password' ? 'newPassword' : 'none'} />
              )} />
          ))}
          {missingToken && <Text accessibilityRole="alert" className="text-danger">Bu sayfa geçerli bir e-posta bağlantısıyla açılmalı. Yeni bir bağlantı iste.</Text>}
          {offline ? <Text accessibilityRole="alert" className="text-warning">Bağlantı bekleniyor. İnternete bağlandıktan sonra devam edebilirsin.</Text> : null}
          {mutation.isError ? <View>
            <Text accessibilityRole="alert" className="text-danger">{message}</Text>
            {mutation.error instanceof ApiError && mutation.error.requestId ? <Text className="text-sm text-muted">Destek kodu: {mutation.error.requestId}</Text> : null}
            {mutation.error instanceof ApiError && mutation.error.retryAfter !== undefined ? <Text className="text-sm text-muted">{mutation.error.retryAfter} saniye sonra tekrar dene.</Text> : null}
          </View> : null}
          {mutation.isSuccess && successMessage ? <Text accessibilityRole="alert" className="text-success">{successMessage}</Text> : null}
          <Button label={mutation.isPending ? 'İşlem yapılıyor…' : submitLabel} testID={testID}
            fullWidth
            disabled={offline || missingToken || mutation.isPending || form.formState.isSubmitting}
            onPress={form.handleSubmit(values => { Keyboard.dismiss(); return mutation.mutateAsync(values).catch(() => undefined); })} />
          </>}
          {links?.map(link => <Link key={link.label} href={link.href} className="min-h-11 py-3 text-sm font-semibold text-primary">{link.label}</Link>)}
          </View>
          <AppFooter />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
