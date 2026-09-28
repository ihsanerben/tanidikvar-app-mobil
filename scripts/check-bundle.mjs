import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
const root=process.argv[2] ?? 'dist';
const patterns=[/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/, /(?:sk_live_|sk_test_)[A-Za-z0-9]{16,}/, /sntrys_[A-Za-z0-9_]{20,}/, /AKIA[0-9A-Z]{16}/];
let count=0,bytes=0,failed=false;
function scan(dir) {
  for(const entry of readdirSync(dir)) {
    const path=join(dir,entry);if(statSync(path).isDirectory()) { scan(path);continue; }
    if(!/\.(?:js|hbc|json|html|map)$/.test(path)) continue;
    const data=readFileSync(path);count++;bytes+=data.length;
    if(patterns.some(pattern=>pattern.test(data.toString('utf8')))) { process.stderr.write(`Potential credential in ${path} (value suppressed)\n`);failed=true; }
    if(data.includes(Buffer.from('/api/manager'))) { process.stderr.write(`Web-only Manager API included in mobile bundle: ${path}\n`);failed=true; }
  }
}
scan(root);
process.stdout.write(`Scanned ${count} exported files, ${bytes} bytes. Pattern scan is not a complete secret audit.\n`);
process.exitCode=failed?1:0;
