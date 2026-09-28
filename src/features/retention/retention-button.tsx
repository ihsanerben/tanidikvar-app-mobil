import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { View } from "react-native";
import { Button } from "@/components/ui/button";
import { ErrorState, useOffline } from "@/components/ui/states";
import { Text } from "@/components/ui/text";
import { refreshRetention, retentionState, setRetention } from "./api";
import type { CollectionKind } from "./schemas";
import { useAuth } from '@/lib/auth/auth-context';
import { useLoginAction } from '@/features/auth/use-login-action';
export function RetentionButton({
  kind,
  id,
  initialActive,
  targetType = "UNIVERSITY",
  size = "compact",
}: {
  kind: CollectionKind;
  id: string;
  initialActive?: boolean;
  targetType?: "UNIVERSITY" | "PROGRAM";
  size?: "small" | "compact";
}) {
  const client = useQueryClient();
  const { status } = useAuth();
  const loggedIn = status === 'authenticated';
  const loginAction = useLoginAction();
  const state = useQuery({
    ...retentionState(kind, id,targetType),
    initialData: initialActive,
    enabled: loggedIn,
  });
  const offline = useOffline();
  const mutation = useMutation({
    mutationFn: (active: boolean) => setRetention(kind, id, active,targetType),
    retry: 0,
    onSuccess: (result) =>
      refreshRetention(client, kind, id, result.active === true),
  });
  return (
    <View className="gap-2">
      <Button size={size}
        testID={kind === "follows" ? "follow-toggle" : "save-toggle"}
        label={
          !loggedIn ? (kind === 'follows' ? (targetType === 'PROGRAM' ? 'Bölümü takip et' : 'Üniversiteyi takip et') : 'Soruyu kaydet') : state.isPending
            ? "Durum yükleniyor…"
            : kind === "follows"
              ? state.data
                ? "Takibi bırak"
                : targetType === "PROGRAM" ? "Bölümü takip et" : "Üniversiteyi takip et"
              : state.data
                ? "Kaydı kaldır"
                : "Soruyu kaydet"
        }
        variant="secondary"
        pending={mutation.isPending}
        disabled={loggedIn && (!state.isSuccess || offline)}
        onPress={() => loginAction(() => mutation.mutate(!state.data))}
      />
      {offline && (
        <Text variant="muted">Değiştirmek için internete bağlan.</Text>
      )}
      {state.isError && (
        <ErrorState
          error={state.error}
          retry={() => {
            void state.refetch();
          }}
        />
      )}
      {mutation.isError && (
        <ErrorState
          error={mutation.error}
          retry={() => {
            mutation.reset();
            void state.refetch();
          }}
        />
      )}
    </View>
  );
}
