// Isolated headless Chromium; never connects to the operator's desktop session.
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),p=require('node:path'),os=require('node:os'),{spawn}=require('node:child_process'),{pathToFileURL}=require('node:url');
const root=p.resolve(__dirname,'..'),out=process.env.WEDDING_CURTAIN_QA_DIR||fs.mkdtempSync(p.join(os.tmpdir(),'wedding-curtain-qa-'));fs.mkdirSync(out,{recursive:true});
const profile=fs.mkdtempSync(p.join(out,'profile-')),chrome=process.env.CHROME_BIN||'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const proc=spawn(chrome,['--headless=new','--disable-gpu','--no-first-run','--disable-extensions','--remote-debugging-address=127.0.0.1','--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'],{windowsHide:true,stdio:'ignore'});
const wait=ms=>new Promise(r=>setTimeout(r,ms));let ws;
async function run(){
 const active=p.join(profile,'DevToolsActivePort');for(let i=0;i<100&&!fs.existsSync(active);i++)await wait(100);
 const port=fs.readFileSync(active,'utf8').split(/\r?\n/)[0],pages=await(await fetch('http://127.0.0.1:'+port+'/json/list')).json();
 ws=new WebSocket(pages.find(x=>x.type==='page').webSocketDebuggerUrl);await new Promise((r,j)=>{ws.onopen=r;ws.onerror=j});
 let id=0,errors=[];const pending=new Map();ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const q=pending.get(m.id);if(q){pending.delete(m.id);m.error?q.reject(Error(JSON.stringify(m.error))):q.resolve(m.result)}}else if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.text)};
 const send=(method,params={})=>new Promise((resolve,reject)=>{const n=++id;pending.set(n,{resolve,reject});ws.send(JSON.stringify({id:n,method,params}))});
 await send('Page.enable');await send('Runtime.enable');
 const ev=async expression=>{const q=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(q.exceptionDetails)throw Error(JSON.stringify(q.exceptionDetails));return q.result.value};
 const url=process.env.WEDDING_TEST_URL||pathToFileURL(p.join(root,'demo','index.html')).href;
 const shot=async name=>{const s=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});fs.writeFileSync(p.join(out,name+'.png'),Buffer.from(s.data,'base64'))};
 const metrics="(()=>{const c=document.getElementById('curtain'),l=c.querySelector('.curtain-left'),r=c.querySelector('.curtain-right'),a=l.getBoundingClientRect(),b=r.getBoundingClientRect();return {hidden:c.hidden,opening:c.classList.contains('opening'),inert:document.getElementById('home').inert,focus:document.activeElement.id,left:a.left,leftRight:a.right,right:b.left,rightEnd:b.right,w:innerWidth,display:getComputedStyle(l).display,bg:getComputedStyle(l).backgroundImage,rightBg:getComputedStyle(r).backgroundPosition,back:getComputedStyle(c).backgroundImage,animation:getComputedStyle(c).animationName,overflow:document.documentElement.scrollWidth>innerWidth}})()";
 for(const [name,width,height,mobile,reduce] of [['desktop',1440,1000,false,false],['tablet',768,1024,true,false],['mobile',390,844,true,false],['small-mobile',320,740,true,false],['reduced',390,844,true,true]]){
  errors=[];await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile});await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:reduce?'reduce':'no-preference'}]});await send('Page.navigate',{url});
  let ready=false;for(let i=0;i<100;i++){if(await ev('document.readyState==="complete"&&!!document.getElementById("open")')){ready=true;break}await wait(100)}assert(ready);
  const before=await ev(metrics);assert.equal(before.w,width);assert(!before.hidden&&before.inert&&!before.overflow);assert.equal(before.focus,'open');assert.equal(before.display,'block');assert.match(before.bg,/rem-cung-dinh\.webp/);assert.match(before.rightBg,/100%/);assert.equal(before.back,'none');assert(Math.abs(before.leftRight-width/2)<2&&Math.abs(before.right-width/2)<2);
  await shot(name+'-closed');
  await ev('document.getElementById("open").click()');
  if(!reduce){await wait(440);const mid=await ev(metrics);assert(!mid.hidden&&mid.opening&&mid.inert);assert(mid.left < -5&&mid.right>width/2+5);assert(mid.right-mid.leftRight>10);assert.equal(mid.animation,'none');await shot(name+'-opening');console.log(name+' gap '+Math.round(mid.right-mid.leftRight)+'px');await wait(1050)}else await wait(80);
  const after=await ev(metrics);assert(after.hidden&&!after.inert&&!after.overflow);assert.equal(after.focus,'home');assert.equal(errors.length,0);const lotus=await ev("(async()=>{const layer=document.querySelector('.lotus-rain'),petals=[...layer.children],p=petals[0],a=getComputedStyle(p).transform;await new Promise(r=>setTimeout(r,250));const b=getComputedStyle(p).transform;const i=new Image();i.src=new URL('../assets/artifact-v2/lotus-petal-v72.svg',location.href);await i.decode();const vis=getComputedStyle(layer).display!=='none',active=petals.filter(x=>getComputedStyle(x).display!=='none').length;document.getElementById('motion').click();const off=getComputedStyle(layer).display==='none';document.getElementById('motion').click();const details=document.querySelector('.asset-disclosure'),summary=details.querySelector('summary');summary.click();const gallery=details.open;summary.click();return {count:petals.length,active,vis,moves:a!==b,off,decoded:i.naturalWidth>0,clickThrough:getComputedStyle(layer).pointerEvents==='none',gallery,closed:!details.open}})()");
  assert.equal(lotus.count,16);assert(lotus.off&&lotus.decoded&&lotus.clickThrough&&lotus.gallery&&lotus.closed);assert.equal(lotus.vis,!reduce);if(!reduce){assert(lotus.moves);assert.equal(lotus.active,width<=400?8:width<=800?10:16)}console.log(name+' lotus '+JSON.stringify(lotus));await shot(name+'-open');console.log('PASS '+name+' curtain, focus and layout');
 }
 console.log('PASS 5/5 curtain + lotus scenarios; screenshots: '+out);
}
const timer=setTimeout(()=>{proc.kill();process.exit(1)},120000);run().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>{clearTimeout(timer);if(ws)ws.close();proc.kill()});
