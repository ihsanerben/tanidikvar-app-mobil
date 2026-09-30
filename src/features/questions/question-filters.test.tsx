import type { PropsWithChildren } from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { FilterSelect } from '@/components/ui/filter-panel';
import { questionParams } from '@/lib/navigation/params';
import { QuestionFilters } from './question-filters';

jest.mock('@/lib/api/client', () => ({ api: { call: jest.fn(async (_method: string, path: string) => path === '/api/statistics/cities' ? [{ label: 'Ankara', count: 1 }, { label: 'İzmir', count: 1 }] : { items: [], totalElements: 0 }) } }));
jest.mock('@/components/ui/bottom-sheet', () => ({ BottomSheet: ({ visible, children }: PropsWithChildren<{ visible: boolean }>) => visible ? children : null }));

it('clears applied criteria and unsaved fields, including optional catalog IDs', async () => {
  const id = '123e4567-e89b-42d3-a456-426614174000';
  const filters = questionParams.parse({ q: 'kampüs', city: 'Ankara', scope: 'UNIVERSITY', universityId: id, departmentId: id, tagId: id, sort: 'MOST_LIKED' });
  const onApply = jest.fn();
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  let tree!: ReactTestRenderer;
  const press = async (label: string) => act(async () => { tree.root.findAllByType(Button).find(node => node.props.label === label)!.props.onPress(); });
  try {
    await act(async () => { tree = create(<QueryClientProvider client={client}><QuestionFilters filters={filters} onApply={onApply} /></QueryClientProvider>); });
    await press('Filtrele');
    await act(async () => { tree.root.findAllByType(FilterSelect).find(node => node.props.label === 'Şehir')!.props.onChange('İzmir'); });
    await press('Tümünü temizle');
    expect(onApply).toHaveBeenCalledWith({ ...questionParams.parse({}), universityId: undefined, departmentId: undefined, tagId: undefined });
    await press('Filtrele');
    for (const field of tree.root.findAllByType(FormField)) expect(field.props.value).toBe('');
    for (const field of tree.root.findAllByType(FilterSelect)) expect(field.props.value).toBe(field.props.label === 'Sıralama' ? 'NEWEST' : '');
  } finally {
    if (tree) await act(async () => tree.unmount());
    client.clear();
  }
});
