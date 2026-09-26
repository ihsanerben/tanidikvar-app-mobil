import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
const config=JSON.parse(execFileSync('npx',['expo','config','--type','introspect','--json'],{encoding:'utf8',stdio:['ignore','pipe','pipe'],maxBuffer:10*1024*1024}));
const mods=config._internal.modResults;
const permissions=mods.android.manifest.manifest['uses-permission'] ?? [];
for(const name of ['RECORD_AUDIO','READ_CONTACTS','ACCESS_FINE_LOCATION','ACCESS_COARSE_LOCATION','READ_EXTERNAL_STORAGE','WRITE_EXTERNAL_STORAGE']) {
  assert(permissions.some(p=>p.$['android:name']==='android.permission.'+name && p.$['tools:node']==='remove'),name+' must be blocked');
}
assert(!('NSFaceIDUsageDescription' in mods.ios.infoPlist),'Unused Face ID permission must be absent');
if((process.env.APP_VARIANT ?? 'development') !== 'development') {
  assert(!('NSLocalNetworkUsageDescription' in mods.ios.infoPlist),'Release must not request development LAN permission');
  assert(permissions.some(p=>p.$['android:name']==='android.permission.SYSTEM_ALERT_WINDOW' && p.$['tools:node']==='remove'),'Release overlay permission must be blocked');
}
assert(config.extra.eas.projectId,'EAS project must be linked');
assert.equal(config.runtimeVersion.policy,'fingerprint');
console.log('Native config passed: unused permissions blocked, linked project and fingerprint present. Final merged manifests still require build/device acceptance.');
