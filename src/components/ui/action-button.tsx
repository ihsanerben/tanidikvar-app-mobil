import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { View } from "react-native";
import { Button } from "./button";
import { BottomSheet } from "./bottom-sheet";
import { Text } from "./text";
import { ErrorState, useOffline } from "./states";
import type { IconName } from './icon';
export function ActionButton({
  label,
  action,
  after,
  disabled,
  confirm,
  testID,
  size = "compact",
  variant = 'secondary',
  icon,
}: {
  label: string;
  action: () => Promise<unknown>;
  after?: () => Promise<unknown> | void;
  disabled?: boolean;
  confirm?: string;
  testID?: string;
  size?: "small" | "compact";
  variant?: 'secondary' | 'menu';
  icon?: IconName;
}) {
  const offline = useOffline();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const mutation = useMutation({
    mutationFn: action,
    retry: 0,
    onSuccess: async () => {
      setConfirmOpen(false);
      await after?.();
    },
  });
  function press() {
    if (confirm) setConfirmOpen(true);
    else mutation.mutate();
  }
  return (
    <View className="gap-2">
      <Button
        size={size}
        label={label}
        testID={testID}
        variant={variant}
        icon={icon}
        disabled={disabled || offline}
        pending={mutation.isPending}
        onPress={press}
      />
      <BottomSheet visible={confirmOpen} title={label} close={() => { if (!mutation.isPending) setConfirmOpen(false); }}>
        <Text>{confirm}</Text>
        <View className="flex-row flex-wrap gap-2">
          <Button label="Vazgeç" variant="secondary" disabled={mutation.isPending} onPress={() => setConfirmOpen(false)} />
          <Button label="Onayla" variant="danger" pending={mutation.isPending} onPress={() => mutation.mutate()} />
        </View>
        {mutation.isError && <ErrorState error={mutation.error} />}
      </BottomSheet>
      {mutation.isError && (
        <ErrorState
          error={mutation.error}
          retry={
            after
              ? () => {
                  void Promise.resolve(after()).then(() => mutation.reset());
                }
              : undefined
          }
        />
      )}
    </View>
  );
}
