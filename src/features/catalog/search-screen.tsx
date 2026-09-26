import { useInfiniteQuery } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { View } from 'react-native';
import { Screen } from '@/components/ui/screen';
import { PageHeader } from '@/components/ui/page';
import { PagedList } from '@/components/ui/paged-list';
import { Choice } from '@/components/ui/choice';
import { FormField } from '@/components/ui/form-field';
import { Button } from '@/components/ui/button';
import { ErrorState } from '@/components/ui/states';
import { questionList } from '@/features/questions/api';
import { QuestionCard } from '@/features/questions/question-card';
import { universityList, programList, peopleList } from './api';
import { Person } from './people-screen';
import { UniversityCard, ProgramCard } from './cards';
import { SearchOverview } from './search-overview';
export const searchParams = z.object({ q: z.string().max(150).default(''), kind: z.enum(['questions','universities','programs','people']).optional() });
export function SearchScreen() {
  const p = searchParams.safeParse(useLocalSearchParams());
  return <Screen>{p.success ? <Search key={JSON.stringify(p.data)} filters={p.data} /> : <ErrorState error={null} retry={() => router.replace('/search')} />}</Screen>;
}
function Search({ filters }: { filters: z.infer<typeof searchParams> }) {
  const form = useForm({ resolver: zodResolver(searchParams), defaultValues: filters });
  const header = <View className="gap-4 pb-5"><PageHeader title="Arama" /><Controller control={form.control} name="q" render={({ field }) => <FormField label="Üniversite, program, soru veya Tanıdık" value={field.value} onChangeText={field.onChange} onSubmitEditing={form.handleSubmit(values => router.replace({ pathname: '/search', params: { q: values.q } }))} />} /><Button label="Ara" onPress={form.handleSubmit(values => router.replace({ pathname: '/search', params: { q: values.q } }))} /><Choice label="Sonuç türü" value={filters.kind ?? 'all'} options={[{ value: 'all', label: 'Tümü' }, { value: 'questions', label: 'Sorular' }, { value: 'universities', label: 'Üniversiteler' }, { value: 'programs', label: 'Programlar' }, { value: 'people', label: 'Tanıdıklar' }]} onChange={kind => router.replace({ pathname: '/search', params: kind === 'all' ? { q: filters.q } : { q: filters.q, kind } })} /></View>;
  if (!filters.kind) return <SearchOverview q={filters.q} header={header} />;
  return filters.kind === 'questions' ? <Questions q={filters.q} header={header} /> : filters.kind === 'universities' ? <Universities q={filters.q} header={header} /> : filters.kind === 'people' ? <People q={filters.q} header={header} /> : <Programs q={filters.q} header={header} />;
}
function Questions({ q, header }: { q: string; header: React.ReactElement }) { const query = useInfiniteQuery(questionList({ q })); return <PagedList query={query} header={header} renderItem={QuestionCard} />; }
function Universities({ q, header }: { q: string; header: React.ReactElement }) { const query = useInfiniteQuery(universityList({ q })); return <PagedList query={query} header={header} renderItem={UniversityCard} />; }
function Programs({ q, header }: { q: string; header: React.ReactElement }) { const query = useInfiniteQuery(programList({ q })); return <PagedList query={query} header={header} renderItem={ProgramCard} />; }
function People({ q, header }: { q: string; header: React.ReactElement }) { const query = useInfiniteQuery(peopleList(undefined, undefined, q)); return <PagedList query={query} header={header} renderItem={Person} />; }
