import assert from 'node:assert/strict';
import { test } from 'node:test';
import { spawnSync } from 'node:child_process';
import { checkReleaseEnvironment } from './release-preflight.mjs';

const configured = {
  APP_VARIANT: 'preview', EXPO_PUBLIC_APP_VARIANT: 'preview',
  EXPO_PUBLIC_API_URL: 'https://api.example.org',
  EXPO_PUBLIC_SENTRY_DSN: 'https://public@sentry.example.org/42',
  SENTRY_ORG: 'test-org', SENTRY_PROJECT: 'test-project', SENTRY_AUTH_TOKEN: 'test-only',
  APP_LINK_HOST: 'preview.example.org', GOOGLE_SERVICES_JSON: 'fixture.json',
};
const firebase = packageName => JSON.stringify({
  project_info: { project_id: 'test-project', project_number: '123' },
  client: [{ client_info: { android_client_info: { package_name: packageName } } }],
});
test('iOS does not depend on Android credentials', () => {
  assert.deepEqual(checkReleaseEnvironment({ ...configured, GOOGLE_SERVICES_JSON: undefined }, 'preview', 'ios', () => { throw new Error('Must not read a file'); }), []);
});
test('Android and all-platform checks require a matching Firebase app', () => {
  for (const platform of ['android', 'all']) {
    assert.deepEqual(checkReleaseEnvironment(configured, 'preview', platform, () => firebase('com.tanidikvar.app.preview')), []);
    assert.ok(checkReleaseEnvironment(configured, 'preview', platform, () => firebase('com.tanidikvar.app')).some(issue => issue.includes('application ID')));
  }
});
test('production requires the production Firebase app and matching variants', () => {
  const env = { ...configured, APP_VARIANT: 'production', EXPO_PUBLIC_APP_VARIANT: 'production' };
  assert.deepEqual(checkReleaseEnvironment(env, 'production', 'android', () => firebase('com.tanidikvar.app')), []);
  assert.ok(checkReleaseEnvironment(env, 'production', 'android', () => firebase('com.tanidikvar.app.preview')).length);
  assert.ok(checkReleaseEnvironment(configured, 'production', 'ios').includes('APP_VARIANT=production'));
});
test('missing and malformed Firebase files fail without revealing their contents', () => {
  for (const read of [() => { throw new Error('private/path'); }, () => 'private data', () => '{}', () => 'null']) {
    const issues = checkReleaseEnvironment(configured, 'preview', 'android', read);
    assert.ok(issues.length);
    assert.doesNotMatch(issues.join(), /private/);
  }
});
test('rejects unsafe API origins, DSNs and link hosts', () => {
  for (const url of ['http://api.example.org', 'https://user:secret@api.example.org', 'https://api.example.org/api', 'https://api.example.org?secret=value', 'https://api.example.org#fragment']) {
    assert.ok(checkReleaseEnvironment({ ...configured, EXPO_PUBLIC_API_URL: url }, 'preview', 'ios').some(issue => issue.startsWith('EXPO_PUBLIC_API_URL')));
  }
  for (const dsn of ['http://public@sentry.example.org/42', 'https://sentry.example.org', 'https://public:secret@sentry.example.org/42']) {
    assert.ok(checkReleaseEnvironment({ ...configured, EXPO_PUBLIC_SENTRY_DSN: dsn }, 'preview', 'ios').some(issue => issue.startsWith('EXPO_PUBLIC_SENTRY_DSN')));
  }
  for (const host of ['https://example.org', 'example.org/path', 'example.org:443', 'example.org?key=value']) {
    assert.ok(checkReleaseEnvironment({ ...configured, APP_LINK_HOST: host }, 'preview', 'ios').some(issue => issue.startsWith('APP_LINK_HOST')));
  }
});
test('source map bypasses cannot silently ship in release builds', () => {
  for (const flag of ['SENTRY_DISABLE_AUTO_UPLOAD', 'SENTRY_ALLOW_FAILURE']) {
    assert.ok(checkReleaseEnvironment({ ...configured, [flag]: 'true' }, 'preview', 'ios').some(issue => issue.startsWith(flag)));
    assert.deepEqual(checkReleaseEnvironment({ ...configured, [flag]: 'false' }, 'preview', 'ios'), []);
  }
});
test('invalid modes and platforms fail closed', () => {
  assert.ok(checkReleaseEnvironment(configured, 'development', 'ios').length);
  assert.ok(checkReleaseEnvironment(configured, 'preview', 'web').length);
});
test('CLI returns nonzero without logging supplied secrets', () => {
  const result = spawnSync(process.execPath, ['scripts/release-preflight.mjs', 'preview', 'ios'], {
    encoding: 'utf8', env: { PATH: process.env.PATH, ...configured, EXPO_PUBLIC_API_URL: 'https://private-user:private-password@api.example.org' },
  });
  assert.equal(result.status, 1);
  assert.doesNotMatch(result.stdout + result.stderr, /private-user|private-password|test-only/);
});
test('EAS hook skips only explicit development builds', () => {
  for (const profile of ['development', 'development-simulator']) {
    const result = spawnSync(process.execPath, ['scripts/eas-build-preflight.mjs'], {
      encoding: 'utf8', env: { PATH: process.env.PATH, APP_VARIANT: 'development', EAS_BUILD_PROFILE: profile, EAS_BUILD_PLATFORM: 'ios' },
    });
    assert.equal(result.status, 0);
  }
  for (const env of [{}, { APP_VARIANT: 'development', EAS_BUILD_PROFILE: 'production', EAS_BUILD_PLATFORM: 'ios' }, { ...configured, EAS_BUILD_PROFILE: 'production', EAS_BUILD_PLATFORM: 'ios' }]) {
    const result = spawnSync(process.execPath, ['scripts/eas-build-preflight.mjs'], { encoding: 'utf8', env: { PATH: process.env.PATH, ...env } });
    assert.equal(result.status, 1);
  }
});
test('configured iOS release passes through the EAS hook', () => {
  const result = spawnSync(process.execPath, ['scripts/eas-build-preflight.mjs'], {
    encoding: 'utf8', env: { PATH: process.env.PATH, ...configured, EAS_BUILD_PLATFORM: 'ios', EAS_BUILD_PROFILE: 'preview' },
  });
  assert.equal(result.status, 0);
});
