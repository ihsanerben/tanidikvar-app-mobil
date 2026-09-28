import {
  infiniteQueryOptions,
  queryOptions,
  type QueryClient,
} from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { nextPage } from "@/lib/query/pagination";
import type { CollectionKind, LeaderboardFilters } from "./schemas";
export const retentionKeys = {
  collection: (kind: CollectionKind) => ["retention", kind] as const,
  list: (kind: CollectionKind) => ["retention", kind, "list"] as const,
  state: (kind: CollectionKind, id: string) =>
    ["retention", kind, "state", id] as const,
  score: (id: string) => ["gamification", "score", id] as const,
  achievements: (id: string) => ["gamification", "achievements", id] as const,
  report: (id: string, year: number) =>
    ["gamification", "report", id, year] as const,
  leaderboard: (filters: LeaderboardFilters) =>
    ["gamification", "leaderboard", filters] as const,
};
export const collectionPage = (
  kind: CollectionKind,
  page: number,
  size: number,
  signal?: AbortSignal,
  targetType?: "UNIVERSITY" | "PROGRAM",
) =>
  api.call("get", kind === "follows" ? "/api/me/follows" : "/api/me/saved", {
    query: { page, size, ...(kind === "follows" ? {targetType} : {}) },
    authenticated: true,
    signal,
  });
export const collectionList = (kind: CollectionKind, targetType?: "UNIVERSITY" | "PROGRAM") =>
  infiniteQueryOptions({
    queryKey: [...retentionKeys.list(kind),targetType],
    initialPageParam: 0,
    staleTime: 30_000,
    queryFn: ({ pageParam, signal }) =>
      collectionPage(kind, pageParam, 20, signal,targetType),
    getNextPageParam: nextPage,
  });
// The existing contract has no target-state endpoint. Scan paginated results until found or exhausted;
// an unloaded page must never be interpreted as "not saved/followed".
export async function findRetentionState(
  kind: CollectionKind,
  id: string,
  signal?: AbortSignal,
  targetType: "UNIVERSITY" | "PROGRAM" = "UNIVERSITY",
) {
  if(kind === "follows") {
    const result=await api.call("get","/api/me/follows",{query:{targetType,targetId:id,size:1},authenticated:true,signal});
    return (result.totalElements ?? 0)>0;
  }
  let page = 0;
  for (;;) {
    const result = await collectionPage(kind, page, 100, signal);
    const item = result.items?.find(
      (item) =>
        item.targetId === id &&
        item.targetType === "QUESTION",
    );
    if (item) return item.active === true;
    if ((page + 1) * (result.size ?? 100) >= (result.totalElements ?? 0))
      return false;
    page += 1;
  }
}
export const retentionState = (kind: CollectionKind, id: string, targetType: "UNIVERSITY" | "PROGRAM" = "UNIVERSITY") =>
  queryOptions({
    queryKey: retentionKeys.state(kind, id),
    staleTime: 30_000,
    queryFn: ({ signal }) => findRetentionState(kind, id, signal,targetType),
  });
export const setRetention = (
  kind: CollectionKind,
  id: string,
  active: boolean,
  targetType: "UNIVERSITY" | "PROGRAM" = "UNIVERSITY",
) =>
  api.call("put", kind === "follows" ? "/api/me/follows" : "/api/me/saved", {
    body: {
      targetType: kind === "follows" ? targetType : "QUESTION",
      targetId: id,
      active,
    },
    authenticated: true,
  });
export async function refreshRetention(
  client: QueryClient,
  kind: CollectionKind,
  id: string,
  active: boolean,
) {
  await client.cancelQueries({ queryKey: retentionKeys.state(kind, id) });
  client.setQueryData(retentionKeys.state(kind, id), active);
  await client.invalidateQueries({ queryKey: retentionKeys.list(kind) });
}
export const scoreQuery = (id: string) =>
  queryOptions({
    queryKey: retentionKeys.score(id),
    staleTime: 30_000,
    queryFn: ({ signal }) =>
      api.call("get", "/api/gamification/profiles/{id}", {
        params: { id },
        signal,
      }),
  });
export const achievementsQuery = (id: string) =>
  queryOptions({
    queryKey: retentionKeys.achievements(id),
    staleTime: 30_000,
    queryFn: ({ signal }) =>
      api.call("get", "/api/gamification/profiles/{id}/achievements", {
        params: { id },
        signal,
      }),
  });
export const reportQuery = (id: string, year: number) =>
  queryOptions({
    queryKey: retentionKeys.report(id, year),
    staleTime: 30_000,
    queryFn: ({ signal }) =>
      api.call("get", "/api/gamification/profiles/{id}/annual-report", {
        params: { id },
        query: { year },
        signal,
      }),
  });
export const leaderboardQuery = (filters: LeaderboardFilters) =>
  queryOptions({
    queryKey: retentionKeys.leaderboard(filters),
    staleTime: 30_000,
    queryFn: ({ signal }) =>
      api.call("get", "/api/gamification/leaderboard", {
        query: { ...filters, size: 100 },
        signal,
      }),
  });
export const setShowcase = (achievementIds: string[]) =>
  api.call("put", "/api/me/gamification/showcase", {
    body: { achievementIds },
    authenticated: true,
  });

export const achievementCatalogQuery = () => queryOptions({queryKey:['gamification','catalog'],staleTime:300_000,queryFn:({signal})=>api.call('get','/api/gamification/achievements',{signal})});
