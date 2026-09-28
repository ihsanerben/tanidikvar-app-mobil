import { isSafeDestination } from './destination';

const routes: Record<string, { path: string; defaults?: Record<string, string>; names?: Record<string, string> }> = {
  '/sorular': { path: '/', names: { sirala: 'sort', cevap: 'answered', dogrulanmis: 'verifiedAnswer' } },
  '/populer': { path: '/', defaults: { period: 'ALL_TIME' }, names: { donem: 'period' } },
  '/universiteler': { path: '/kesfet', defaults: { kind: 'universities' } },
  '/programlar': { path: '/kesfet', defaults: { kind: 'programs' }, names: { tur: 'institutionType', duzey: 'degreeLevel', puan: 'scoreType', yil: 'year', sirala: 'sort', siraMin: 'rankFrom', siraMax: 'rankTo', puanMin: 'scoreFrom', puanMax: 'scoreTo' } },
  '/tanidiklar': { path: '/people' }, '/arama': { path: '/search' },
  '/siralama': { path: '/leaderboard' }, '/karsilastir': { path: '/compare' },
  '/istatistikler': { path: '/statistics' }, '/hakkimizda': { path: '/about' },
  '/durum': { path: '/status' }, '/soru-sor': { path: '/questions/new' },
};

/** Return undefined for a native path; null for a recognized but unsafe web link. */
export function webDestination(path: string, search: string): string | null | undefined {
  const route = routes[path];
  if (!route) return undefined;
  const query = new URLSearchParams(route.defaults);
  const seen = new Set<string>();
  for (const [key, raw] of new URLSearchParams(search)) {
    const name = route.names?.[key] ?? key;
    if (seen.has(name) || name === 'kind') return null;
    seen.add(name);
    let value = raw;
    if (key === 'cevap') value = raw === 'answered' ? 'true' : raw === 'unanswered' ? 'false' : raw;
    if (key === 'dogrulanmis') value = raw === 'yes' ? 'true' : raw === 'no' ? 'false' : raw;
    if (value || (!['universityId', 'departmentId', 'tagId'].includes(name) && !(name in (route.defaults ?? {})))) query.set(name, value);
  }
  const destination = route.path + (query.size ? `?${query}` : '');
  return isSafeDestination(destination) ? destination : null;
}
