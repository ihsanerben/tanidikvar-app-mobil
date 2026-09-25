import { randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { setTimeout } from 'node:timers/promises';

// Run only against an explicitly disposable local API and local Mailpit.
function localOrigin(value) {
  const url=new URL(value);
  if(!['localhost','127.0.0.1','[::1]'].includes(url.hostname) || !['http:','https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash || url.pathname!=='/') throw new Error('Only loopback test origins are supported');
  return url.origin;
}
const api=localOrigin(process.env.SMOKE_API_URL ?? 'http://localhost:18080');
const mail=localOrigin(process.env.SMOKE_MAILPIT_URL ?? 'http://localhost:8025');
if(process.env.SMOKE_DISPOSABLE_DATABASE !== 'true') throw new Error('Set SMOKE_DISPOSABLE_DATABASE=true only for a disposable test database');
if(spawnSync('maestro',['--version'],{stdio:'ignore'}).status!==0) throw new Error('Maestro is required; no fixture was created');
async function request(origin,path,method='GET',body,access) {
  const response=await fetch(origin+path,{method,headers:{'Content-Type':'application/json',...(access?{Authorization:'Bearer '+access}:{})},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(10000)});
  if(!response.ok) throw new Error(`Test service failed: ${method} ${path.split('?')[0]} (${response.status})`);
  return response.status===204?undefined:response.json();
}
const email=`mobile-smoke-${randomUUID()}@example.test`;
const password=`Smoke-${randomUUID()}!`;
let session;
try {
  await request(api,'/api/auth/mobile/register','POST',{email,password});
  let token;
  for(let attempt=0;attempt<20 && !token;attempt++) {
    const messages=await request(mail,'/api/v1/search?query='+encodeURIComponent('to:'+email));
    for(const message of messages.messages ?? []) {
      const detail=await request(mail,'/api/v1/message/'+encodeURIComponent(message.ID));
      token=detail.Text?.match(/#token=([A-Za-z0-9_-]{43})/)?.[1];
      if(token) break;
    }
    if(!token) await setTimeout(500);
  }
  if(!token) throw new Error('Local Mailpit verification message was not delivered');
  await request(api,'/api/auth/mobile/verify-email','POST',{token});
  session=await request(api,'/api/auth/mobile/login','POST',{email,password});
  const profile=await request(api,'/api/me/profile','GET',undefined,session.accessToken);
  await request(api,'/api/me/profile','PUT',{firstName:'Mobil',lastName:'Test',educationStatus:'YKS_ADAYI',version:profile.version},session.accessToken);
  const title='Mobil kabul '+randomUUID();
  const question=await request(api,'/api/questions','POST',{requestId:randomUUID(),content:{title,body:'Bu soru izole mobil kabul testi verisidir.',scope:'GENERAL',tagIds:[]}},session.accessToken);
  const result=spawnSync('maestro',['test','.maestro/session-and-notifications.yaml'],{stdio:'inherit',env:{...process.env,TEST_EMAIL:email,TEST_PASSWORD:password,QUESTION_ID:question.id,QUESTION_TITLE:title}});
  if(result.status!==0) process.exitCode=1;
} catch(error) { process.stderr.write((error instanceof Error?error.message:'Smoke failed')+'\n');process.exitCode=1; }
finally {
  if(session) {
    try { await request(api,'/api/me/close-account','POST',{password},session.accessToken); }
    catch { process.stderr.write('Fixture account cleanup failed; discard the isolated database.\n');process.exitCode=1; }
  }
}
