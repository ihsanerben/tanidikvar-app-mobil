import type { Href } from "expo-router";
import { z } from "zod";
import {
  catalogParams,
  questionParams,
  creationParams,
  communityParams,
} from "./params";
import {
  collectionParams,
  leaderboardParams,
  reportParams,
} from "@/features/retention/schemas";
export function isSafeDestination(value: string) {
  if (
    !value.startsWith("/") ||
    value.startsWith("//") ||
    /[\\#]/.test(value) ||
    value.length > 1500
  )
    return false;
  const [path, search = ""] = value.split("?");
  if (value.split("?").length > 2 || path.includes("%")) return false;
  const entries = [...new URLSearchParams(search).entries()];
  if (new Set(entries.map(([key]) => key)).size !== entries.length)
    return false;
  const query = Object.fromEntries(entries);
  if (path === "/") return questionParams.strict().safeParse(query).success;
  if (path === "/kesfet")
    return catalogParams.strict().safeParse(query).success;
  if (path === '/search') return z.object({ q: z.string().max(150).optional(), kind: z.enum(['questions','universities','programs','people']).optional() }).strict().safeParse(query).success;
  if (path === '/people') return z.object({ q: z.string().max(150).optional(), universityId: z.uuid().optional(), departmentId: z.uuid().optional() }).strict().safeParse(query).success;
  if (path === '/my-questions') return z.object({ status: z.enum(['ACTIVE','ARCHIVED']).optional() }).strict().safeParse(query).success;
  if (path === '/my-comments') return z.object({ kind: z.enum(['tanidik','community','anonymous']).optional(), scope: z.enum(['GENERAL','UNIVERSITY','UNIVERSITY_DEPARTMENT']).optional() }).strict().safeParse(query).success;
  if (path === "/community")
    return communityParams.strict().safeParse(query).success;
  if (path === "/questions/new")
    return creationParams.strict().safeParse(query).success;
  if (path === "/collection")
    return collectionParams.strict().safeParse(query).success;
  if (path === "/leaderboard")
    return leaderboardParams.strict().safeParse(query).success;
  const report = path.match(/^\/annual-report\/([^/]+)$/);
  if (report)
    return (
      reportParams.strict().safeParse({ ...query, id: report[1] }).success &&
      !("id" in query)
    );
  const achievements = path.match(/^\/achievements\/([^/]+)$/);
  if (achievements)
    return !search && z.uuid().safeParse(achievements[1]).success;
  if (search) return false;
  if (
    [
      "/profil",
      "/bildirimler",
      "/account",
      "/profile/edit",
      "/profile/application",
      "/profile/preferences",
      "/profile/privacy",
      "/close-account",
      '/about',
      '/status',
      '/compare',
      '/statistics',
    ].includes(path)
  )
    return true;
  const match =
    path.match(
      /^\/(?:universities|programs|profiles|questions)\/([^/]+)(?:\/edit)?$/,
    ) || path.match(/^\/answers\/([^/]+)\/comments$/);
  return (
    !!match &&
    z.uuid().safeParse(match[1]).success &&
    (!path.endsWith("/edit") || path.startsWith("/questions/"))
  );
}
export const safeDestinationSchema = z.string().refine(isSafeDestination);
export function destinationHref(value: unknown): Href {
  const result = safeDestinationSchema.safeParse(value);
  // Cast only after validating the entire route, UUIDs and query allowlist.
  return result.success ? (result.data as Href) : "/";
}
export function preserveDestination(
  path: string,
  params: Record<string, string | string[] | undefined>,
) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params))
    if (key !== "id" && typeof value === "string") search.set(key, value);
  const result = path + (search.size ? "?" + search.toString() : "");
  return isSafeDestination(result)
    ? result
    : isSafeDestination(path)
      ? path
      : "/";
}
