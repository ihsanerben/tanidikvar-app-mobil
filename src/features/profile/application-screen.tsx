import { useState } from "react";
import { View } from "react-native";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { Screen } from "@/components/ui/screen";
import { PageHeader } from "@/components/ui/page";
import { PagedList } from "@/components/ui/paged-list";
import { FeatureForm } from "@/components/ui/feature-form";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { ErrorState, Skeleton } from "@/components/ui/states";
import type { Schema } from "@/lib/api/types";
import { newRequestId } from "@/features/questions/api";
import { myProfile, applications, profileApi } from "./api";
import { applicationSchema } from "./schemas";
const statuses: Record<string, string> = {
  PENDING: "İnceleniyor",
  APPROVED: "Onaylandı",
  REJECTED: "Reddedildi",
  REVOKED: "Kaldırıldı",
};
export function ApplicationScreen() {
  const profile = useQuery(myProfile());
  const query = useInfiniteQuery(applications());
  const [open, setOpen] = useState(false);
  const [requestId, setRequestId] = useState(newRequestId);
  const pending = query.data?.pages
    .flatMap((p) => p.items ?? [])
    .some((item) => item.status === "PENDING" || item.activeVerification);
  const header = (
    <View className="gap-4 pb-4">
      <PageHeader title="Tanıdık başvurusu" />
      <Text>
        Üniversite deneyimini paylaşarak adaylara yardımcı ol. Başvurun ekip
        tarafından incelenir.
      </Text>
      {profile.isPending ? (
        <Skeleton />
      ) : profile.isError ? (
        <ErrorState
          error={profile.error}
          retry={() => {
            void profile.refetch();
          }}
        />
      ) : !profile.data.completed ? (
        <Button
          label="Önce profilini tamamla"
          onPress={() => router.push("/profile/edit")}
        />
      ) : (
        <Button
          label={
            pending ? "Aktif başvurun veya Tanıdık onayın var" : "Başvuru yap"
          }
          disabled={pending || !query.isSuccess}
          onPress={() => setOpen(true)}
        />
      )}
      <BottomSheet
        visible={open}
        title="Neden Tanıdık olmak istiyorsun?"
        close={() => setOpen(false)}
      >
        <FeatureForm
          schema={applicationSchema}
          defaults={{ coverLetter: "" }}
          fields={[
            { name: "coverLetter", label: "Başvuru yazısı", multiline: true },
          ]}
          label="Başvuruyu gönder"
          testID="application-submit"
          submit={(values) =>
            profileApi.apply({
              requestId,
              profileVersion: profile.data?.version,
              coverLetter: values.coverLetter,
            })
          }
          onSuccess={() => {
            setOpen(false);
            setRequestId(newRequestId());
            void query.refetch();
          }}
        />
      </BottomSheet>
      <Text variant="heading">Başvuru geçmişin</Text>
    </View>
  );
  return (
    <Screen>
      <PagedList query={query} renderItem={Application} header={header} />
    </Screen>
  );
}
function Application({ item }: { item: Schema["ApplicationResponse"] }) {
  return (
    <Card>
      <Badge label={statuses[item.status ?? ""] ?? "Başvuru"} />
      <Text>{item.coverLetter}</Text>
      <Text variant="muted">
        {item.submittedAt
          ? new Date(item.submittedAt).toLocaleDateString("tr-TR")
          : ""}
      </Text>
      {item.rejectionReason && (
        <Text>Değerlendirme notu: {item.rejectionReason}</Text>
      )}
    </Card>
  );
}
