import { queryOptions, infiniteQueryOptions } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { queryClient } from "@/lib/query/query-client";
import { nextPage } from "@/lib/query/pagination";
import { authKeys } from "@/features/auth/api";
import type { Schema } from "@/lib/api/types";
import { createApiClient } from "../../../packages/api-client/client";
import { tokenManager } from "@/lib/auth/token-manager";
import { env } from "@/lib/env";
import type { ContributionSummary } from "./profile-identity-card";

const summaryClient = createApiClient(env.EXPO_PUBLIC_API_URL, tokenManager);
export const profileKeys = {
  me: ["profile", "me"] as const,
  public: (id: string) => ["profile", id] as const,
  applications: ["profile", "applications"] as const,
  preferences: ["profile", "preferences"] as const,
};
export const myProfile = () =>
  queryOptions({
    queryKey: profileKeys.me,
    staleTime: 30_000,
    queryFn: ({ signal }) =>
      api.call("get", "/api/me/profile", { authenticated: true, signal }),
  });
export const publicProfile = (id: string) =>
  queryOptions({
    queryKey: profileKeys.public(id),
    staleTime: 30_000,
    queryFn: ({ signal }) =>
      api.call("get", "/api/profiles/{id}", { params: { id }, signal }),
  });
export const publicContributionSummary = (id: string) =>
  queryOptions({
    queryKey: [...profileKeys.public(id), "contribution-summary"],
    staleTime: 30_000,
    queryFn: ({ signal }) => summaryClient.request<ContributionSummary>(`/api/profiles/${id}/contribution-summary`, { method: "GET", signal }),
  });
export const publicTanidikProfile = (id: string) =>
  queryOptions({
    queryKey: ["profiles", id, "tanidik-details"],
    staleTime: 30_000,
    queryFn: ({ signal }) =>
      api.call("get", "/api/tanidiklar/{id}", { params: { id }, signal }),
  });
export const applications = () =>
  infiniteQueryOptions({
    queryKey: profileKeys.applications,
    staleTime: 30_000,
    initialPageParam: 0,
    queryFn: ({ pageParam, signal }) =>
      api.call("get", "/api/me/tanidik-applications", {
        query: { page: pageParam, size: 20 },
        signal,
        authenticated: true,
      }),
    getNextPageParam: nextPage,
  });
export const preferences = () =>
  queryOptions({
    queryKey: profileKeys.preferences,
    staleTime: 30_000,
    queryFn: ({ signal }) =>
      api.call("get", "/api/me/notification-preferences", {
        authenticated: true,
        signal,
      }),
  });
export const publicHistory = (id: string) =>
  infiniteQueryOptions({
    queryKey: [...profileKeys.public(id), "history"],
    staleTime: 30_000,
    initialPageParam: 0,
    queryFn: ({ pageParam, signal }) =>
      api.call("get", "/api/profiles/{id}/comments/community", {
        params: { id },
        query: { page: pageParam, size: 20 },
        signal,
      }),
    getNextPageParam: nextPage,
  });
export const publicTanidikHistory = (id: string) =>
  infiniteQueryOptions({
    queryKey: [...profileKeys.public(id), "tanidik-history"],
    staleTime: 30_000,
    initialPageParam: 0,
    queryFn: ({ pageParam, signal }) =>
      api.call("get", "/api/profiles/{id}/comments/admin", {
        params: { id },
        query: { page: pageParam, size: 20 },
        signal,
      }),
    getNextPageParam: nextPage,
  });
export const profileApi = {
  save: async (body: Schema["ProfileRequest"]) => {
    const result = await api.call("put", "/api/me/profile", {
      body,
      authenticated: true,
    });
    await queryClient.cancelQueries({ queryKey: profileKeys.me });
    queryClient.setQueryData(profileKeys.me, result);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: profileKeys.me }),
      queryClient.invalidateQueries({ queryKey: authKeys.all }),
    ]);
    return result;
  },
  apply: (body: Schema["ApplicationSubmission"]) =>
    api.post("/api/me/tanidik-applications", body, true),
  preferences: async (body: Schema["NotificationPreferenceRequest"]) => {
    const result = await api.call("put", "/api/me/notification-preferences", {
      body,
      authenticated: true,
    });
    queryClient.setQueryData(profileKeys.preferences, result);
    return result;
  },
};
