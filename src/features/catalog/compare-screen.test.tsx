import type { PropsWithChildren } from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Share } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { CompareScreen } from './compare-screen';
import { CatalogPicker } from './catalog-picker';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { api } from '@/lib/api/client';
import { ErrorState } from '@/components/ui/states';
import { programDetail, universityDetail, universityStats } from './api';

jest.mock('@/lib/api/client', () => ({ api: { call: jest.fn() } }));
jest.mock('expo-router', () => ({ useLocalSearchParams: jest.fn(), router: { setParams: jest.fn(), replace: jest.fn() } }));
jest.mock('@/components/ui/page', () => ({ Page: ({ children }: PropsWithChildren) => children }));
jest.mock('./catalog-picker', () => ({ CatalogPicker: () => null }));
jest.mock('./program-panels', () => ({ netFields: [] }));
jest.mock('@/components/ui/select', () => ({ Select: () => null }));

const a = '123e4567-e89b-42d3-a456-426614174000';
const b = '123e4567-e89b-42d3-a456-426614174001';
const c = '123e4567-e89b-42d3-a456-426614174002';
it('restores comparison slots from the route, shares the year, and clears a program when its university changes', async () => {
  jest.mocked(useLocalSearchParams).mockReturnValue({mode:'PROGRAM',year:'2024',u1:a,u2:b,p1:a,p2:b});
  const share = jest.spyOn(Share, 'share').mockResolvedValue({ action: Share.sharedAction });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  for (const id of [a, b]) {
    client.setQueryData(universityDetail(id).queryKey, { id, name: `Üniversite ${id}` });
    client.setQueryData(programDetail(id).queryKey, { summary: { id, name: 'Tıp', universityId: id }, options: [] });
  }
  let tree!: ReactTestRenderer;
  try {
    await act(async () => { tree = create(<QueryClientProvider client={client}><CompareScreen /></QueryClientProvider>); });
    expect(tree.root.findAllByType(CatalogPicker)[0].props).toMatchObject({ universityId:a,programName:'Tıp' });
    await act(async () => tree.root.findAllByType(Button).find(node=>node.props.label==='Karşılaştırmayı paylaş')!.props.onPress());
    expect(share).toHaveBeenCalledWith({message:expect.stringContaining('year=2024')});
    expect(share).toHaveBeenCalledWith({message:expect.stringContaining(`p2=${b}`)});
    await act(async () => tree.root.findAllByType(CatalogPicker)[0].props.onUniversity({id:c,name:'Yeni üniversite'}));
    expect(router.setParams).toHaveBeenCalledWith({u1:c,p1:''});
  } finally {
    if (tree) await act(async () => tree.unmount());
    client.clear(); share.mockRestore();
  }
});

it('keeps the successful university column when another request fails', async () => {
  jest.mocked(useLocalSearchParams).mockReturnValue({mode:'UNIVERSITY',year:'2024',u1:a,u2:b});
  jest.mocked(api.call).mockRejectedValue(new Error('Network unavailable'));
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  for (const id of [a,b]) client.setQueryData(universityDetail(id).queryKey, {id,name:id});
  client.setQueryData(universityStats(a).queryKey, {programCount:0,yearly:[{year:2024,quota:123},{year:2025,quota:999}]});
  let tree!: ReactTestRenderer;
  try {
    await act(async () => { tree=create(<QueryClientProvider client={client}><CompareScreen /></QueryClientProvider>); });
    await act(async () => { await new Promise(resolve=>setTimeout(resolve,30)); });
    const table=tree.root.findByType(DataTable);
    expect(table.props.rows).toContainEqual(['Kontenjan','123','Veri yok']);
    expect(table.props.rows).toContainEqual(['Program','0','Veri yok']);
    expect(tree.root.findAllByType(ErrorState)).toHaveLength(1);
  } finally {
    if(tree) await act(async()=>tree.unmount());
    client.clear();
  }
});
it('preserves a known zero academic staff count and distinguishes absent data', async () => {
  jest.mocked(useLocalSearchParams).mockReturnValue({mode:'PROGRAM',year:'2024',u1:a,u2:b,p1:a,p2:b});
  const client=new QueryClient({defaultOptions:{queries:{retry:false,gcTime:Infinity}}});
  for(const id of [a,b]) {
    client.setQueryData(universityDetail(id).queryKey,{id,name:id});
    client.setQueryData(programDetail(id).queryKey,{summary:{id,name:'Tıp',universityId:id},options:[],academicDetails:id===a?[{professorCount:0}]:[]});
  }
  let tree!:ReactTestRenderer;
  try {
    await act(async()=>{tree=create(<QueryClientProvider client={client}><CompareScreen /></QueryClientProvider>);});
    expect(tree.root.findByType(DataTable).props.rows).toContainEqual(['Akademik kadro','0','Veri yok']);
  } finally {
    if(tree) await act(async()=>tree.unmount());
    client.clear();
  }
});
