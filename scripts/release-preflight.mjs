import { existsSync } from 'node:fs';
const mode = process.argv[2] ?? 'preview';
if (!['preview','production'].includes(mode)) throw new Error('Use preview or production');
const missing=[];
const requireValue = name => { if(!process.env[name]?.trim()) missing.push(name); };
for(const name of ['EAS_PROJECT_ID','EXPO_PUBLIC_API_URL','EXPO_PUBLIC_SENTRY_DSN','SENTRY_ORG','SENTRY_PROJECT','SENTRY_AUTH_TOKEN','APP_LINK_HOST']) requireValue(name);
if(process.env.EXPO_PUBLIC_APP_VARIANT !== mode) missing.push(`EXPO_PUBLIC_APP_VARIANT=${mode}`);
if(process.env.APP_VARIANT !== mode) missing.push(`APP_VARIANT=${mode}`);
try { if(new URL(process.env.EXPO_PUBLIC_API_URL).protocol !== 'https:') missing.push('HTTPS API origin'); } catch { missing.push('valid API origin'); }
if(!process.env.GOOGLE_SERVICES_JSON || !existsSync(process.env.GOOGLE_SERVICES_JSON)) missing.push('GOOGLE_SERVICES_JSON file');
// Print names only: no credentials, values, or file contents.
if(missing.length) { process.stderr.write('Release configuration missing: '+missing.join(', ')+'\n'); process.exitCode=1; }
else process.stdout.write('Release configuration present. Device, signing, privacy and rollback acceptance still required.\n');
