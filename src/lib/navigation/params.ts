import { z } from "zod";
export const idParams = z.object({ id: z.uuid() });
export const numericFilter = (value?: string) => value ? Number(value.replace(',', '.')) : undefined;
const rankFilter = z.string().regex(/^(?:[1-9]\d{0,9})?$/, 'Pozitif bir sıra gir.').refine(value => !value || Number(value) <= 2147483647, 'Sıra çok büyük.').default('');
const scoreFilter = z.string().regex(/^(?:\d{1,6}(?:[.,]\d{1,3})?)?$/, 'Geçerli bir puan gir.').default('');
export const catalogParams = z.object({
  kind: z.enum(["universities", "programs"]).default("universities"),
  q: z.string().max(150).default(""),
  city: z.string().max(100).default(""),
  institutionType: z
    .enum(["", "DEVLET", "VAKIF", "KKTC", "YURT_DISI"])
    .default(""),
  universityId: z.uuid().optional(),
  degreeLevel: z.enum(["", "LISANS", "ONLISANS"]).default(""),
  programName: z.string().trim().max(100).default(''),
  universityName: z.string().trim().max(100).default(''),
  rankFrom: rankFilter,
  rankTo: rankFilter,
  scoreFrom: scoreFilter,
  scoreTo: scoreFilter,
  year: z.string().regex(/^(?:\d{4})?$/).refine(value => !value || (Number(value) >= 2015 && Number(value) <= new Date().getFullYear()), 'Geçerli bir yıl seç.').default(''),
  sort: z.enum(["NAME", "RANK", "SCORE", "QUOTA"]).default("RANK"),
  scoreType: z.enum(["", "SAY", "EA", "SÖZ", "DİL", "TYT"]).default(""),
}).superRefine((value, ctx) => {
  for (const [from, to] of [['rankFrom', 'rankTo'], ['scoreFrom', 'scoreTo']] as const) {
    if (value[from] && value[to] && numericFilter(value[from])! > numericFilter(value[to])!)
      ctx.addIssue({ code: 'custom', path: [to], message: 'Üst sınır alt sınırdan küçük olamaz.' });
  }
});
export const questionParams = z.object({
  q: z.string().max(150).default(""),
  universityId: z.uuid().optional(),
  departmentId: z.uuid().optional(),
  scope: z.enum(['', 'GENERAL', 'UNIVERSITY', 'UNIVERSITY_DEPARTMENT']).default(''),
  tagId: z.uuid().optional(),
  city: z.string().max(100).default(''),
  sort: z.enum(["NEWEST", "OLDEST", "MOST_VIEWED", "MOST_LIKED", "MOST_COMMENTED"]).default("NEWEST"),
  period: z.enum(['', 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY', 'ALL_TIME']).default(''),
});
export const creationParams = z.object({
  universityId: z.uuid().optional(),
  programId: z.uuid().optional(),
  departmentId: z.uuid().optional(),
});
export function numberText(value?: number | null) {
  return value == null
    ? "—"
    : value.toLocaleString("tr-TR", { maximumFractionDigits: 2 });
}
export function sharePath(
  kind: "sorular" | "universiteler" | "programlar" | "profil",
  id: string,
  title = "icerik",
) {
  const base = {
    sorular: "soru",
    universiteler: "universite",
    programlar: "program",
    profil: "profiles",
  }[kind];
  const uuid = z.uuid().parse(id);
  const slug =
    title
      .toLocaleLowerCase("tr-TR")
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/ı/g, "i")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "icerik";
  const segment =
    kind === "universiteler"
      ? `${slug}--${uuid}`
      : kind === "sorular"
        ? `${slug}-${uuid}`
        : uuid;
  return `https://tanidikvar.com.tr/${base}/${segment}`;
}
export const communityParams = z.object({
  universityId: z.uuid(),
  departmentId: z.uuid().optional(),
  programId: z.uuid().optional(),
  view: z.enum(["questions", "people", "evaluations"]).default("questions"),
});

export const peopleParams=z.object({ q:z.string().max(150).default(""),universityId:z.uuid().optional(),departmentId:z.uuid().optional(),educationStatus:z.enum(["","UNIVERSITE_OGRENCISI","MEZUN"]).default(""),classYear:z.enum(["","1","2","3","4","5","6"]).default(""),expertise:z.string().max(80).default("") });
