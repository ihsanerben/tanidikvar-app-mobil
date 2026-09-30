import { useEffect, useRef, useState, type ReactNode } from "react";
import { Keyboard, View } from "react-native";
import { useMutation } from "@tanstack/react-query";
import {
  Controller,
  useForm,
  type DefaultValues,
  type FieldValues,
  type Path,
  type UseFormReturn,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ApiError } from "../../../packages/api-client/errors";
import { FormField } from "./form-field";
import { ErrorState, useOffline } from "./states";
import { Button } from "./button";
import { Text } from "./text";
import { BottomSheet } from "./bottom-sheet";
export function FeatureForm<T extends FieldValues>({
  schema,
  defaults,
  fields,
  submit,
  onSuccess,
  confirm,
  onCancel,
  reload,
  children,
  label = "Kaydet",
  testID = "form-submit",
}: {
  schema: z.ZodType<T, T>;
  defaults: DefaultValues<T>;
  fields: {
    name: Path<T>;
    label: string;
    multiline?: boolean;
    numeric?: boolean;
    hideLabel?: boolean;
    placeholder?: string;
    maxLength?: number;
  }[];
  submit: (values: T) => Promise<unknown>;
  onSuccess?: () => void;
  confirm?: (values: T) => string | undefined;
  onCancel?: () => void;
  reload?: () => void;
  children?: (form: UseFormReturn<T>) => ReactNode;
  label?: string;
  testID?: string;
}) {
  const form = useForm<T>({
    resolver: zodResolver(schema),
    defaultValues: defaults,
  });
  const offline = useOffline();
  const [confirmation, setConfirmation] = useState<{values:T;message:string}>();
  const pendingErrorFocus = useRef<Path<T> | undefined>(undefined);
  const { setFocus } = form;
  const mutation = useMutation({
    mutationFn: submit,
    retry: 0,
    onSuccess,
    onError: (error) => {
      if (error instanceof ApiError) {
        for (const name of Object.keys(defaults) as Path<T>[])
          if (error.fieldErrors[name])
            form.setError(name, { message: error.fieldErrors[name] });
        pendingErrorFocus.current = fields.find(
          (field) => error.fieldErrors[field.name],
        )?.name;
      }
    },
  });
  useEffect(() => {
    // Wait until the inputs are editable again before restoring keyboard focus.
    if (mutation.isPending || !pendingErrorFocus.current) return;
    const name = pendingErrorFocus.current;
    pendingErrorFocus.current = undefined;
    setFocus(name);
  }, [mutation.isPending, mutation.error, setFocus]);
  return (
    <View className="gap-4">
      {children?.(form)}
      {fields.map((item) => (
        <Controller
          key={item.name}
          control={form.control}
          name={item.name}
          render={({ field, fieldState }) => (
            <FormField
              ref={field.ref}
              label={item.label}
              value={String(field.value ?? "")}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={fieldState.error?.message}
              multiline={item.multiline}
              hideLabel={item.hideLabel}
              placeholder={item.placeholder}
              maxLength={item.maxLength}
              keyboardType={item.numeric ? "number-pad" : "default"}
              editable={!mutation.isPending}
              testID={item.name}
            />
          )}
        />
      ))}
      {mutation.isError && <ErrorState error={mutation.error} />}
      {mutation.error instanceof ApiError &&
        mutation.error.status === 409 &&
        reload && (
          <Button
            label="Güncel bilgileri yükle"
            variant="secondary"
            onPress={reload}
          />
        )}
      {mutation.isSuccess && (
        <Text accessibilityRole="alert" className="text-success">
          İşlem tamamlandı.
        </Text>
      )}
      {offline && (
        <Text className="text-warning">Göndermek için internete bağlan.</Text>
      )}
      <View className="flex-row flex-wrap items-center gap-2">
      <Button
        size="large"
        label={label}
        pending={mutation.isPending}
        disabled={offline || form.formState.isSubmitting}
        testID={testID}
        onPress={form.handleSubmit((values) => {
          Keyboard.dismiss();
          const message = confirm?.(values);
          if (message) { setConfirmation({values, message}); return; }
          return mutation.mutateAsync(values).catch(() => undefined);
        })}
      />
      <BottomSheet visible={!!confirmation} title="Tanıdık statün etkilenecek" close={() => setConfirmation(undefined)}>
        <Text>{confirmation?.message}</Text>
        <View className="flex-row flex-wrap gap-2">
          <Button label="Vazgeç" variant="secondary" onPress={() => setConfirmation(undefined)} />
          <Button label="Değişikliği kaydet" variant="danger" disabled={offline || mutation.isPending} onPress={() => {
            if (!confirmation) return;
            const values = confirmation.values;
            setConfirmation(undefined);
            mutation.mutate(values);
          }} />
        </View>
      </BottomSheet>
      {onCancel && <Button label="Vazgeç" variant="secondary" disabled={mutation.isPending || form.formState.isSubmitting} onPress={onCancel} />}
      </View>
    </View>
  );
}
