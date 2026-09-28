import { z } from "zod";
import { Switch } from "@/components/ui/switch";
import { RetentionButton } from "@/features/retention/retention-button";
import { useEffect, useRef, useState } from "react";
import { View, Share, Pressable } from "react-native";
import { keepPreviousData, useInfiniteQuery, useQuery } from "@tanstack/react-query";
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
import { StatAction } from "@/components/ui/stat-action";
import { Icon } from "@/components/ui/icon";
import { AnswerDiscussion } from "./answer-discussion";
import { Avatar } from '@/components/ui/avatar';
import { api } from '@/lib/api/client';
import { ActionsMenu } from '@/components/ui/actions-menu';
export function QuestionDetailScreen() {
  const parsed = idParams.extend({answerId:z.uuid().optional()}).safeParse(useLocalSearchParams());
  return (
    <Screen>
      {parsed.success ? (
        <Detail key={`${parsed.data.id}:${parsed.data.answerId ?? ""}`} id={parsed.data.id} answerId={parsed.data.answerId} />
      ) : (
        <>
          <PageHeader title="Soru" />
          <ErrorState error={null} />
        </>
      )}
    </Screen>
  );
}
function Detail({ id, answerId }: { id: string; answerId?: string }) {
  const focused = useQuery({queryKey:["answers","detail",answerId],enabled:!!answerId,queryFn:({signal})=>api.call("get","/api/answers/{id}",{params:{id:answerId!},signal})});
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
  const [selectedTab, setTab] = useState<"community" | "tanidik">();
  const tab = selectedTab ?? ((query.data?.statistics?.adminAnswerCount ?? 0) > 0 ? "tanidik" : "community");
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
      <PageHeader title="" backHref="/" backLabel="Sorulara dön" />
      <Card compact>
        <QuestionContext question={question} compact />
        <Text variant="heading">{question.title}</Text>
        <Text>{question.body}</Text>
        {question.archivedAt && <><Badge label="Arşivlenmiş soru" /><Text variant="muted">Bu soru okunabilir; arşivde olduğu için yeni katkı kabul etmiyor.</Text></>}
        <QuestionByline question={question} compact actions={<>
          <View accessible accessibilityLabel={`${question.statistics?.viewCount ?? 0} görüntülenme`} className="flex-row items-center gap-1"><Icon name="view" /><Text variant="muted">{question.statistics?.viewCount ?? 0}</Text></View>
          <StatAction icon="heart" label="Soruyu beğen" count={question.statistics?.likeCount ?? 0} selected={like.data?.liked} disabled={!!user.data && (!like.isSuccess || !canWrite)} action={async () => { if (!user.data) { loginAction(() => undefined); return; } await questionsApi.like(id, !like.data?.liked, like.data?.version ?? 0); await refreshQuestions(id); }} />
          <StatAction icon="comment" label="Yorum yaz" count={question.statistics?.totalAnswerCount ?? 0} disabled={!!question.archivedAt || user.data?.role === 'MANAGER'} onPress={() => loginAction(() => setCompose(true))} />
          <ActionsMenu title="Soru işlemleri">
            <RetentionButton size="small" kind="saved" id={id} />
            <ActionButton size="small" label="Paylaş" action={() => Share.share({ message: sharePath("sorular", id, question.title) })} />
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
            <ActionButton size="small"
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
          </ActionsMenu>
        </>} />
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
        ownTanidik.data.answer.deletedAt && (
          <AnswerCard
            answer={ownTanidik.data.answer}
            tanidik
            userId={user.data?.id}
            question={question}
            isOwn
          />
        )}
      {answerId && <View className="gap-2 rounded-card border-2 border-primary p-2">
        <Text variant="label">Bildirimdeki yorum</Text>
        {focused.isPending ? <Skeleton /> : focused.data?.questionId === id ? <AnswerCard answer={focused.data} tanidik={focused.data.answerKind === 'TANIDIK'} userId={user.data?.id} question={question} /> : <ErrorState error={focused.error} retry={()=>void focused.refetch()} />}
      </View>}
      <Tabs
        label="Cevaplar"
        variant="filled"
        value={tab}
        onChange={setTab}
        options={[
          { value: "tanidik", label: `Tanıdık yorumları (${question.statistics?.adminAnswerCount ?? 0})` },
          { value: "community", label: `Topluluk yorumları (${question.statistics?.communityAnswerCount ?? 0})` },
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
            variant="filled"
            value={asTanidik ? "tanidik" : "community"}
            onChange={(value) => setAsTanidik(value === "tanidik")}
            options={[
              { value: "community", label: "Topluluk" },
              { value: "tanidik", label: "Tanıdık" },
            ]}
          />
        )}
        {user.data?.role === "TANIDIK" && (
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
              { body: value.body, anonymous: user.data?.role === "TANIDIK" && anonymous },
              asTanidik,
            )
          }
          onSuccess={() => {
            setCompose(false);
            void refreshQuestions(id);
          }}
        />
        {(asTanidik ? ownTanidik.data?.answer : ownCommunity.data) && <Text variant="muted" accessibilityRole="text">Bu soruda yorumun bulunuyor. Mevcut yorumunu düzenleyebilir veya yeni bir yorum ekleyebilirsin.</Text>}
      </BottomSheet>

    </View>
  );
  return <Answers id={id} tab={tab} header={header} userId={user.data?.id} question={question} />;
}
function Answers({ id, tab, header, userId, question }: {
  id: string; tab: 'community' | 'tanidik'; header: React.ReactElement; userId?: string; question: Schema['QuestionResponse'];
}) {
  const query = useInfiniteQuery({ ...(tab === 'community' ? answerList(id) : tanidikAnswers(id)), placeholderData: keepPreviousData });
  function render({ item }: { item: Schema['AnswerResponse'] | Schema['AdminAnswerResponse'] }) {
    return <View pointerEvents={query.isPlaceholderData ? 'none' : 'auto'} accessibilityElementsHidden={query.isPlaceholderData}><AnswerCard key={item.id} answer={item} tanidik={tab === 'tanidik'} userId={userId} question={question} /></View>;
  }
  return <PagedList<Schema['AnswerResponse'] | Schema['AdminAnswerResponse']> query={query} header={header} renderItem={render} maintainPosition={false} />;
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
  const owner = answer.owned || isOwn || (!!userId && userId === answer.authorId);
  const unavailable =
    !!answer.deletedAt || !!answer.moderatedAt || !!question.archivedAt;
  return (
    <Card compact className={question.bestAnswerId === answer.id ? 'border-primary' : ''}>
      {question.bestAnswerId === answer.id && <Badge label="✓ En iyi cevap" />}
      <View className="flex-row items-start gap-2">
      <Pressable accessibilityRole={answer.authorId ? 'link' : undefined} disabled={!answer.authorId} onPress={() => router.push({pathname:'/profiles/[id]',params:{id:answer.authorId!}})} className="min-h-touch-android min-w-0 flex-1 flex-row items-center gap-2">
        <Avatar size="small" name={answer.authorName || 'Anonim Tanıdık'} educationStatus={answer.educationStatus} tanidik={answer.activeAdmin && !!answer.authorId} />
        <View className="min-w-0 flex-1"><Text variant="label">{answer.authorName || 'Anonim Tanıdık'}</Text>{!!answer.authorId && <Text variant="muted">{[answer.universityName,answer.departmentName].filter(Boolean).join(' · ')}</Text>}</View>
      </Pressable>
      <ActionsMenu title="Cevap işlemleri">
      <ActionButton label="Paylaş" action={() => Share.share({ message: sharePath('sorular', question.id!, question.title) })} />
      {question.authorId === userId && !unavailable && question.bestAnswerId !== answer.id && <ActionButton label="En iyi cevap seç" action={() => questionsApi.best(question.id!, answer.id!)} after={() => refreshQuestions(question.id)} />}

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
          <ActionButton size="small"
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
      <BottomSheet
        visible={editing}
        title="Cevabı düzenle"
        close={() => setEditing(false)}
      >
        <FeatureForm
          key={String(editSource.version)}
          reload={() => {
            void api.call("get","/api/answers/{id}",{params:{id:answer.id!},authenticated:true}).then(setEditSource);
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
      </ActionsMenu></View>
      <Text className="py-1">{answer.body}</Text>
      <AnswerDiscussion answerId={answer.id!} userId={userId} unavailable={unavailable}
        metadata={`${answer.publishedAt ? new Date(answer.publishedAt).toLocaleString('tr-TR',{timeZone:'Europe/Istanbul',day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}) : ''}${answer.editedAt ? ' · düzenlendi' : ''}`}
        likeAction={<StatAction icon="heart" label="Yorumu faydalı bul" count={helpful.data?.likeCount ?? answer.likeCount ?? 0} selected={helpful.data?.liked} disabled={unavailable || owner || (!!userId && !helpful.isSuccess)} action={async () => { if (!userId) { loginAction(() => undefined); return; } await questionsApi.helpful(answer.id!, !helpful.data?.liked); await refreshQuestions(question.id); }} />}
      />
    </Card>
  );
}
