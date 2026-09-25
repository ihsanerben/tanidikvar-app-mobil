import { z } from "zod";
const optionalUrl = z
  .string()
  .max(2048)
  .refine((value) => {
    if (!value) return true;
    try {
      const url = new URL(value);
      return (
        ["http:", "https:"].includes(url.protocol) &&
        !!url.hostname &&
        !url.username &&
        !url.password &&
        !value.includes("\\")
      );
    } catch {
      return false;
    }
  }, "Geçerli bir http veya https bağlantısı yaz.");
export const profileSchema = z
  .object({
    firstName: z.string().trim().min(1, "Adını yaz.").max(80),
    lastName: z.string().trim().min(1, "Soyadını yaz.").max(80),
    educationStatus: z.enum(["YKS_ADAYI", "UNIVERSITE_OGRENCISI", "MEZUN"]),
    universityId: z.string(),
    programId: z.string(),
    departmentId: z.string(),
    classYear: z.string(),
    graduationYear: z.string(),
    biography: z.string().max(1000),
    occupation: z.string().max(120),
    company: z.string().max(120),
    linkedinUrl: optionalUrl.refine((value) => {
      if (!value) return true;
      try {
        const host = new URL(value).hostname;
        return host === "linkedin.com" || host.endsWith(".linkedin.com");
      } catch {
        return false;
      }
    }, "LinkedIn profil bağlantını yaz."),
    portfolioUrl: optionalUrl,
  })
  .superRefine((value, ctx) => {
    if (value.educationStatus !== "YKS_ADAYI") {
      if (!z.uuid().safeParse(value.universityId).success)
        ctx.addIssue({
          code: "custom",
          path: ["universityId"],
          message: "Üniversite seç.",
        });
      if (
        !z.uuid().safeParse(value.programId).success &&
        !z.uuid().safeParse(value.departmentId).success
      )
        ctx.addIssue({
          code: "custom",
          path: ["programId"],
          message: "Program seç.",
        });
    }
    if (
      value.educationStatus === "UNIVERSITE_OGRENCISI" &&
      value.classYear &&
      !/^[1-8]$/.test(value.classYear)
    )
      ctx.addIssue({
        code: "custom",
        path: ["classYear"],
        message: "Sınıf 1 ile 8 arasında olmalı.",
      });
    if (
      value.educationStatus === "MEZUN" &&
      (!/^\d{4}$/.test(value.graduationYear) ||
        Number(value.graduationYear) < 1900 ||
        Number(value.graduationYear) > new Date().getFullYear())
    )
      ctx.addIssue({
        code: "custom",
        path: ["graduationYear"],
        message: "Geçerli mezuniyet yılını yaz.",
      });
  });
export const applicationSchema = z.object({
  coverLetter: z
    .string()
    .trim()
    .min(20, "En az 20 karakterle kendini tanıt.")
    .max(1000),
});
export const preferenceSchema = z.object({
  inAppEnabled: z.boolean(),
  emailEnabled: z.boolean(),
  questionRoutingEnabled: z.boolean(),
  emailFrequency: z.enum(["IMMEDIATE", "DAILY", "WEEKLY", "NEVER"]),
});
