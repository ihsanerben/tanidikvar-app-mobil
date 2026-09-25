import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { nextPage } from "@/lib/query/pagination";
import { queryClient } from "@/lib/query/query-client";
import type { Schema } from "@/lib/api/types";
import { randomUUID } from "expo-crypto";
export const questionKeys = {
  all: ["questions"] as const,
  detail: (id: string) => ["questions", "detail", id] as const,
};
export const questionList = (
  filters: {
    q?: string;
    universityId?: string;
    departmentId?: string;
    sort?: string;
  } = {},
) =>
  infiniteQueryOptions({
    queryKey: [...questionKeys.all, "list", filters],
    initialPageParam: 0,
    staleTime: 30_000,
    queryFn: ({ pageParam, signal }) =>
      api.call("get", "/api/questions", {
        query: { ...filters, page: pageParam, size: 20 },
        signal,
        authenticated: true,
      }),
    getNextPageParam: nextPage,
  });
export const questionDetail = (id: string) =>
  queryOptions({
    queryKey: questionKeys.detail(id),
    staleTime: 30_000,
    queryFn: ({ signal }) =>
      api.call("get", "/api/questions/{id}", {
        params: { id },
        signal,
        authenticated: true,
      }),
  });
export const answerList = (id: string) =>
  infiniteQueryOptions({
    queryKey: [...questionKeys.detail(id), "answers"],
    initialPageParam: 0,
    staleTime: 30_000,
    queryFn: ({ pageParam, signal }) =>
      api.call("get", "/api/questions/{id}/answers", {
        params: { id },
        query: { page: pageParam, size: 20 },
        signal,
        authenticated: true,
      }),
    getNextPageParam: nextPage,
  });
export const tanidikAnswers = (id: string) =>
  infiniteQueryOptions({
    queryKey: [...questionKeys.detail(id), "tanidik"],
    initialPageParam: 0,
    staleTime: 30_000,
    queryFn: ({ pageParam, signal }) =>
      api.call("get", "/api/questions/{id}/admin-answers", {
        params: { id },
        query: { page: pageParam, size: 20 },
        signal,
        authenticated: true,
      }),
    getNextPageParam: nextPage,
  });
export const commentList = (id: string) =>
  infiniteQueryOptions({
    queryKey: [...questionKeys.all, "comments", id],
    initialPageParam: 0,
    staleTime: 30_000,
    queryFn: ({ pageParam, signal }) =>
      api.call("get", "/api/answers/{id}/comments", {
        params: { id },
        query: { page: pageParam, size: 20 },
        signal,
        authenticated: true,
      }),
    getNextPageParam: nextPage,
  });
export async function refreshQuestions(id?: string) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ["gamification"] }),
    queryClient.invalidateQueries({
      queryKey: id ? questionKeys.detail(id) : questionKeys.all,
    }),
    queryClient.invalidateQueries({ queryKey: [...questionKeys.all, "list"] }),
  ]);
}
export const questionsApi = {
  ownAnswer: (id: string) =>
    api.call("get", "/api/questions/{id}/my-answer", {
      params: { id },
      authenticated: true,
    }),
  ownTanidikAnswer: (id: string) =>
    api.call("get", "/api/questions/{id}/my-admin-answer", {
      params: { id },
      authenticated: true,
    }),
  create: (body: Schema["QuestionCreateRequest"]) =>
    api.post("/api/questions", body, true),
  update: (id: string, body: Schema["QuestionUpdateRequest"]) =>
    api.call("put", "/api/questions/{id}", {
      params: { id },
      body,
      authenticated: true,
    }),
  archive: (id: string, version: number) =>
    api.call("post", "/api/questions/{id}/archive", {
      params: { id },
      body: { version },
      authenticated: true,
    }),
  restore: (id: string, version: number) =>
    api.call("post", "/api/questions/{id}/restore", {
      params: { id },
      body: { version },
      authenticated: true,
    }),
  view: (id: string, openingEventId: string) =>
    api.call("post", "/api/questions/{id}/views", {
      params: { id },
      body: { openingEventId },
      authenticated: true,
    }),
  likeState: (id: string) =>
    api.call("get", "/api/questions/{id}/like", {
      params: { id },
      authenticated: true,
    }),
  like: (id: string, liked: boolean, version: number) =>
    api.call("put", "/api/questions/{id}/like", {
      params: { id },
      body: { liked, version },
      authenticated: true,
    }),
  answer: (
    id: string,
    body: Schema["AnswerCreateRequest"],
    tanidik: boolean,
  ) =>
    tanidik
      ? api.call("post", "/api/questions/{id}/admin-answers", {
          params: { id },
          body,
          authenticated: true,
        })
      : api.call("post", "/api/questions/{id}/answers", {
          params: { id },
          body,
          authenticated: true,
        }),
  answerUpdate: (
    id: string,
    body: Schema["AnswerUpdateRequest"],
    tanidik: boolean,
  ) =>
    tanidik
      ? api.call("put", "/api/admin-answers/{id}", {
          params: { id },
          body,
          authenticated: true,
        })
      : api.call("put", "/api/answers/{id}", {
          params: { id },
          body,
          authenticated: true,
        }),
  answerStatus: (
    id: string,
    body: Schema["AnswerStatusRequest"],
    tanidik: boolean,
  ) =>
    tanidik
      ? api.call("put", "/api/admin-answers/{id}/status", {
          params: { id },
          body,
          authenticated: true,
        })
      : api.call("put", "/api/answers/{id}/status", {
          params: { id },
          body,
          authenticated: true,
        }),
  helpfulState: (id: string) =>
    api.call("get", "/api/answers/{id}/like", {
      params: { id },
      authenticated: true,
    }),
  helpful: (id: string, liked: boolean) =>
    api.call("put", "/api/answers/{id}/like", {
      params: { id },
      body: { liked },
      authenticated: true,
    }),
  best: (id: string, answerId: string) =>
    api.call("put", "/api/questions/{id}/best-answer", {
      params: { id },
      body: { answerId },
      authenticated: true,
    }),
  report: (id: string, reason: string, answer: boolean) =>
    answer
      ? api.call("post", "/api/answers/{id}/reports", {
          params: { id },
          body: { reason },
          authenticated: true,
        })
      : api.call("post", "/api/questions/{id}/reports", {
          params: { id },
          body: { reason },
          authenticated: true,
        }),
  comment: (id: string, body: string) =>
    api.call("post", "/api/answers/{id}/comments", {
      params: { id },
      body: { body },
      authenticated: true,
    }),
  editComment: (
    answer: string,
    comment: string,
    body: string,
    version: number,
  ) =>
    api.call("put", "/api/answers/{answer}/comments/{comment}", {
      params: { answer, comment },
      body: { body, version },
      authenticated: true,
    }),
};
export const newRequestId = randomUUID;
