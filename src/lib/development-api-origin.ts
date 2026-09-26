/** On a phone localhost is the phone itself. Reuse Metro's LAN host in Expo Go. */
export function developmentApiOrigin(origin: string, hostUri: string | undefined, expoGo: boolean, variant: string) {
  if (!expoGo || variant !== 'development' || !hostUri) return origin;
  const api = new URL(origin);
  if (api.protocol !== 'http:' || !['localhost', '127.0.0.1', '[::1]'].includes(api.hostname)) return origin;
  try {
    const metro = new URL(`http://${hostUri}`);
    // A Metro tunnel does not also tunnel the API. Only infer a local network host.
    const octets = metro.hostname.split('.').map(Number);
    const privateAddress = octets.length === 4 && octets.every(n => Number.isInteger(n) && n >= 0 && n <= 255)
      && (octets[0] === 10 || (octets[0] === 192 && octets[1] === 168) || (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31));
    if (!privateAddress || metro.username || metro.password) return origin;
    api.hostname = metro.hostname;
    return api.origin;
  } catch { return origin; }
}
