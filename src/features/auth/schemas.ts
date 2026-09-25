import { z } from 'zod';

const email = z.string().trim().pipe(z.email('Geçerli bir e-posta adresi yaz.').max(254)).transform(value => value.toLowerCase());
// Count UTF-8 bytes without relying on TextEncoder in native runtimes.
function byteLength(value: string) {
  let bytes = 0;
  for (const character of value) {
    const code = character.codePointAt(0) ?? 0;
    bytes += code <= 0x7f ? 1 : code <= 0x7ff ? 2 : code <= 0xffff ? 3 : 4;
  }
  return bytes;
}
const password = z.string().min(1, 'Şifreni yaz.').max(72).refine(value => byteLength(value) <= 72, 'Şifre en fazla 72 bayt olabilir.');
const newPassword = password.refine(value => value.length >= 8, 'Şifre en az 8 karakter olmalı.');
export const tokenSchema = z.string().trim().regex(/^[A-Za-z0-9_-]{43}$/, 'E-postadaki geçerli kodu yaz.');
export const loginSchema = z.object({ email, password });
export const registerSchema = z.object({ email, password: newPassword });
export const emailSchema = z.object({ email });
export const verifySchema = z.object({ token: tokenSchema });
export const resetSchema = z.object({ token: tokenSchema, password: newPassword });
export const closeSchema = z.object({ password, confirmation: z.literal('HESABIMI KAPAT', { error: 'Onaylamak için HESABIMI KAPAT yaz.' }) });
export { safeDestinationSchema as returnToSchema } from '@/lib/navigation/destination';
export const actionParamsSchema = z.object({ token: tokenSchema.optional() });
