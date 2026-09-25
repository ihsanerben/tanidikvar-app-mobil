import { queryClient } from "@/lib/query/query-client";
import { useState } from "react";
import { View } from "react-native";
import { useInfiniteQuery } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { z } from "zod";
import { Screen } from "@/components/ui/screen";
import { PageHeader } from "@/components/ui/page";
import { PagedList } from "@/components/ui/paged-list";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { FeatureForm } from "@/components/ui/feature-form";
import { ErrorState } from "@/components/ui/states";
import { communityParams } from "@/lib/navigation/params";
import { api } from "@/lib/api/client";
import type { Schema } from "@/lib/api/types";
import { questionList } from "@/features/questions/api";
import { QuestionCard } from "@/features/questions/question-card";
import { peopleList, evaluationList } from "./api";
const evaluationSchema = z.object({
  rating: z.string().regex(/^[1-5]$/, "1 ile 5 arasında puan ver."),
  body: z.string().max(2000),
});
export function CommunityScreen() {
  const p = communityParams.safeParse(useLocalSearchParams());
  if (!p.success)
    return (
      <Screen>
        <ErrorState error={null} />
      </Screen>
    );
  return p.data.view === "questions" ? (
    <Questions params={p.data} />
  ) : p.data.view === "people" ? (
    <People params={p.data} />
  ) : (
    <Evaluations params={p.data} />
  );
}
type Params = z.infer<typeof communityParams>;
function Questions({ params }: { params: Params }) {
  const query = useInfiniteQuery(questionList(params));
  return (
    <Screen>
      <PagedList
        query={query}
        renderItem={QuestionCard}
        header={
          <View className="gap-4 pb-4">
            <PageHeader title="Sorular" />
            <Button
              label="Soru sor"
              onPress={() =>
                router.push({ pathname: "/questions/new", params })
              }
            />
          </View>
        }
      />
    </Screen>
  );
}
function People({ params }: { params: Params }) {
  const query = useInfiniteQuery(
    peopleList(params.universityId, params.departmentId),
  );
  return (
    <Screen>
      <PagedList
        query={query}
        renderItem={Person}
        header={<PageHeader title="Tanıdıklar" />}
      />
    </Screen>
  );
}
function Person({ item }: { item: Schema["PublicTanidikProfileResponse"] }) {
  return (
    <Card>
      <Avatar name={item.name} />
      <Text variant="heading">{item.name}</Text>
      <Text>{item.departmentName}</Text>
      <Text variant="muted">
        {item.tanidikAnswerCount ?? 0} Tanıdık cevabı ·{" "}
        {item.helpfulVoteCount ?? 0} faydalı oy
      </Text>
      <Button
        label="Profili gör"
        onPress={() =>
          router.push({ pathname: "/profiles/[id]", params: { id: item.id! } })
        }
      />
    </Card>
  );
}
function Evaluations({ params }: { params: Params }) {
  const query = useInfiniteQuery(
    evaluationList(params.universityId, params.programId),
  );
  const [open, setOpen] = useState(false);
  const header = (
    <View className="gap-4 pb-4">
      <PageHeader title="Değerlendirmeler" />
      <Button label="Deneyimini değerlendir" onPress={() => setOpen(true)} />
      <BottomSheet
        visible={open}
        title="Değerlendir"
        close={() => setOpen(false)}
      >
        <FeatureForm
          schema={evaluationSchema}
          defaults={{ rating: "5", body: "" }}
          fields={[
            { name: "rating", label: "Puan (1–5)", numeric: true },
            { name: "body", label: "Deneyimin", multiline: true },
          ]}
          submit={(values) =>
            api.call("put", "/api/evaluations", {
              body: {
                universityId: params.universityId,
                programId: params.programId,
                rating: Number(values.rating),
                body: values.body,
              },
              authenticated: true,
            })
          }
          onSuccess={() => {
            void queryClient.invalidateQueries({ queryKey: ["gamification"] });
            setOpen(false);
            void query.refetch();
          }}
        />
      </BottomSheet>
    </View>
  );
  return (
    <Screen>
      <PagedList query={query} renderItem={Evaluation} header={header} />
    </Screen>
  );
}
function Evaluation({ item }: { item: Schema["EvaluationResponse"] }) {
  return (
    <Card>
      <Text variant="label">
        {item.authorName} · {item.rating}/5
      </Text>
      <Text>{item.body || "Yazılı yorum eklenmemiş."}</Text>
    </Card>
  );
}
