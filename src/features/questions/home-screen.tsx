import { keepPreviousData, useInfiniteQuery } from "@tanstack/react-query";
import { useLocalSearchParams, router } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, View } from "react-native";
import { Text } from "@/components/ui/text";
import { QuestionEditor } from "./question-form-screen";
import { useLoginAction } from "@/features/auth/use-login-action";
import { Screen } from "@/components/ui/screen";
import { PageHeader } from "@/components/ui/page";
import { Button } from "@/components/ui/button";
import { Tabs } from "@/components/ui/tabs";
import { PagedList } from "@/components/ui/paged-list";
import { ErrorState } from "@/components/ui/states";
import { questionParams } from "@/lib/navigation/params";
import { questionList } from "./api";
import { QuestionCard } from "./question-card";
import { QuestionFilters } from "./question-filters";
export function HomeScreen() {
  const parsed = questionParams.safeParse(useLocalSearchParams());
  return parsed.success ? (
    <Feed filters={parsed.data} />
  ) : (
    <Screen>
      <PageHeader title="Sorular" />
      <ErrorState error={null} retry={() => router.replace("/")} />
    </Screen>
  );
}
function Feed({
  filters,
}: {
  filters: ReturnType<typeof questionParams.parse>;
}) {
  const [askOpen, setAskOpen] = useState(false);
  const loginAction = useLoginAction();
  const query = useInfiniteQuery({ ...questionList(filters), placeholderData: keepPreviousData });
  const header = (
    <View className="gap-4 pb-5">
      <PageHeader title={filters.period ? 'Popülerler' : 'Sorular'} back={false}
        help={filters.period ? 'Dönemler İstanbul saatine göre takvim bazlıdır: bugün 00.00, bu hafta Pazartesi 00.00, bu ay ayın ilk günü ve bu yıl 1 Ocak başlangıç alınır.' : 'Soruları üniversite, bölüm, etiket ve cevap durumuna göre filtreleyebilir veya kendi sorunu yayınlayabilirsin.'}
        action={!filters.period && <Button
        label="Soru sor"
        size="standard"
        testID="ask-question"
        onPress={() => loginAction(() => setAskOpen(true))}
      />} />
      {!filters.period && <QuestionFilters filters={filters} onApply={values => router.replace({ pathname: "/", params: values })} />}
      {!!filters.period && <Tabs fill label="Dönem" value={filters.period} options={[{ value: 'DAILY', label: 'Bugün' }, { value: 'WEEKLY', label: 'Bu hafta' }, { value: 'MONTHLY', label: 'Bu ay' }, { value: 'YEARLY', label: 'Bu yıl' }, { value: 'ALL_TIME', label: 'Tüm zamanlar' }]} onChange={period => router.setParams({ period })} />}
      {filters.universityId && (
        <Button
          label="Tüm sorular"
          onPress={() => router.replace("/")}
          variant="secondary"
        />
      )}
    </View>
  );
  return (
    <Screen>
      <PagedList query={query} renderItem={QuestionCard} header={header} maintainPosition={false} />
      <Modal visible={askOpen} transparent animationType="fade" onRequestClose={() => setAskOpen(false)}>
        <KeyboardAvoidingView className="flex-1 justify-center bg-black/40 px-3" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View className="max-h-[90%] overflow-hidden rounded-[16px] border border-border bg-surface shadow-lg">
            <View className="flex-row items-center justify-between border-b border-border px-4 py-3"><Text variant="heading">Soru sor</Text><Pressable accessibilityRole="button" accessibilityLabel="Pencereyi kapat" onPress={() => setAskOpen(false)} className="min-h-touch-ios min-w-touch-ios items-center justify-center"><Text className="text-[22px] text-muted">×</Text></Pressable></View>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerClassName="gap-3 p-4"><QuestionEditor initial={{ universityId: filters.universityId, departmentId: filters.departmentId }} onCancel={() => setAskOpen(false)} onDone={() => setAskOpen(false)} /></ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </Screen>
  );
}
