import { z } from 'zod';
import type { Schema } from '@/lib/api/types';

const selectionId = z.union([z.uuid(), z.literal('')]).default('');
export const comparisonParams = z.object({
  mode: z.enum(['UNIVERSITY', 'PROGRAM']).default('UNIVERSITY'),
  year: z.string().regex(/^\d{4}$/).refine(value => Number(value) >= 2015 && Number(value) <= new Date().getFullYear()).default(() => String(new Date().getFullYear())),
  u1: selectionId, u2: selectionId, u3: selectionId,
  p1: selectionId, p2: selectionId, p3: selectionId,
}).strict();
export type ComparisonParams = z.infer<typeof comparisonParams>;
export function canCompare(params: ComparisonParams) {
  const ids = params.mode === 'PROGRAM' ? [params.p1, params.p2, params.p3] : [params.u1, params.u2, params.u3];
  const complete = !!params.u1 && !!params.u2 && !!ids[0] && !!ids[1]
    && (params.mode !== 'PROGRAM' || !!params.u3 === !!params.p3);
  const selected = ids.filter(Boolean);
  return complete && new Set(selected).size === selected.length;
}
export function comparisonWebUrl(params: ComparisonParams) {
  const validated = comparisonParams.parse(params);
  const query = new URLSearchParams({ mode: validated.mode, year: validated.year });
  for (const index of [1, 2, 3] as const) {
    if (validated[`u${index}`]) query.set(`u${index}`, validated[`u${index}`]);
    if (validated.mode === 'PROGRAM' && validated[`p${index}`]) query.set(`p${index}`, validated[`p${index}`]);
  }
  return `https://tanidikvar.com.tr/karsilastir?${query}`;
}
export function comparisonOption(detail: Schema['ProgramDetailResponse'], year: number) {
  const options = detail.options ?? [];
  const forYear = options.filter(option => option.statistics?.some(stat => stat.year === year));
  const ranked = forYear.filter(option => option.statistics?.some(stat => stat.year === year && stat.successRank != null));
  return [...(ranked.length ? ranked : forYear.length ? forYear : options)].sort((a, b) => {
    const rank = (option: typeof a) => option.statistics?.find(stat => stat.year === year)?.successRank ?? Number.MAX_SAFE_INTEGER;
    return rank(a) - rank(b);
  })[0];
}
