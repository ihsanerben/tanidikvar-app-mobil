import type { ReactElement } from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { Text } from '@/components/ui/text';
import { ErrorState } from '@/components/ui/states';
import { Button } from '@/components/ui/button';
import { Metric } from '@/components/ui/metric';
import { ContextInsights } from './context-insights';

jest.mock('@/lib/auth/token-manager', () => ({ tokenManager: {} }));
jest.mock('@/lib/api/client', () => ({ api: { call: jest.fn() } }));
jest.mock('@/features/auth/use-current-user', () => ({ useCurrentUser: () => ({ data: undefined }) }));
jest.mock('@/lib/auth/auth-context', () => ({ useAuth: () => ({ status: 'guest' }) }));
jest.mock('@/features/auth/use-login-action', () => ({ useLoginAction: () => jest.fn() }));
jest.mock('@/features/profile/api', () => ({ myProfile: () => ({ queryKey: ['me'], queryFn: jest.fn(), staleTime: 30_000 }) }));
jest.mock('./context-contribution', () => ({ ContextContribution: () => null, PollCreate: () => null }));
jest.mock('@shopify/flash-list', () => ({
  FlashList: ({ data, ListHeaderComponent }: { data: { id: string; content: ReactElement }[]; ListHeaderComponent?: ReactElement }) => {
    const React = jest.requireActual<typeof import('react')>('react');
    return React.createElement(React.Fragment, null, ListHeaderComponent, ...data.map(item => React.createElement(React.Fragment, {key:item.id}, item.content)));
  },
}));

let client: QueryClient;
let tree: ReactTestRenderer;
const call = jest.mocked(api.call);
beforeEach(() => {
  call.mockReset();
  client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
});
afterEach(async () => {
  if (tree) await act(async () => tree.unmount());
  client.clear();
});
async function settle() {
  await act(async () => { await new Promise(resolve => setTimeout(resolve, 10)); });
}
async function render(view: 'general' | 'polls') {
  await act(async () => { tree = create(<QueryClientProvider client={client}><ContextInsights universityId="university" view={view} header={<Text>Üniversite</Text>} /></QueryClientProvider>); });
  await settle();
}

it('loads only polls for the polls panel and lets the reader reach page two', async () => {
  call.mockResolvedValueOnce({ items: [{ id: 'first', question: 'İlk anket' }], page: 0, size: 20, totalElements: 21 });
  await render('polls');
  expect(call.mock.calls.map(args => args[1])).toEqual(['/api/polls']);
  call.mockResolvedValueOnce({ items: [{ id: 'last', question: 'Son anket' }], page: 1, size: 20, totalElements: 21 });
  await act(async () => tree.root.findAllByType(Button).find(node => node.props.label === 'Daha fazla göster')!.props.onPress());
  await settle();
  expect(tree.root.findAllByType(Text).some(node => node.props.children === 'Son anket')).toBe(true);
  expect(tree.root.findAllByType(Button).some(node => node.props.label === 'Daha fazla göster')).toBe(false);
});

it('shows only counts on general and retries only the failed metrics section', async () => {
  call.mockImplementation(async (_method, path) => {
    if (path === '/api/context-metrics') throw new Error('metrics unavailable');
    if (path === '/api/experiences') return { items: [{ id: 'experience', title: 'Kampüste yaşam', body: 'Deneyim' }], page: 0, size: 20, totalElements: 1 };
    if (path === '/api/polls') return { items: [], page: 0, size: 20, totalElements: 0 };
    return {};
  });
  await render('general');
  expect(tree.root.findAllByType(Text).some(node => node.props.children === 'Kampüste yaşam')).toBe(false);
  expect(tree.root.findAllByType(Metric).find(node => node.props.label === 'deneyim')?.props.value).toBe(1);
  expect(tree.root.findAllByType(ErrorState)).toHaveLength(1);
  call.mockClear();
  call.mockResolvedValue([]);
  await act(async () => tree.root.findByType(ErrorState).props.retry());
  await settle();
  expect(call.mock.calls.map(args => args[1])).toEqual(['/api/context-metrics']);
  expect(tree.root.findAllByType(ErrorState)).toHaveLength(0);
});
