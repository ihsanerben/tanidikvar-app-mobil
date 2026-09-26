import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export function checkReleaseEnvironment(env, mode = 'preview', platform = 'all', readFile = readFileSync) {
  const issues = [];
  if (!['preview', 'production'].includes(mode)) return ['Use preview or production'];
  if (!['ios', 'android', 'all'].includes(platform)) return ['Use ios, android or all'];
  for (const name of ['EXPO_PUBLIC_API_URL', 'EXPO_PUBLIC_SENTRY_DSN', 'SENTRY_ORG', 'SENTRY_PROJECT', 'SENTRY_AUTH_TOKEN', 'APP_LINK_HOST']) {
    if (!env[name]?.trim()) issues.push(name);
  }
  if (env.APP_VARIANT !== mode) issues.push(`APP_VARIANT=${mode}`);
  if (env.EXPO_PUBLIC_APP_VARIANT !== mode) issues.push(`EXPO_PUBLIC_APP_VARIANT=${mode}`);
  try {
    const api = new URL(env.EXPO_PUBLIC_API_URL);
    if (api.protocol !== 'https:' || api.username || api.password || api.pathname !== '/' || api.search || api.hash) throw new Error();
  } catch { issues.push('EXPO_PUBLIC_API_URL must be an HTTPS origin without credentials, path or query'); }
  try {
    const dsn = new URL(env.EXPO_PUBLIC_SENTRY_DSN);
    if (dsn.protocol !== 'https:' || !dsn.username || dsn.password || !/^\/[0-9]+$/.test(dsn.pathname) || dsn.search || dsn.hash) throw new Error();
  } catch { issues.push('EXPO_PUBLIC_SENTRY_DSN must be a valid HTTPS public DSN'); }
  if (!/^[a-z0-9]+(?:[.-][a-z0-9]+)*\.[a-z]{2,}$/i.test(env.APP_LINK_HOST ?? '')) issues.push('APP_LINK_HOST must be a hostname');
  if (env.EAS_PROJECT_ID && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(env.EAS_PROJECT_ID)) issues.push('EAS_PROJECT_ID must be a UUID');
  for (const name of ['SENTRY_DISABLE_AUTO_UPLOAD', 'SENTRY_ALLOW_FAILURE']) {
    if (env[name] && !['false', '0'].includes(env[name].toLowerCase())) issues.push(`${name} must not bypass release source map upload`);
  }
  if (platform !== 'ios') {
    try {
      const config = JSON.parse(readFile(env.GOOGLE_SERVICES_JSON, 'utf8'));
      const expected = mode === 'production' ? 'com.tanidikvar.app' : 'com.tanidikvar.app.preview';
      if (!Array.isArray(config.client) || !config.client.some(client => client?.client_info?.android_client_info?.package_name === expected)) {
        issues.push('GOOGLE_SERVICES_JSON must contain the selected Android application ID');
      }
      if (!config.project_info?.project_number || !config.project_info?.project_id) issues.push('GOOGLE_SERVICES_JSON project information is missing');
    } catch { issues.push('GOOGLE_SERVICES_JSON must reference a readable Firebase JSON file'); }
  }
  return issues;
}

export function runPreflight(env, mode, platform) {
  const issues = checkReleaseEnvironment(env, mode, platform);
  // Error descriptions contain names only, never credentials, paths or raw input.
  if (issues.length) {
    process.stderr.write('Release configuration invalid:\n' + issues.map(issue => `- ${issue}`).join('\n') + '\n');
    return 1;
  }
  process.stdout.write('Release configuration passed. Device, signing, privacy, source map delivery and rollback acceptance still required.\n');
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = runPreflight(process.env, process.argv[2] ?? 'preview', process.argv[3] ?? 'all');
}
