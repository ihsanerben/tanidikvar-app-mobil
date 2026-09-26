import { pathToFileURL } from 'node:url';

export async function checkReleaseServices(env, mode = 'preview', platform = 'all', request = fetch) {
  const invalid = detail => [{ check: 'configuration', ok: false, detail }];
  if (!['preview', 'production'].includes(mode) || !['ios', 'android', 'all'].includes(platform)) return invalid('Use preview|production and ios|android|all');
  let api;
  try {
    api = new URL(env.EXPO_PUBLIC_API_URL);
    if (api.protocol !== 'https:' || api.username || api.password || api.pathname !== '/' || api.search || api.hash) throw new Error();
  } catch { return invalid('EXPO_PUBLIC_API_URL must be an HTTPS origin'); }
  if (!/^[a-z0-9]+(?:[.-][a-z0-9]+)*\.[a-z]{2,}$/i.test(env.APP_LINK_HOST ?? '')) return invalid('APP_LINK_HOST must be a hostname');
  if (platform !== 'android' && !/^[A-Z0-9]{10}$/.test(env.MOBILE_APPLE_TEAM_ID ?? '')) return invalid('MOBILE_APPLE_TEAM_ID is required for iOS');
  const fingerprints = (env.MOBILE_ANDROID_SHA256 ?? '').split(',').map(value => value.trim().toUpperCase());
  if (platform !== 'ios' && !fingerprints.every(value => /^(?:[0-9A-F]{2}:){31}[0-9A-F]{2}$/.test(value))) return invalid('MOBILE_ANDROID_SHA256 must contain signing certificate SHA-256 fingerprints');
  const bundle = mode === 'production' ? 'com.tanidikvar.app' : 'com.tanidikvar.app.preview';
  const host = `https://${env.APP_LINK_HOST}`;
  const probes = [{ check: 'api-health', url: api.origin + '/api/health', validate: body => body.status === 'ok' && body.database === 'up' }];
  if (platform !== 'android') probes.push({
    check: 'apple-association', url: host + '/.well-known/apple-app-site-association',
    validate: body => body.applinks?.details?.some(detail => detail.appID === `${env.MOBILE_APPLE_TEAM_ID}.${bundle}`
      && ['/soru/*', '/universite/*', '/program/*', '/profiles/*'].every(path => detail.paths?.includes(path))),
  });
  if (platform !== 'ios') probes.push({
    check: 'android-association', url: host + '/.well-known/assetlinks.json',
    validate: body => Array.isArray(body) && body.some(item => item.relation?.includes('delegate_permission/common.handle_all_urls')
      && item.target?.namespace === 'android_app' && item.target?.package_name === bundle
      && fingerprints.every(value => item.target.sha256_cert_fingerprints?.map(entry => entry.toUpperCase()).includes(value))),
  });
  return Promise.all(probes.map(async probe => {
    try {
      const response = await request(probe.url, { redirect: 'manual', signal: AbortSignal.timeout(10000), headers: { Accept: 'application/json' } });
      if (response.status !== 200) return { check: probe.check, ok: false, detail: `HTTP ${response.status}; redirects are not followed` };
      if (!response.headers.get('content-type')?.includes('application/json')) return { check: probe.check, ok: false, detail: 'Expected JSON content type' };
      const ok = Boolean(probe.validate(await response.json()));
      return { check: probe.check, ok, detail: ok ? 'Verified' : 'Response does not match the selected environment or signing identity' };
    } catch { return { check: probe.check, ok: false, detail: 'Network, timeout or invalid JSON response' }; }
  }));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const results = await checkReleaseServices(process.env, process.argv[2] ?? 'preview', process.argv[3] ?? 'all');
  for (const result of results) process.stdout.write(`${result.ok ? 'PASS' : 'FAIL'} ${result.check}: ${result.detail}\n`);
  process.exitCode = results.every(result => result.ok) ? 0 : 1;
}
