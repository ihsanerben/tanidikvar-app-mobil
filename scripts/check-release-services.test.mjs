import assert from 'node:assert/strict';
import { test } from 'node:test';
import { checkReleaseServices } from './check-release-services.mjs';
const fingerprint = Array(32).fill('AB').join(':');
const env = { EXPO_PUBLIC_API_URL: 'https://api.example.org', APP_LINK_HOST: 'preview.example.org', MOBILE_APPLE_TEAM_ID: 'A123456789', MOBILE_ANDROID_SHA256: fingerprint };
const bodies = {
  '/api/health': { status: 'ok', database: 'up' },
  '/.well-known/apple-app-site-association': { applinks: { details: [{ appID: 'A123456789.com.tanidikvar.app.preview', paths: ['/soru/*', '/universite/*', '/program/*', '/profiles/*'] }] } },
  '/.well-known/assetlinks.json': [{ relation: ['delegate_permission/common.handle_all_urls'], target: { namespace: 'android_app', package_name: 'com.tanidikvar.app.preview', sha256_cert_fingerprints: [fingerprint] } }],
};
const request = async (url, options) => {
  assert.equal(options.redirect, 'manual');
  assert.ok(options.signal);
  return new Response(JSON.stringify(bodies[new URL(url).pathname]), { headers: { 'content-type': 'application/json' } });
};
test('verifies health and both signing associations', async () => {
  const results = await checkReleaseServices(env, 'preview', 'all', request);
  assert.equal(results.length, 3);
  assert.ok(results.every(result => result.ok));
});
test('iOS does not require Android signing information', async () => {
  const results = await checkReleaseServices({ ...env, MOBILE_ANDROID_SHA256: undefined }, 'preview', 'ios', request);
  assert.equal(results.length, 2);
  assert.ok(results.every(result => result.ok));
});
test('preview associations do not pass production checks', async () => {
  const results = await checkReleaseServices(env, 'production', 'all', request);
  assert.equal(results.filter(result => !result.ok).length, 2);
});
test('incorrect signing identities fail', async () => {
  const results = await checkReleaseServices({ ...env, MOBILE_APPLE_TEAM_ID: 'B123456789', MOBILE_ANDROID_SHA256: Array(32).fill('CD').join(':') }, 'preview', 'all', request);
  assert.equal(results.filter(result => !result.ok).length, 2);
});
test('redirects, unavailable services, HTML and malformed JSON fail', async () => {
  for (const response of [new Response(null, { status: 302 }), new Response(null, { status: 503 }), new Response('<html/>'), new Response('invalid', { headers: { 'content-type': 'application/json' } })]) {
    const results = await checkReleaseServices(env, 'preview', 'ios', async () => response.clone());
    assert.ok(results.every(result => !result.ok));
  }
});
test('errors do not expose URLs or credentials', async () => {
  const results = await checkReleaseServices(env, 'preview', 'all', async () => { throw new Error('private-token https://private.example.org'); });
  assert.ok(results.every(result => !result.ok));
  assert.doesNotMatch(JSON.stringify(results), /private-token|private.example/);
});
test('invalid configuration does not make requests', async () => {
  const results = await checkReleaseServices({ ...env, EXPO_PUBLIC_API_URL: 'http://localhost:8080' }, 'preview', 'all', () => { throw new Error('Must not fetch'); });
  assert.equal(results[0].check, 'configuration');
  assert.equal(results[0].ok, false);
});
