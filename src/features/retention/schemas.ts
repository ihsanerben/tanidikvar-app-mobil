import { z } from "zod";
export const collectionParams = z.object({
  kind: z.enum(["follows", "saved"]).default("follows"),
});
export const leaderboardParams = z
  .object({
    period: z
      .enum(["ALL_TIME", "DAILY", "WEEKLY", "MONTHLY", "YEARLY"])
      .default("ALL_TIME"),
    universityId: z.uuid().optional(),
    departmentId: z.uuid().optional(),
  })
  .refine(
    (value) => !value.departmentId || !!value.universityId,
    "Bölüm için üniversite seç.",
  );
export const reportParams = z.object({
  id: z.uuid(),
  year: z
    .string()
    .regex(/^\d{4}$/)
    .refine(
      (value) =>
        Number(value) >= 2020 && Number(value) <= new Date().getFullYear(),
    )
    .default(() => String(new Date().getFullYear())),
});
export const showcaseSchema = z.object({
  achievementIds: z
    .array(z.uuid())
    .max(3, "En fazla üç rozet seç.")
    .refine(
      (ids) => new Set(ids).size === ids.length,
      "Aynı rozeti iki kez seçemezsin.",
    ),
});
export type CollectionKind = z.infer<typeof collectionParams>["kind"];
export type LeaderboardFilters = z.infer<typeof leaderboardParams>;
