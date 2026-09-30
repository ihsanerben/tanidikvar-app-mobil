import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import type { ComponentProps } from 'react';
import { FlashList } from '@shopify/flash-list';
import { PagedList } from './paged-list';

jest.mock('@shopify/flash-list', () => ({ FlashList: jest.fn(() => null) }));
jest.mock('./states', () => ({ useOffline: () => false, EmptyState: () => null, Skeleton: () => null, ErrorState: () => null }));
jest.mock('./brand-footer', () => ({ BrandFooter: () => null }));

it('only starts native pull-to-refresh for a pull gesture, not answer-tab loads or like invalidations', async () => {
  let finish!: () => void;
  const refetch = jest.fn(() => new Promise<void>(resolve => { finish = resolve; }));
  const query = { data: { pages: [{ items: [{ id: 'answer' }] }] }, isRefetching: true, isFetching: true, refetch } as unknown as ComponentProps<typeof PagedList>['query'];
  let tree!: ReactTestRenderer;
  await act(async () => { tree = create(<PagedList query={query} renderItem={() => null} maintainPosition={false} />); });
  const props = () => jest.mocked(FlashList).mock.calls.at(-1)![0];
  expect(props().refreshing).toBe(false);
  expect(props().maintainVisibleContentPosition?.disabled).toBe(true);
  await act(async () => { props().onRefresh!(); });
  expect(refetch).toHaveBeenCalledTimes(1);
  expect(props().refreshing).toBe(true);
  await act(async () => { finish(); });
  expect(props().refreshing).toBe(false);
  await act(async () => tree.unmount());
});
