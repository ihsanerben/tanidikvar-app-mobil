import { z } from 'zod';
import { isSafeDestination } from './destination';

const inputSchema = z.string().min(1).max(2048);
const actionSchema = z.object({ token: z.string().regex(/^[A-Za-z0-9_-]{43}$/).optional() }).strict();
const hosts = new Set(['tanidikvar.com.tr', 'www.tanidikvar.com.tr']);

/** Normalize trusted web URLs and native schemes before Router sees external parameters. */
export function incomingLink(input: unknown, trustedHost?: string): string | null {
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success || /[\\\u0000-\u0020]/.test(parsed.data) || /(?:^|\/)\.\.?(?:\/|$)/.test(parsed.data) || /%2e|%2f|%5c/i.test(parsed.data)) return null;
  let path = parsed.data;
  try {
    if (!path.startsWith('/')) {
      const url = new URL(path);
      if (url.username || url.password || url.hash) return null;
      if (['tanidikvar:', 'tanidikvar-dev:', 'tanidikvar-preview:'].includes(url.protocol)) {
        if (url.port) return null;
        path = url.host ? '/' + url.host + url.pathname : url.pathname;
        if (path.endsWith('/') && path !== '/') path = path.slice(0, -1);
        path += url.search;
      } else {
        if (url.protocol !== 'https:' || !(hosts.has(url.hostname) || (trustedHost && url.hostname === trustedHost)) || url.port) return null;
        path = url.pathname + url.search;
      }
    }
    if (path.includes('#') || path.includes('\\') || path.startsWith('//')) return null;
    const [pathname, search = ''] = path.split('?');
    if (path.split('?').length > 2) return null;
    const canonical = pathname.match(/^\/(soru|universite|program)\/([a-z0-9-]+)$/);
    if (canonical && !search) {
      const id = canonical[2].slice(-36);
      if (!z.uuid().safeParse(id).success) return null;
      const prefix = canonical[2].slice(0, -36);
      if (prefix && !prefix.endsWith('-')) return null;
      const kind = { soru: 'questions', universite: 'universities', program: 'programs' }[canonical[1]];
      return `/${kind}/${id}`;
    }
    if (['/verify-email', '/reset-password'].includes(pathname)) {
      const entries = [...new URLSearchParams(search)];
      if (new Set(entries.map(([key]) => key)).size !== entries.length) return null;
      return actionSchema.safeParse(Object.fromEntries(entries)).success ? path : null;
    }
    if (['/login', '/register', '/forgot-password', '/resend-verification'].includes(pathname) && !search) return path;
    return isSafeDestination(path) ? path : null;
  } catch { return null; }
}
