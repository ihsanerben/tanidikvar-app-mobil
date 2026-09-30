import type { PropsWithChildren, ReactNode } from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { Button } from '@/components/ui/button';
import { FilterSelect } from '@/components/ui/filter-panel';
import { FormField } from '@/components/ui/form-field';
import { ExploreScreen } from './explore-screen';

jest.mock('expo-router', () => ({ router: { replace: jest.fn(), setParams: jest.fn() }, useLocalSearchParams: jest.fn() }));
jest.mock('@/lib/api/client', () => ({ api: { call: jest.fn(async (_method: string, path: string) => path === '/api/statistics/cities' ? [{ label: 'Ankara', count: 1 }] : { items: [], totalElements: 0 }) } }));
jest.mock('@/components/ui/screen', () => ({ Screen: ({ children }: PropsWithChildren) => children }));
jest.mock('@/components/ui/page', () => ({ PageHeader: () => null }));
jest.mock('@/components/ui/paged-list', () => ({ PagedList: ({ header }: { header: ReactNode }) => header }));
jest.mock('@/components/ui/bottom-sheet', () => ({ BottomSheet: ({ visible, children }: PropsWithChildren<{ visible: boolean }>) => visible ? children : null }));

it.each(['universities', 'programs'])('clears an unapplied %s draft even when navigation leaves the route unchanged', async kind => {
  jest.mocked(useLocalSearchParams).mockReturnValue({ kind });
  jest.mocked(router.replace).mockClear();
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  let tree!: ReactTestRenderer;
  const press = async (label: string) => act(async () => { tree.root.findAllByType(Button).find(node => node.props.label === label)!.props.onPress(); });
  try {
    await act(async () => { tree = create(<QueryClientProvider client={client}><ExploreScreen /></QueryClientProvider>); });
    await press('Filtrele');
    await act(async () => {
      tree.root.findAllByType(FilterSelect).find(node => node.props.label === 'Şehir')!.props.onChange('Ankara');
      tree.root.findAllByType(FormField)[0].props.onChangeText('Üniversite');
    });
    await press('Temizle');
    expect(router.replace).toHaveBeenCalledWith({ pathname: '/kesfet', params: { kind } });
    await press('Filtrele');
    expect(tree.root.findAllByType(FilterSelect).find(node => node.props.label === 'Şehir')!.props.value).toBe('');
    expect(tree.root.findAllByType(FormField)[0].props.value).toBe('');
  } finally {
    if (tree) await act(async () => tree.unmount());
    client.clear();
  }
});
