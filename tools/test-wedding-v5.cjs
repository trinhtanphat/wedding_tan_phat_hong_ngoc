'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto'),net=require('node:net'),{spawn}=require('node:child_process');
const data=fs.mkdtempSync(path.join(os.tmpdir(),'wedding-v5-test-')),token=crypto.randomBytes(32).toString('hex');let child,base,origin,checks=0;
const pass=(name)=>{console.log('PASS '+name);checks++};const pause=ms=>new Promise(r=>setTimeout(r,ms));
async function freePort(){const s=net.createServer();await new Promise(r=>s.listen(0,'127.0.0.1',r));const n=s.address().port;await new Promise(r=>s.close(r));return n}
async function start(port){base='http://127.0.0.1:'+port;origin=base;child=spawn(process.execPath,[path.resolve(__dirname,'../server/wedding-server.cjs')],{windowsHide:true,env:{...process.env,WEDDING_DATA_DIR:data,WEDDING_ADMIN_TOKEN:token,WEDDING_PORT:String(port),WEDDING_HOST:'127.0.0.1',WEDDING_PUBLIC_ORIGIN:''},stdio:['ignore','pipe','pipe']});for(let i=0;i<80;i++){if(child.exitCode!==null)throw Error('server exited '+child.exitCode);try{if((await fetch(base+'/api/wedding/status')).ok)return}catch{}await pause(100)}throw Error('startup timeout')}
async function stop(){if(child&&child.exitCode===null){await new Promise(r=>{child.once('exit',r);child.kill()})}child=null}
async function post(x,opts={}){return fetch(base+'/api/wedding/rsvp',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json',...opts.headers},body:JSON.stringify(x)})}
async function exportRows(t=token){const r=await fetch(base+'/api/wedding/admin/export',{headers:{Authorization:'Bearer '+t}});assert.equal(r.status,200);return (await r.json()).records}
(async()=>{let port=await freePort();await start(port);let r=await fetch(base+'/');assert.equal(r.status,200);const h=await r.text();assert.match(h,/data-rsvp-mode="server"/);assert.match(h,/Wedding Cinematic V5/);assert.match(r.headers.get('content-security-policy'),/frame-ancestors 'none'/);pass('served V5 + CSP');
for(const file of ['/demo/rsvp.js','/demo/wedding.js','/assets/artifact-v2/monogram.svg','/assets/images/couple-main.png','/assets/artifact-v2/'])assert.equal((await fetch(base+file)).status,200);pass('static assets');
for(const file of ['/server/wedding-server.cjs','/.git/config','/tools/test-wedding-v4.cjs','/rsvp.sqlite','/api/wedding/admin/export?token='+token])assert.equal((await fetch(base+file)).status,file.includes('/api/')?401:404);pass('private files and query token denied');
const x={id:crypto.randomUUID(),name:"QA ' test",message:'<script>literal</script>',attendance:'maybe',guests:2};
assert.equal((await post(x,{headers:{Origin:'https://untrusted.invalid'}})).status,403);pass('cross-origin blocked');
assert.equal((await post({...x,guests:99})).status,400);assert.equal((await post({...x,attendance:'no',guests:1})).status,400);assert.equal((await post({...x,name:''})).status,400);pass('schema validation');
assert.equal((await post(x,{headers:{'Content-Type':'text/plain'}})).status,415);pass('JSON content type');
assert.equal((await post({...x,message:'a'.repeat(9000)})).status,413);pass('body limit');
r=await post(x);assert.equal(r.status,201);assert.equal((await r.json()).id,x.id);pass('durable create');
r=await post(x);assert.equal(r.status,200);assert.equal((await r.json()).replayed,true);assert.equal((await post({...x,message:'different'})).status,409);pass('idempotency replay and conflict');
assert.equal((await fetch(base+'/api/wedding/admin/export')).status,401);assert.equal((await fetch(base+'/api/wedding/admin/export',{headers:{Authorization:'Bearer wrong'}})).status,401);assert.equal((await fetch(base+'/api/wedding/rsvp')).status,404);pass('no public read, admin auth');
let rows=await exportRows();assert.equal(rows.length,1);assert.equal(rows[0].message,x.message);pass('authenticated export');
await stop();await start(port);rows=await exportRows();assert.equal(rows.length,1);assert.equal(rows[0].id,x.id);assert.equal((await post(x)).status,200);pass('restart persistence and replay');
const no={id:crypto.randomUUID(),name:'QA no',message:'QA',attendance:'no',guests:0};assert.equal((await post(no)).status,201);assert.equal((await exportRows()).length,2);pass('decline RSVP zero guests');
for(let i=0;i<122;i++)await post({...no,id:crypto.randomUUID(),guests:4});assert.equal((await post(x)).status,429);pass('bounded rate limit');
console.log('PASS '+checks+'/14 backend checks');
})().catch(e=>{console.error(e);process.exitCode=1}).finally(async()=>{await stop();try{fs.rmSync(data,{recursive:true,force:true})}catch{}});
