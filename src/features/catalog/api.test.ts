import { QueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { programList, catalogCities } from './api';
import { catalogParams } from '@/lib/navigation/params';
jest.mock('@/lib/api/client', () => ({ api: { call: jest.fn() } }));

it('sends all independent catalog filters with numeric bounds and cancellation', async () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  jest.mocked(api.call).mockResolvedValue({ items: [], page: 0, size: 20, totalElements: 0 });
  try {
    await client.fetchInfiniteQuery(programList(catalogParams.parse({ programName: 'Tıp', universityName: 'İstanbul', rankFrom: '1', rankTo: '5000', scoreFrom: '400,125', scoreTo: '550', year: '2025', sort: 'SCORE' })));
    expect(api.call).toHaveBeenLastCalledWith('get', '/api/catalog-programs', expect.objectContaining({ query: expect.objectContaining({ programName:'Tıp',universityName:'İstanbul',rankFrom:1,rankTo:5000,scoreFrom:400.125,scoreTo:550,year:2025,sort:'SCORE',page:0 }), signal:expect.any(AbortSignal) }));
    expect(programList({year:'2025'}).queryKey).not.toEqual(programList({year:'2024'}).queryKey);
    jest.mocked(api.call).mockResolvedValue([{label:'İstanbul',count:4}]);
    expect(await client.fetchQuery(catalogCities())).toEqual([{label:'İstanbul',count:4}]);
  } finally { client.clear(); }
});
