import { queryOptions } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import type { Schema } from '@/lib/api/types';
import { catalogKeys } from './api';

async function collect<T>(load: (page: number) => Promise<{ items?: T[]; totalElements?: number; size?: number }>) {
  const items: T[] = [];
  for (let page = 0; ; page++) {
    const result = await load(page);
    items.push(...(result.items ?? []));
    if (!result.items?.length || items.length >= (result.totalElements ?? items.length)) return items;
  }
}
const sort = (options: { value: string; label: string }[]) => options.sort((a, b) => a.label.localeCompare(b.label, 'tr'));

export const universityFilterOptions = () => queryOptions({
  queryKey: [...catalogKeys.all, 'filter-universities'], staleTime: 300_000,
  queryFn: async ({ signal }) => sort((await collect<Schema['UniversityResponse']>(page => api.call('get', '/api/universities', { query: { page, size: 100 }, signal })))
    .filter(item => item.id && item.name).map(item => ({ value: item.id!, label: item.name! }))),
});
export const departmentFilterOptions = (id: string) => queryOptions({
  queryKey: [...catalogKeys.university(id), 'filter-departments'], staleTime: 300_000,
  queryFn: async ({ signal }) => sort((await collect<Schema['EducationResponse']>(page => api.call('get', '/api/universities/{id}/departments', { params: { id }, query: { page, size: 100 }, signal })))
    .filter(item => item.departmentId && item.departmentName).map(item => ({ value: item.departmentId!, label: item.departmentName! }))),
});
export const tagFilterOptions = () => queryOptions({
  queryKey: [...catalogKeys.all, 'filter-tags'], staleTime: 300_000,
  queryFn: async ({ signal }) => sort((await collect<Schema['CatalogResponse']>(page => api.call('get', '/api/tags', { query: { page, size: 100 }, signal })))
    .filter(item => item.id && item.name).map(item => ({ value: item.id!, label: item.name! }))),
});
