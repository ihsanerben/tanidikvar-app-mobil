import { useMutation } from "@tanstack/react-query";
import { Alert, View } from "react-native";
import { Button } from "./button";
import { ErrorState, useOffline } from "./states";
export function ActionButton({
  label,
  action,
  after,
  disabled,
  confirm,
  testID,
}: {
  label: string;
  action: () => Promise<unknown>;
  after?: () => Promise<unknown> | void;
  disabled?: boolean;
  confirm?: string;
  testID?: string;
}) {
  const offline = useOffline();
  const mutation = useMutation({
    mutationFn: action,
    retry: 0,
    onSuccess: async () => {
      await after?.();
    },
  });
  function press() {
    if (confirm)
      Alert.alert(label, confirm, [
        { text: "Vazgeç", style: "cancel" },
        { text: "Onayla", onPress: () => mutation.mutate() },
      ]);
    else mutation.mutate();
  }
  return (
    <View className="gap-2">
      <Button
        label={label}
        testID={testID}
        variant="secondary"
        disabled={disabled || offline}
        pending={mutation.isPending}
        onPress={press}
      />
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
