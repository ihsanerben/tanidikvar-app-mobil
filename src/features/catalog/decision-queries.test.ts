import { InfiniteQueryObserver, QueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { metricsQuery, pollsQuery, summaryQuery } from './decision-queries';

jest.mock('@/lib/api/client', () => ({ api: { call: jest.fn() } }));
const call = jest.mocked(api.call);
let client: QueryClient;
beforeEach(() => {
  call.mockReset();
  client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
});
afterEach(() => client.clear());

it('keeps successful summary data when an independent metrics request fails', async () => {
  call.mockResolvedValueOnce({ evaluationCount: 7, averageRating: 4 });
  await client.fetchQuery(summaryQuery('university'));
  call.mockRejectedValueOnce(new Error('metrics unavailable'));
  await expect(client.fetchQuery(metricsQuery('university'))).rejects.toThrow('metrics unavailable');
  expect(client.getQueryData(summaryQuery('university').queryKey)).toEqual({ evaluationCount: 7, averageRating: 4 });
});

it('loads the next poll page and stops at the authoritative total', async () => {
  call.mockResolvedValueOnce({ items: [{ id: 'first' }], page: 0, size: 20, totalElements: 21 });
  const observer = new InfiniteQueryObserver(client, pollsQuery('university', 'program'));
  await observer.refetch();
  expect(observer.getCurrentResult().hasNextPage).toBe(true);
  call.mockResolvedValueOnce({ items: [{ id: 'last' }], page: 1, size: 20, totalElements: 21 });
  await observer.fetchNextPage();
  expect(call).toHaveBeenLastCalledWith('get', '/api/polls', {
    query: { universityId: 'university', programId: 'program', page: 1, size: 20 }, signal: expect.any(AbortSignal),
  });
  expect(observer.getCurrentResult().data?.pages.flatMap(page => page.items)).toEqual([{ id: 'first' }, { id: 'last' }]);
  expect(observer.getCurrentResult().hasNextPage).toBe(false);
  observer.destroy();
});

it('does not reuse another program or university summary', async () => {
  client.setQueryData(summaryQuery('university', 'first').queryKey, { evaluationCount: 8 });
  expect(client.getQueryData(summaryQuery('university', 'second').queryKey)).toBeUndefined();
  expect(client.getQueryData(summaryQuery('other', 'first').queryKey)).toBeUndefined();
});
