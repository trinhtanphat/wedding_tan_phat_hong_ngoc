'use strict';
// Deterministic client regression, no live guest data or browser storage.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),p=require('node:path');
const src=fs.readFileSync(p.join(__dirname,'../demo/rsvp.js'),'utf8');
const tick=()=>new Promise(r=>setImmediate(r));
const response=(status,data)=>({ok:status>=200&&status<300,status,json:async()=>data});
function harness(){
 const events={},requests=[],queue=[];let next=0,resetCount=0;
 const mk=(value='')=>({value,disabled:false,hidden:false,required:false,dataset:{},textContent:'',listeners:{},addEventListener(k,fn){this.listeners[k]=fn},setAttribute(k,v){this[k]=v}});
 const els=Object.fromEntries(['wishList','exportWishes','clearWishes','status','retryRsvpStatus','inviteCodeLabel','inviteCode','guest','wish','guests','website'].map(x=>[x,mk()]));
 els.guest.value='QA guest';els.wish.value='QA message';els.guests.value='2';els.inviteCode.value='wrong';
 const submit=mk(),note=mk(),attendance={value:'yes'},controls=[els.guest,els.wish,els.guests,els.inviteCode,els.website];
 const form=mk();els.wishForm=form;
 form.querySelector=s=>s.includes('submit')?submit:s==='.notice'?note:attendance;
 form.querySelectorAll=()=>controls;form.reset=()=>{resetCount++;els.guest.value='';els.wish.value=''};
 const navigator={onLine:true};
 const fetch=async(url,options)=>{requests.push({url,options});if(!queue.length)throw Error('no mock response');return await queue.shift()(url,options)};
 const context={document:{documentElement:{dataset:{rsvpMode:'server'}},getElementById:id=>els[id]},navigator,fetch,crypto:{randomUUID:()=>String(++next)},AbortSignal:{timeout:()=>undefined},addEventListener:(k,fn)=>events[k]=fn};
 const push=(status,data)=>queue.push(async()=>response(status,data));
 const run=()=>vm.runInNewContext(src,context);
 const send=()=>form.listeners.submit({preventDefault(){}});
 return {els,form,submit,navigator,events,queue,push,run,send,requests,get resets(){return resetCount}};
}
(async()=>{
 const h=harness(),e=h.els;h.push(503,{});h.run();await tick();
 assert(h.submit.disabled&&!e.retryRsvpStatus.hidden);assert.match(e.status.textContent,/Chưa kết nối/);
 h.push(200,{ready:true,inviteRequired:true});await e.retryRsvpStatus.listeners.click();assert(!h.submit.disabled&&e.retryRsvpStatus.hidden&&e.inviteCode.required);
 h.push(403,{error:'invitation code required'});await h.send();assert.match(e.status.textContent,/Mã mời chưa đúng/);assert.equal(e.guest.value,'QA guest');const first=JSON.parse(h.requests.at(-1).options.body);
 e.inviteCode.value='correct';let finish;h.queue.push(()=>new Promise(r=>finish=r));const sending=h.send();assert(e.guest.disabled&&h.submit.disabled);finish(response(200,{ok:true,id:first.id}));await sending;assert.equal(h.resets,1);assert(!e.guest.disabled);assert.match(e.status.textContent,/Đã gửi/);assert.equal(JSON.parse(h.requests.at(-1).options.body).id,first.id);
 e.guest.value='Second guest';e.wish.value='Second wish';h.queue.push(async()=>{throw Error('connection interrupted')});await h.send();const uncertain=JSON.parse(h.requests.at(-1).options.body);assert.match(e.status.textContent,/Chưa xác nhận/);
 e.wish.value='Edited';const n=h.requests.length;await h.send();assert.equal(h.requests.length,n);assert.match(e.status.textContent,/khôi phục đúng nội dung/);
 e.wish.value='Second wish';h.push(200,{ok:true,id:uncertain.id});await h.send();assert.equal(JSON.parse(h.requests.at(-1).options.body).id,uncertain.id);assert.equal(h.resets,2);
 h.navigator.onLine=false;h.events.offline();assert(h.submit.disabled&&!e.retryRsvpStatus.hidden);
 h.navigator.onLine=true;h.push(200,{ready:true,inviteRequired:true});await h.events.online();assert(!h.submit.disabled);
 console.log('PASS RSVP client: status retry, invalid code, lock/unlock, same ID on correction, ambiguous response replay, changed-payload guard, offline/online recovery');
})().catch(e=>{console.error(e);process.exitCode=1});
