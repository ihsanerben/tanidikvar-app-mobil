import { execFileSync } from 'node:child_process';
const id=process.argv[2];
if(!id || !/^[0-9a-f-]{36}$/i.test(id)) throw new Error('Provide a build UUID');
try {
  const build=JSON.parse(execFileSync('npx',['--yes','eas-cli@latest','build:view',id,'--json'],{encoding:'utf8',stdio:['ignore','pipe','pipe']}));
  // EAS JSON contains temporary signed log URLs. Do not print or persist the full object.
  console.log(JSON.stringify({id:build.id,status:build.status,platform:build.platform,buildProfile:build.buildProfile,
    appVersion:build.appVersion,appBuildVersion:build.appBuildVersion,errorCode:build.error?.errorCode,
    createdAt:build.createdAt,completedAt:build.completedAt},null,2));
  if(['ERRORED','CANCELED'].includes(build.status)) process.exitCode=1;
} catch { console.error('Unable to read EAS build status; verify account access and build ID.');process.exitCode=1; }
