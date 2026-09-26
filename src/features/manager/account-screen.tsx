import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FeatureForm } from "@/components/ui/feature-form";
import { ErrorState, Skeleton } from "@/components/ui/states";
import { Text } from "@/components/ui/text";
import { authApi } from "@/features/auth/api";
import { api } from "@/lib/api/client";
import { ManagerPage } from "./manager-shell";

const identity = z.object({ firstName: z.string().trim().min(1).max(80), lastName: z.string().trim().min(1).max(80) });
export function ManagerAccountScreen() {
  const client = useQueryClient();
  const query = useQuery({ queryKey: ["manager", "account"], queryFn: ({ signal }) => api.call("get", "/api/manager/account", { authenticated: true, signal }) });
  const save = useMutation({ mutationFn: (body: z.infer<typeof identity>) => api.call("put", "/api/manager/account", { body: { ...body, version: query.data?.version ?? 0 }, authenticated: true }), onSuccess: async () => { await Promise.all([query.refetch(), client.invalidateQueries({ queryKey: ["auth", "me"] })]); } });
  const logout = useMutation({ mutationFn: authApi.logout, retry: 0 });
  return <ManagerPage title="Yönetim hesabım">
    {query.isPending ? <Skeleton /> : query.isError && !query.data ? <ErrorState error={query.error} retry={() => void query.refetch()} /> : query.data && <>
      <Card className="gap-3 border-manager-border"><Text variant="heading">Yönetim kimliği</Text>
        <Text variant="muted">E-posta: {query.data.email}</Text>
        <FeatureForm key={query.data.version} schema={identity} defaults={{ firstName: query.data.firstName ?? "", lastName: query.data.lastName ?? "" }} fields={[{ name: "firstName", label: "Ad" }, { name: "lastName", label: "Soyad" }]} label="Bilgilerimi kaydet" submit={body => save.mutateAsync(body)} />
        {save.isSuccess && <Text>Yönetim kimliğin kaydedildi.</Text>}
        {save.isError && <ErrorState error={save.error} retry={() => void query.refetch()} />}
      </Card>
      <Card className="gap-3 border-manager-border"><Text variant="heading">Hesap güvenliği</Text><Text>E-posta adresin doğrulanmış.</Text>
        <Button label="Şifre yenileme bağlantısı iste" variant="secondary" onPress={() => router.push("/forgot-password")} />
        <Button label="Çıkış yap" variant="danger" pending={logout.isPending} onPress={() => logout.mutate()} />
        {logout.isError && <ErrorState error={logout.error} />}
      </Card>
    </>}
  </ManagerPage>;
}
