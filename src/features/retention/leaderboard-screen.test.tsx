import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RankedPerson } from './leaderboard-screen';
import { Avatar } from '@/components/ui/avatar';

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));
jest.mock('@/features/profile/api', () => ({
  publicProfile: (id: string) => ({ queryKey: ['profile', id], staleTime: Infinity, queryFn: jest.fn() }),
  publicTanidikProfile: (id: string) => ({ queryKey: ['profiles', id, 'tanidik-details'], staleTime: Infinity, queryFn: jest.fn() }),
}));
jest.mock('@/features/catalog/api', () => ({}));
jest.mock('./api', () => ({}));
jest.mock('@/features/catalog/catalog-picker', () => ({ CatalogPicker: () => null }));
jest.mock('@/components/ui/screen', () => ({ Screen: () => null }));
jest.mock('@shopify/flash-list', () => ({ FlashList: () => null }));

it('updates education and Tanıdık markers when a recycled ranking row changes person', async () => {
  const client = new QueryClient({ defaultOptions: { queries: { gcTime: Infinity } } });
  client.setQueryData(['profile', 'first'], { role: 'TANIDIK', educationStatus: 'MEZUN' });
  client.setQueryData(['profiles', 'first', 'tanidik-details'], { activeTanidik: true });
  client.setQueryData(['profile', 'second'], { role: 'MEMBER', educationStatus: 'YKS_ADAYI' });
  let tree!: ReactTestRenderer;
  const row = (id: string) => <QueryClientProvider client={client}><RankedPerson item={{ userId: id, displayName: id }} index={0} /></QueryClientProvider>;
  try {
    await act(async () => { tree = create(row('first')); });
    expect(tree.root.findByType(Avatar).props).toMatchObject({ educationStatus: 'MEZUN', tanidik: true });
    await act(async () => { client.setQueryData(['profiles', 'first', 'tanidik-details'], { activeTanidik: false }); await new Promise(resolve => setTimeout(resolve, 0)); });
    expect(tree.root.findByType(Avatar).props.tanidik).toBe(false);
    await act(async () => tree.update(row('second')));
    expect(tree.root.findByType(Avatar).props).toMatchObject({ educationStatus: 'YKS_ADAYI', tanidik: false });
  } finally {
    if (tree) await act(async () => tree.unmount());
    client.clear();
  }
});
