import { useInfiniteQuery } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { View } from 'react-native';
import { Screen } from '@/components/ui/screen';
import { PageHeader } from '@/components/ui/page';
import { PagedList } from '@/components/ui/paged-list';
import { Card } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { ErrorState } from '@/components/ui/states';
import type { Schema } from '@/lib/api/types';
import { peopleList } from './api';
export const peopleParams = z.object({ q: z.string().max(150).default(''), universityId: z.uuid().optional(), departmentId: z.uuid().optional() });
export function PeopleScreen() {
  const p = peopleParams.safeParse(useLocalSearchParams());
  return <Screen>{p.success ? <People key={JSON.stringify(p.data)} filters={p.data} /> : <ErrorState error={null} retry={() => router.replace('/people')} />}</Screen>;
}
function People({ filters }: { filters: z.infer<typeof peopleParams> }) {
  const query = useInfiniteQuery(peopleList(filters.universityId, filters.departmentId, filters.q));
  const form = useForm({ resolver: zodResolver(peopleParams), defaultValues: filters });
  return <PagedList query={query} renderItem={Person} header={<View className="gap-4 pb-5"><PageHeader title="Tanıdıklar" /><Controller control={form.control} name="q" render={({ field }) => <FormField label="Tanıdık ara" value={field.value} onChangeText={field.onChange} onSubmitEditing={form.handleSubmit(values => router.setParams(values))} />} /><Button label="Ara" onPress={form.handleSubmit(values => router.setParams(values))} /><Text variant="muted">{query.data?.pages[0]?.totalElements ?? 0} Tanıdık</Text></View>} />;
}
export function Person({ item }: { item: Schema['PublicTanidikProfileResponse'] }) {
  return <Card><Avatar name={item.name} educationStatus={item.educationStatus} tanidik /><Text variant="heading">{item.name}</Text><Text>{item.universityName} · {item.departmentName}</Text><Text variant="muted">{item.classYear ? `${item.classYear}. sınıf` : item.graduationYear ? `${item.graduationYear} mezunu` : ''}</Text><Text variant="muted">{item.tanidikAnswerCount ?? 0} Tanıdık yorumu · {item.communityAnswerCount ?? 0} topluluk yorumu · {item.helpfulVoteCount ?? 0} faydalı oy</Text><Button label="Profili gör" variant="secondary" onPress={() => router.push({ pathname: '/profiles/[id]', params: { id: item.id! } })} /></Card>;
}
