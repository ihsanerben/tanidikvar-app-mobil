/** Public reads stay available; private routes are guarded before mounting. */
export function requiresSession(path: string) {
  return ["/profil", "/bildirimler", "/account", "/collection", "/close-account", "/my-questions", "/my-comments"].includes(path)
    || path === "/manager" || path.startsWith("/manager/")
    || path.startsWith("/profile/") || path === "/questions/new"
    || /^\/questions\/[^/]+\/edit$/.test(path);
}
