import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { nextPage } from "@/lib/query/pagination";
import type { z } from "zod";
import { catalogParams } from "@/lib/navigation/params";
export const catalogKeys = {
  all: ["catalog"] as const,
  university: (id: string) => ["catalog", "university", id] as const,
  program: (id: string) => ["catalog", "program", id] as const,
};
export function universityList(
  filters: Partial<z.infer<typeof catalogParams>>,
) {
  return infiniteQueryOptions({
    queryKey: [...catalogKeys.all, "universities", filters],
    initialPageParam: 0,
    staleTime: 60_000,
    queryFn: ({ pageParam, signal }) =>
      api.call("get", "/api/universities", {
        query: {
          q: filters.q,
          city: filters.city,
          institutionType: filters.institutionType,
          page: pageParam,
          size: 20,
        },
        signal,
      }),
    getNextPageParam: nextPage,
  });
}
export function programList(filters: Partial<z.infer<typeof catalogParams>>) {
  return infiniteQueryOptions({
    queryKey: [...catalogKeys.all, "programs", filters],
    initialPageParam: 0,
    staleTime: 60_000,
    queryFn: ({ pageParam, signal }) =>
      api.call("get", "/api/catalog-programs", {
        query: {
          q: filters.q,
          city: filters.city,
          universityId: filters.universityId,
          institutionType: filters.institutionType,
          scoreType: filters.scoreType,
          page: pageParam,
          size: 20,
        },
        signal,
      }),
    getNextPageParam: nextPage,
  });
}
export const universityDetail = (id: string) =>
  queryOptions({
    queryKey: catalogKeys.university(id),
    staleTime: 60_000,
    queryFn: ({ signal }) =>
      api.call("get", "/api/universities/{id}", { params: { id }, signal }),
  });
export const programDetail = (id: string) =>
  queryOptions({
    queryKey: catalogKeys.program(id),
    staleTime: 60_000,
    queryFn: ({ signal }) =>
      api.call("get", "/api/catalog-programs/{id}", { params: { id }, signal }),
  });
export const universityStats = (id: string) =>
  queryOptions({
    queryKey: [...catalogKeys.university(id), "statistics"],
    staleTime: 60_000,
    queryFn: ({ signal }) =>
      api.call("get", "/api/universities/{id}/catalog-statistics", {
        params: { id },
        signal,
      }),
  });
export function peopleList(universityId?: string, departmentId?: string, q?: string) {
  return infiniteQueryOptions({
    queryKey: [...catalogKeys.all, "people", universityId, departmentId, q],
    staleTime: 30_000,
    initialPageParam: 0,
    queryFn: ({ pageParam, signal }) =>
      api.call("get", "/api/tanidiklar", {
        query: { universityId, departmentId, q, page: pageParam, size: 20 },
        signal,
      }),
    getNextPageParam: nextPage,
  });
}
export function evaluationList(universityId: string, programId?: string) {
  return infiniteQueryOptions({
    queryKey: [...catalogKeys.all, "evaluations", universityId, programId],
    staleTime: 30_000,
    initialPageParam: 0,
    queryFn: ({ pageParam, signal }) =>
      api.call("get", "/api/evaluations", {
        query: { universityId, programId, page: pageParam, size: 20 },
        signal,
      }),
    getNextPageParam: nextPage,
  });
}
