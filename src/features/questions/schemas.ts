import { z } from "zod";
export const bodySchema = z.object({
  body: z.string().trim().min(10, "En az 10 karakter yaz.").max(5000),
});
export const commentSchema = z.object({
  body: z.string().trim().min(2, "En az 2 karakter yaz.").max(2000),
});
export const reportSchema = z.object({
  reason: z.string().trim().min(10, "En az 10 karakterle açıkla.").max(1000),
});
export const questionSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(10, "Başlık en az 10 karakter olmalı.")
      .max(200),
    body: z.string().max(5000),
    scope: z.enum(["GENERAL", "UNIVERSITY", "UNIVERSITY_DEPARTMENT"]),
    universityId: z.string(),
    programId: z.string(),
    departmentId: z.string(),
    tagIds: z.array(z.uuid()).max(5),
  })
  .superRefine((value, context) => {
    if (
      value.scope !== "GENERAL" &&
      !z.uuid().safeParse(value.universityId).success
    )
      context.addIssue({
        code: "custom",
        path: ["universityId"],
        message: "Üniversite seç.",
      });
    if (
      value.scope === "UNIVERSITY_DEPARTMENT" &&
      !z.uuid().safeParse(value.programId).success &&
      !z.uuid().safeParse(value.departmentId).success
    )
      context.addIssue({
        code: "custom",
        path: ["programId"],
        message: "Program seç.",
      });
  });
