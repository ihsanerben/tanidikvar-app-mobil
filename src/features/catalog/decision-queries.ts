import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { nextPage } from '@/lib/query/pagination';

export const decisionKeys = {
  all: ['catalog', 'decisions'] as const,
  context: (universityId: string, programId?: string) => ['catalog', 'decisions', universityId, programId] as const,
};

export const summaryQuery = (universityId: string, programId?: string) => queryOptions({
  queryKey: [...decisionKeys.context(universityId, programId), 'summary'],
  staleTime: 30_000,
  queryFn: ({ signal }) => api.call('get', '/api/evaluations/summary', { query: { universityId, programId }, signal }),
});

export const metricsQuery = (universityId: string, programId?: string) => queryOptions({
  queryKey: [...decisionKeys.context(universityId, programId), 'metrics'],
  staleTime: 30_000,
  queryFn: ({ signal }) => api.call('get', '/api/context-metrics', { query: { universityId, programId }, signal }),
});

export const sentimentsQuery = (universityId: string, programId?: string) => queryOptions({
  queryKey: [...decisionKeys.context(universityId, programId), 'sentiments'],
  staleTime: 30_000,
  queryFn: ({ signal }) => api.call('get', '/api/experience-sentiments', { query: { universityId, programId }, signal }),
});

export const careerQuery = (universityId: string, programId: string) => queryOptions({
  queryKey: [...decisionKeys.context(universityId, programId), 'career'],
  staleTime: 30_000,
  queryFn: ({ signal }) => api.call('get', '/api/career-outcomes', { query: { universityId, programId }, signal }),
});

export const evaluationsQuery = (universityId: string, programId?: string) => infiniteQueryOptions({
  queryKey: [...decisionKeys.context(universityId, programId), 'evaluations'],
  staleTime: 30_000,
  initialPageParam: 0,
  queryFn: ({ pageParam, signal }) => api.call('get', '/api/evaluations', { query: { universityId, programId, page: pageParam, size: 20 }, signal }),
  getNextPageParam: nextPage,
});

export const pollsQuery = (universityId: string, programId?: string) => infiniteQueryOptions({
  queryKey: [...decisionKeys.context(universityId, programId), 'polls'],
  staleTime: 30_000,
  initialPageParam: 0,
  queryFn: ({ pageParam, signal }) => api.call('get', '/api/polls', { query: { universityId, programId, page: pageParam, size: 20 }, signal }),
  getNextPageParam: nextPage,
});

export const experiencesQuery = (universityId: string, programId?: string) => infiniteQueryOptions({
  queryKey: [...decisionKeys.context(universityId, programId), 'experiences'],
  staleTime: 30_000,
  initialPageParam: 0,
  queryFn: ({ pageParam, signal }) => api.call('get', '/api/experiences', { query: { universityId, programId, page: pageParam, size: 20 }, signal }),
  getNextPageParam: nextPage,
});

