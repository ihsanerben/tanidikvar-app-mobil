export const ERROR_MESSAGES: Record<string, string> = {
  AUTHENTICATION_REQUIRED:
    "E-posta veya şifre hatalı ya da oturumun sona erdi.",
  EMAIL_UNVERIFIED: "Giriş yapmadan önce e-posta adresini doğrula.",
  INVALID_ACTION_TOKEN: "Kod geçersiz veya süresi dolmuş. Yeni bir kod iste.",
  VALIDATION_FAILED: "Lütfen form alanlarını kontrol et.",
  INVALID_REQUEST: "İstek bilgilerini kontrol et.",
  INVALID_ACHIEVEMENTS: "En fazla üç farklı rozet seçebilirsin.",
  INVALID_YEAR: "Geçerli bir karne yılı seç.",
  INVALID_TARGET: "Bu içerik için işlem desteklenmiyor.",
  NOT_FOUND: "İçerik bulunamadı veya artık erişilebilir değil.",
  STALE_VERSION:
    "Bu içerik başka bir yerde değişti. Güncel bilgileri yükleyip tekrar dene.",
  PROFILE_REQUIRED:
    "Katkıda bulunmadan önce profil ve eğitim bilgilerini tamamla.",
  QUESTION_ARCHIVED: "Bu soru arşivlenmiş; yeni katkı kabul etmiyor.",
  ANSWER_EXISTS:
    "Bu soruya zaten cevap verdin. Mevcut cevabını düzenleyebilirsin.",
  BEST_ANSWER_NOT_ALLOWED: "En İyi Cevabı yalnız soru sahibi seçebilir.",
  ACCESS_DENIED: "Bu işlem için yetkin bulunmuyor.",
  RATE_LIMITED: "Çok fazla deneme yaptın. Biraz bekleyip tekrar dene.",
  SERVICE_UNAVAILABLE: "Hizmete şu anda ulaşılamıyor. Tekrar deneyebilirsin.",
  NETWORK_ERROR: "Bağlantı kurulamadı. İnternet bağlantını kontrol et.",
  TIMEOUT: "İstek zaman aşımına uğradı. Tekrar deneyebilirsin.",
  INVALID_RESPONSE: "Sunucudan beklenmeyen bir yanıt geldi.",
  SESSION_CHANGED: "Oturum değişti. Lütfen yeniden dene.",
  STORAGE_ERROR: "Güvenli oturum kaydedilemedi. Lütfen yeniden giriş yap.",
};

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    public readonly fieldErrors: Record<string, string> = {},
    public readonly requestId?: string,
    public readonly retryAfter?: number,
  ) {
    super(ERROR_MESSAGES[code] ?? "İşlem tamamlanamadı. Lütfen tekrar dene.");
    this.name = "ApiError";
  }
}

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function responseError(status: number, body: unknown, headers: Headers) {
  const fields: Record<string, string> = {};
  if (record(body) && record(body.fieldErrors)) {
    for (const name of Object.keys(body.fieldErrors)) {
      // Backend validation defaults can be technical/English; map by field rather than raw text.
      fields[name.replace(/^content\./, "")] = "Bu alanı kontrol et.";
    }
  }
  const retry = headers.get("Retry-After");
  const seconds =
    retry === null
      ? undefined
      : /^\d+$/.test(retry)
        ? Number(retry)
        : Math.max(0, Math.ceil((Date.parse(retry) - Date.now()) / 1000));
  const rawId =
    record(body) && typeof body.requestId === "string"
      ? body.requestId
      : headers.get("X-Request-ID");
  return new ApiError(
    status,
    record(body) && typeof body.code === "string"
      ? body.code
      : "INVALID_RESPONSE",
    fields,
    rawId && /^[a-zA-Z0-9-]{1,80}$/.test(rawId) ? rawId : undefined,
    seconds !== undefined && Number.isFinite(seconds) ? seconds : undefined,
  );
}
