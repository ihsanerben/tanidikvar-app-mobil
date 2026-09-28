import { View, Pressable, ScrollView } from 'react-native';
import { router, type Href } from 'expo-router';
import { cva } from 'class-variance-authority';
import { Text } from '@/components/ui/text';
import type { Schema } from '@/lib/api/types';

const badge = cva('flex-row items-center gap-1.5 rounded-control px-2 py-1', { variants: { scope: { GENERAL: 'bg-scope-general', UNIVERSITY: 'bg-scope-university', UNIVERSITY_DEPARTMENT: 'bg-scope-program' } } });
const label = cva('text-compact-badge font-semibold', { variants: { scope: { GENERAL: 'text-scope-general-text', UNIVERSITY: 'text-scope-university-text', UNIVERSITY_DEPARTMENT: 'text-scope-program-text' } } });
export function questionContextLinks(question: Schema['QuestionResponse']): { university?: Href; department?: Href } {
  return {
    university: question.universityId ? { pathname: '/universities/[id]', params: { id: question.universityId } } : undefined,
    department: question.programId ? { pathname: '/programs/[id]', params: { id: question.programId } } : question.universityId && question.departmentId ? { pathname: '/department', params: { universityId: question.universityId, departmentId: question.departmentId } } : undefined,
  };
}
export function QuestionContext({ question, compact = false }: { question: Schema['QuestionResponse']; compact?: boolean }) {
  const scope = question.scope ?? 'GENERAL';
  if (scope === 'GENERAL' && !question.tags?.some(tag => tag.available)) return null;
  const links = questionContextLinks(question);
  const school = (name: string | undefined, href: Href | undefined) => href ? <Pressable accessibilityRole="link" accessibilityLabel={`${name} sayfası`} hitSlop={8} onPress={() => router.push(href)}><Text variant="unstyled" numberOfLines={1} className={label({ scope, className: 'underline' })}>{name}</Text></Pressable> : <Text variant="unstyled" numberOfLines={1} className={label({ scope })}>{name}</Text>;
  return <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-grow-0" contentContainerClassName="min-h-8 flex-row items-center gap-1.5">
    <View className={badge({ scope })}>
      <Text variant="unstyled" className={label({ scope })}>●</Text>
      {scope === 'GENERAL' ? <Text variant="unstyled" className={label({ scope })}>Genel</Text> : <>{school(question.universityName, links.university)}{scope === 'UNIVERSITY_DEPARTMENT' && !!question.departmentName && <><Text variant="unstyled" className={label({ scope })}>·</Text>{school(question.departmentName, links.department)}</>}</>}
    </View>
    {question.tags?.filter(tag => tag.available).map(tag => <Pressable key={tag.id} accessibilityRole="link" accessibilityLabel={`#${tag.name} soruları`} hitSlop={8} onPress={() => router.push({ pathname: '/', params: { tagId: tag.id } })}><View className="rounded-control bg-primary-soft px-2 py-1"><Text variant="unstyled" numberOfLines={1} className={compact ? 'text-compact-badge text-muted' : 'text-metadata text-muted'}>#{tag.name}</Text></View></Pressable>)}
  </ScrollView>;
}
