import { View, Pressable } from 'react-native';
import { router } from 'expo-router';
import { cva } from 'class-variance-authority';
import { Text } from '@/components/ui/text';
import type { Schema } from '@/lib/api/types';
const badge = cva('rounded-control px-2 py-1', { variants: { scope: { GENERAL: 'bg-scope-general', UNIVERSITY: 'bg-scope-university', UNIVERSITY_DEPARTMENT: 'bg-scope-program' } } });
const label = cva('text-metadata font-semibold', { variants: { scope: { GENERAL: 'text-scope-general-text', UNIVERSITY: 'text-scope-university-text', UNIVERSITY_DEPARTMENT: 'text-scope-program-text' } } });
export function QuestionContext({ question }: { question: Schema['QuestionResponse'] }) {
  const scope = question.scope ?? 'GENERAL';
  function open() {
    if (scope === 'UNIVERSITY_DEPARTMENT' && question.programId) router.push({ pathname: '/programs/[id]', params: { id: question.programId } });
    else if (question.universityId) router.push({ pathname: '/universities/[id]', params: { id: question.universityId } });
    else router.push({ pathname: '/', params: { scope: 'GENERAL' } });
  }
  return <View className="flex-row flex-wrap gap-2">
    <Pressable accessibilityRole="link" onPress={open} className="min-h-11 justify-center"><View className={badge({ scope })}><Text className={label({ scope })}>{scope === 'GENERAL' ? 'Genel' : scope === 'UNIVERSITY' ? question.universityName : `${question.universityName} · ${question.departmentName}`}</Text></View></Pressable>
    {question.tags?.filter(tag => tag.available).map(tag => <Pressable key={tag.id} accessibilityRole="link" className="min-h-11 justify-center" onPress={() => router.push({ pathname: '/', params: { tagId: tag.id } })}><View className="rounded-control bg-primary-soft px-2 py-1"><Text className="text-metadata text-muted">#{tag.name}</Text></View></Pressable>)}
  </View>;
}
