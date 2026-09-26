import { RetentionButton } from "@/features/retention/retention-button";
import { useEffect, useRef, useState } from "react";
import { View, Switch, Share } from "react-native";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { useCurrentUser } from '@/features/auth/use-current-user';
import { useLoginAction } from '@/features/auth/use-login-action';
import { Screen } from "@/components/ui/screen";
import { PageHeader } from "@/components/ui/page";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ActionButton } from "@/components/ui/action-button";
import { Tabs } from "@/components/ui/tabs";
import { QuestionByline } from "./question-byline";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { FeatureForm } from "@/components/ui/feature-form";
import { ErrorState, Skeleton } from "@/components/ui/states";
import { PagedList } from "@/components/ui/paged-list";
import { idParams, sharePath } from "@/lib/navigation/params";
import type { Schema } from "@/lib/api/types";
import {
  questionDetail,
  answerList,
  tanidikAnswers,
  questionsApi,
  newRequestId,
  refreshQuestions,
  questionKeys,
} from "./api";
import { bodySchema, reportSchema } from "./schemas";
import { QuestionContext } from './question-context';
import { Avatar } from '@/components/ui/avatar';
import { api } from '@/lib/api/client';
import { ActionsMenu } from '@/components/ui/actions-menu';
export function QuestionDetailScreen() {
  const parsed = idParams.safeParse(useLocalSearchParams());
  return (
    <Screen>
      {parsed.success ? (
        <Detail id={parsed.data.id} />
      ) : (
        <>
          <PageHeader title="Soru" />
          <ErrorState error={null} />
        </>
      )}
    </Screen>
  );
}
function Detail({ id }: { id: string }) {
  const query = useQuery(questionDetail(id));
  const user = useCurrentUser();
  const loginAction = useLoginAction();
  const like = useQuery({
    queryKey: [...questionKeys.detail(id), "like"],
    queryFn: () => questionsApi.likeState(id),
    staleTime: 30_000,
    enabled: !!user.data,
  });
  const ownCommunity = useQuery({
    queryKey: [...questionKeys.detail(id), "own-community"],
    queryFn: () => questionsApi.ownAnswer(id),
    staleTime: 30_000,
    enabled: !!user.data && user.data.role !== "MANAGER",
    retry: false,
  });
  const ownTanidik = useQuery({
    queryKey: [...questionKeys.detail(id), "own-tanidik"],
    queryFn: () => questionsApi.ownTanidikAnswer(id),
    staleTime: 30_000,
    enabled: !!user.data && user.data.role !== "MANAGER",
    retry: false,
  });
  const quota = useQuery({ queryKey: ['questions', 'quota'], queryFn: () => api.call('get', '/api/me/admin-quota', { authenticated: true }), staleTime: 30_000, enabled: user.data?.role === 'TANIDIK' });
  const [tab, setTab] = useState<"community" | "tanidik">("community");
  const [compose, setCompose] = useState(false);
  const [report, setReport] = useState(false);
  const [anonymous, setAnonymous] = useState(false);
  const [asTanidik, setAsTanidik] = useState(false);
  const opening = useRef({ id, event: newRequestId(), sent: false });
  useEffect(() => {
    if (opening.current.id !== id)
      opening.current = { id, event: newRequestId(), sent: false };
    if (query.isSuccess && !opening.current.sent) {
      opening.current.sent = true;
      void questionsApi.view(id, opening.current.event).catch(() => undefined);
    }
  }, [id, query.isSuccess]);
  if (query.isPending) return <Skeleton variant="detail" />;
  if (query.isError && !query.data)
    return (
      <ErrorState
        error={query.error}
        retry={() => {
          void query.refetch();
        }}
      />
    );
  const question = query.data;
  const owner = !!user.data?.id && question.authorId === user.data.id;
  const canWrite = !!user.data && user.data.role !== "MANAGER" && !question.archivedAt;
  const header = (
    <View className="gap-4 pb-5">
      <PageHeader title="" />
      <Card>
        <QuestionContext question={question} />
        <Text variant="title">{question.title}</Text>
        <Text>{question.body}</Text>
        <QuestionByline question={question} />
        {question.archivedAt && <><Badge label="Arşivlenmiş soru" /><Text variant="muted">Bu soru okunabilir; arşivde olduğu için yeni katkı kabul etmiyor.</Text></>}
        <RetentionButton kind="saved" id={id} />
        <ActionButton
          label={like.data?.liked ? "Beğeniyi geri al" : "Beğen"}
          disabled={!like.isSuccess || !canWrite}
          action={() =>
            questionsApi.like(id, !like.data?.liked, like.data?.version ?? 0)
          }
          after={() => refreshQuestions(id)}
        />
        {!user.data && <Button label="Faydalı oy vermek için giriş yap" variant="secondary" onPress={() => loginAction(() => undefined)} />}
        <ActionButton
          label="Paylaş"
          action={() =>
            Share.share({ message: sharePath("sorular", id, question.title) })
          }
        />
        {!question.archivedAt && user.data?.role !== 'MANAGER' && (
          <Button
            label="Cevap yaz"
            testID="write-answer"
            onPress={() => loginAction(() => setCompose(true))}
          />
        )}
        <ActionsMenu title="Soru işlemleri">
        {owner && (
          <>
            <Button
              label="Soruyu düzenle"
              variant="secondary"
              onPress={() =>
                router.push({
                  pathname: "/questions/[id]/edit",
                  params: { id },
                })
              }
            />
            <ActionButton
              label={
                question.archivedAt ? "Soruyu yeniden aç" : "Soruyu arşivle"
              }
              confirm="Sorunun durumunu değiştirmek istediğine emin misin?"
              action={() =>
                question.archivedAt
                  ? questionsApi.restore(id, question.version!)
                  : questionsApi.archive(id, question.version!)
              }
              after={() => refreshQuestions(id)}
            />
          </>
        )}
        <Button
          label="Soruyu bildir"
          variant="secondary"
          onPress={() => loginAction(() => setReport(true))}
        />
        </ActionsMenu>
      </Card>
      {ownCommunity.data?.deletedAt && (
        <AnswerCard
          answer={ownCommunity.data}
          tanidik={false}
          userId={user.data?.id}
          question={question}
          isOwn
        />
      )}
      {ownTanidik.data?.answer &&
        (ownTanidik.data.answer.anonymous ||
          ownTanidik.data.answer.deletedAt) && (
          <AnswerCard
            answer={ownTanidik.data.answer}
            tanidik
            userId={user.data?.id}
            question={question}
            isOwn
          />
        )}
      <Tabs
        label="Cevaplar"
        value={tab}
        onChange={setTab}
        options={[
          { value: "community", label: `Topluluk (${question.statistics?.communityAnswerCount ?? 0})` },
          { value: "tanidik", label: `Tanıdıklar (${question.statistics?.adminAnswerCount ?? 0})` },
        ]}
      />
      <BottomSheet
        visible={compose}
        title="Cevabını paylaş"
        close={() => setCompose(false)}
      >
        {quota.data && <Text variant="muted">Bugün {quota.data.used ?? 0}/{quota.data.limit ?? 0} Tanıdık cevabı · {quota.data.remaining ?? 0} hakkın kaldı.</Text>}
        {user.data?.role === "TANIDIK" && (
          <Tabs
            label="Cevap türü"
            value={asTanidik ? "tanidik" : "community"}
            onChange={(value) => setAsTanidik(value === "tanidik")}
            options={[
              { value: "community", label: "Topluluk" },
              { value: "tanidik", label: "Tanıdık" },
            ]}
          />
        )}
        {asTanidik && (
          <View className="flex-row items-center justify-between">
            <Text>Anonim yayımla</Text>
            <Switch
              accessibilityLabel="Anonim yayımla"
              value={anonymous}
              onValueChange={setAnonymous}
            />
          </View>
        )}
        <FeatureForm
          schema={bodySchema}
          defaults={{ body: "" }}
          fields={[{ name: "body", label: "Cevabın", multiline: true }]}
          label="Cevabı yayımla"
          testID="answer-submit"
          submit={(value) =>
            questionsApi.answer(
              id,
              { body: value.body, anonymous: asTanidik && anonymous },
              asTanidik,
            )
          }
          onSuccess={() => {
            setCompose(false);
            void refreshQuestions(id);
          }}
        />
      </BottomSheet>
      <BottomSheet
        visible={report}
        title="Soruyu bildir"
        close={() => setReport(false)}
      >
        <FeatureForm
          schema={reportSchema}
          defaults={{ reason: "" }}
          fields={[
            { name: "reason", label: "Bildirim gerekçesi", multiline: true },
          ]}
          submit={(value) => questionsApi.report(id, value.reason, false)}
          onSuccess={() => setReport(false)}
          label="Bildir"
        />
      </BottomSheet>
    </View>
  );
  return tab === "community" ? (
    <Community
      id={id}
      header={header}
      userId={user.data?.id}
      question={question}
    />
  ) : (
    <Tanidik
      id={id}
      header={header}
      userId={user.data?.id}
      question={question}
    />
  );
}
function Community({
  id,
  header,
  userId,
  question,
}: {
  id: string;
  header: React.ReactElement;
  userId?: string;
  question: Schema["QuestionResponse"];
}) {
  const query = useInfiniteQuery(answerList(id));
  function render({ item }: { item: Schema["AnswerResponse"] }) {
    return (
      <AnswerCard
        answer={item}
        tanidik={false}
        userId={userId}
        question={question}
      />
    );
  }
  return <PagedList query={query} header={header} renderItem={render} />;
}
function Tanidik({
  id,
  header,
  userId,
  question,
}: {
  id: string;
  header: React.ReactElement;
  userId?: string;
  question: Schema["QuestionResponse"];
}) {
  const query = useInfiniteQuery(tanidikAnswers(id));
  function render({ item }: { item: Schema["AdminAnswerResponse"] }) {
    return (
      <AnswerCard answer={item} tanidik userId={userId} question={question} />
    );
  }
  return <PagedList query={query} header={header} renderItem={render} />;
}
function AnswerCard({
  answer,
  tanidik,
  userId,
  question,
  isOwn = false,
}: {
  answer: Schema["AnswerResponse"] | Schema["AdminAnswerResponse"];
  tanidik: boolean;
  isOwn?: boolean;
  userId?: string;
  question: Schema["QuestionResponse"];
}) {
  const [editing, setEditing] = useState(false);
  const [editSource, setEditSource] = useState(answer);
  const [reporting, setReporting] = useState(false);
  const loginAction = useLoginAction();
  const helpful = useQuery({
    queryKey: [...questionKeys.detail(question.id!), "helpful", answer.id],
    queryFn: () => questionsApi.helpfulState(answer.id!),
    staleTime: 30_000,
    enabled: !!answer.id && !!userId,
  });
  const owner = isOwn || (!!userId && userId === answer.authorId);
  const unavailable =
    !!answer.deletedAt || !!answer.moderatedAt || !!question.archivedAt;
  return (
    <Card>
      {tanidik && <Badge label="Tanıdık cevabı" />}
      {question.bestAnswerId === answer.id && <Badge label="En İyi Cevap" />}
      <Avatar name={answer.authorName || 'Anonim Tanıdık'} educationStatus={answer.educationStatus} tanidik={tanidik || answer.activeAdmin} />
      <Text variant="label">{answer.authorName || "Anonim Tanıdık"}</Text>
      <Text variant="muted">{[answer.universityName, answer.departmentName].filter(Boolean).join(' · ')}</Text>
      {answer.authorId && (
        <Button
          label="Profili gör"
          variant="secondary"
          onPress={() =>
            router.push({
              pathname: "/profiles/[id]",
              params: { id: answer.authorId! },
            })
          }
        />
      )}
      <Text>{answer.body}</Text>
      <Text variant="muted">{answer.publishedAt ? new Date(answer.publishedAt).toLocaleString('tr-TR') : ''}{answer.editedAt ? ` · Düzenlendi: ${new Date(answer.editedAt).toLocaleString('tr-TR')}` : ''}</Text>
      <Text variant="muted">
        {answer.editedAt ? "Düzenlendi · " : ""}
        {helpful.data?.likeCount ?? answer.likeCount ?? 0} kişi faydalı buldu
      </Text>
      <ActionButton
        label={helpful.data?.liked ? "Faydalı oyunu geri al" : "Faydalı buldum"}
        disabled={unavailable || owner || !helpful.isSuccess}
        action={() => questionsApi.helpful(answer.id!, !helpful.data?.liked)}
        after={() => refreshQuestions(question.id)}
      />
      {!userId && <Button label="Faydalı oy vermek için giriş yap" variant="secondary" onPress={() => loginAction(() => undefined)} />}
      {question.authorId === userId && !unavailable && (
        <ActionButton
          label="En İyi Cevap seç"
          action={() => questionsApi.best(question.id!, answer.id!)}
          after={() => refreshQuestions(question.id)}
        />
      )}
      <Button
        label="Alt yorumlar"
        variant="secondary"
        onPress={() =>
          router.push({
            pathname: "/answers/[id]/comments",
            params: { id: answer.id! },
          })
        }
      />
      <ActionsMenu title="Cevap işlemleri">
      {owner && (
        <>
          <Button
            label="Cevabı düzenle"
            variant="secondary"
            disabled={unavailable}
            onPress={() => {
              setEditSource(answer);
              setEditing(true);
            }}
          />
          <ActionButton
            label={answer.deletedAt ? "Cevabı geri getir" : "Cevabı kaldır"}
            confirm="Cevabının görünürlüğünü değiştirmek istediğine emin misin?"
            action={() =>
              questionsApi.answerStatus(
                answer.id!,
                { deleted: !answer.deletedAt, version: answer.version! },
                tanidik,
              )
            }
            after={() => refreshQuestions(question.id)}
          />
        </>
      )}
      <Button
        label="Cevabı bildir"
        variant="secondary"
        onPress={() => loginAction(() => setReporting(true))}
      />
      </ActionsMenu>
      <BottomSheet
        visible={editing}
        title="Cevabı düzenle"
        close={() => setEditing(false)}
      >
        <FeatureForm
          key={String(editSource.version)}
          reload={() => {
            void (tanidik ? questionsApi.ownTanidikAnswer(question.id!).then(result => result.answer) : questionsApi.ownAnswer(question.id!)).then(latest => { if (latest) setEditSource(latest); });
          }}
          schema={bodySchema}
          defaults={{ body: editSource.body ?? "" }}
          fields={[{ name: "body", label: "Cevabın", multiline: true }]}
          submit={(values) =>
            questionsApi.answerUpdate(
              answer.id!,
              { body: values.body, version: editSource.version! },
              tanidik,
            )
          }
          onSuccess={() => {
            setEditing(false);
            void refreshQuestions(question.id);
          }}
        />
      </BottomSheet>
      <BottomSheet
        visible={reporting}
        title="Cevabı bildir"
        close={() => setReporting(false)}
      >
        <FeatureForm
          schema={reportSchema}
          defaults={{ reason: "" }}
          fields={[
            { name: "reason", label: "Bildirim gerekçesi", multiline: true },
          ]}
          submit={(values) =>
            questionsApi.report(answer.id!, values.reason, true)
          }
          onSuccess={() => setReporting(false)}
          label="Bildir"
        />
      </BottomSheet>
    </Card>
  );
}
