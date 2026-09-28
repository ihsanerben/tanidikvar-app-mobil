import { QueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { departmentFilterOptions, tagFilterOptions, universityFilterOptions } from './filter-options';

jest.mock('@/lib/api/client', () => ({ api: { call: jest.fn() } }));

describe('filter catalogs', () => {
  let client: QueryClient;
  beforeEach(() => {
    jest.mocked(api.call).mockReset();
    client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  });
  afterEach(() => client.clear());
  it('includes later catalog pages and sorts the complete university choices', async () => {
    jest.mocked(api.call)
      .mockResolvedValueOnce({ items: [{ id: 'z', name: 'Zonguldak' }], totalElements: 2, size: 1 })
      .mockResolvedValueOnce({ items: [{ id: 'a', name: 'Ankara' }], totalElements: 2, size: 1 });
    expect(await client.fetchQuery(universityFilterOptions())).toEqual([{ value: 'a', label: 'Ankara' }, { value: 'z', label: 'Zonguldak' }]);
    expect(api.call).toHaveBeenNthCalledWith(2, 'get', '/api/universities', expect.objectContaining({ query: { page: 1, size: 100 }, signal: expect.any(AbortSignal) }));
  });
  it('uses department ids rather than education/program ids and isolates universities', async () => {
    jest.mocked(api.call).mockResolvedValue({ items: [{ id: 'education', departmentId: 'department', departmentName: 'Tıp' }], totalElements: 1 });
    expect(await client.fetchQuery(departmentFilterOptions('university-a'))).toEqual([{ value: 'department', label: 'Tıp' }]);
    expect(api.call).toHaveBeenCalledWith('get', '/api/universities/{id}/departments', expect.objectContaining({ params: { id: 'university-a' } }));
    expect(departmentFilterOptions('university-a').queryKey).not.toEqual(departmentFilterOptions('university-b').queryKey);
  });
  it('stops when an empty catalog page is returned', async () => {
    jest.mocked(api.call).mockResolvedValue({ items: [], totalElements: 20 });
    expect(await client.fetchQuery(tagFilterOptions())).toEqual([]);
    expect(api.call).toHaveBeenCalledTimes(1);
  });
  it('surfaces a failed later page instead of silently offering an incomplete catalog', async () => {
    jest.mocked(api.call).mockResolvedValueOnce({ items: [{ id: 'a', name: 'Ankara' }], totalElements: 2 }).mockRejectedValueOnce(new Error('unavailable'));
    await expect(client.fetchQuery(universityFilterOptions())).rejects.toThrow('unavailable');
  });
});
