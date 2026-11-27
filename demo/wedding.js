'use strict';
const $=id=>document.getElementById(id),curtain=$('curtain'),main=$('home'),audio=$('audio'),music=$('music'),reduced=matchMedia('(prefers-reduced-motion: reduce)');
const nav=document.querySelector('.nav'),footer=document.querySelector('footer');
main.inert=true;nav.inert=true;footer.inert=true;$('open').focus();
function open(){if(curtain.hidden||curtain.classList.contains('opening'))return;curtain.classList.add('opening');setTimeout(()=>{curtain.hidden=true;main.inert=false;nav.inert=false;footer.inert=false;main.focus({preventScroll:true});},(reduced.matches||document.documentElement.classList.contains("motion-off"))?0:1350);}
$('open').addEventListener('click',open);curtain.addEventListener('keydown',e=>{if(e.key==='Escape')open();if(e.key==='Tab'){e.preventDefault();$('open').focus()}});
music.addEventListener('click',async()=>{if(audio.paused){try{await audio.play();music.setAttribute('aria-pressed','true')}catch{music.setAttribute('aria-pressed','false')}}else{audio.pause();music.setAttribute('aria-pressed','false')}});
const lb=$('lightbox');$('photo').addEventListener('click',()=>lb.showModal());$('closePhoto').addEventListener('click',()=>lb.close());lb.addEventListener('click',e=>{if(e.target===lb)lb.close()});
const date=new Date('2027-03-24T17:30:00+07:00').getTime();function tick(){let n=Math.max(0,Math.floor((date-Date.now())/1000));for(const [id,unit] of [['days',86400],['hours',3600],['minutes',60],['seconds',1]]){$(id).textContent=String(Math.floor(n/unit)).padStart(2,'0');n%=unit}}tick();setInterval(tick,1000);
let pending=false;window.addEventListener('scroll',()=>{if(reduced.matches||document.documentElement.classList.contains("motion-off")||pending)return;pending=true;requestAnimationFrame(()=>{document.querySelector('.scene').style.setProperty('--shift',Math.min(scrollY,650)*.13+'px');pending=false})},{passive:true});
const key='weddingDemoV3LocalWishes';let wishes=[];try{const v=JSON.parse(localStorage.getItem(key)||'[]');if(Array.isArray(v))wishes=v.filter(x=>typeof x.name==='string'&&typeof x.message==='string').slice(-20)}catch{}
function render(){const list=$('wishList');list.replaceChildren();for(const item of wishes.slice().reverse()){const li=document.createElement('li'),b=document.createElement('b'),p=document.createElement('p');b.textContent=item.name;p.textContent=item.message;li.append(b,p);if(item.attendance){const meta=document.createElement('small');meta.textContent=({yes:'Sẽ tham dự',maybe:'Chưa chắc chắn',no:'Không thể tham dự'}[item.attendance]||'Chưa xác nhận')+(item.attendance==='no'?'':' · '+(item.guests||1)+' khách');li.append(meta)}list.append(li)}}render();
$('wishForm').addEventListener('submit',e=>{e.preventDefault();if(document.documentElement.dataset.rsvpMode==='server')return;const name=$('guest').value.trim(),message=$('wish').value.trim();if(!name||!message)return;wishes.push({name,message,attendance:document.querySelector("input[name=attendance]:checked")?.value||"maybe",guests:document.querySelector("input[name=attendance]:checked")?.value==="no"?0:Number(document.getElementById("guests")?.value||1),createdAt:new Date().toISOString()});wishes=wishes.slice(-20);try{localStorage.setItem(key,JSON.stringify(wishes));$('status').textContent='Đã lưu lời chúc trên trình duyệt này.'}catch{$('status').textContent='Đã lưu trong phiên hiện tại; bộ nhớ trình duyệt không khả dụng.'}e.target.reset();document.getElementById("guests").disabled=false;render()});

/* Original wedding particle effect, with bounded lifecycle and motion preference handling. */
(()=>{
 const layer=document.querySelector('.lotus-rain');if(!layer)return;
 let started=false,timer=null;const pending=new Set(),root=document.documentElement;
 const allowed=()=>started&&!reduced.matches&&!root.classList.contains('motion-off')&&!document.hidden;
 const compact=()=>innerWidth<=800;
 function createFallingItem(){
  if(!allowed()||layer.childElementCount>=(compact()?56:96))return;
  const item=document.createElement('span'),isPetal=Math.random()<.72;
  item.className='fall-item '+(isPetal?'petal':'bubble');
  if(isPetal&&Math.random()<.35)item.classList.add('alt');
  item.style.left=Math.random()*100+'vw';item.style.opacity=.38+Math.random()*.42;
  item.style.setProperty('--dx',(Math.random()-.5)*260+'px');
  item.style.setProperty('--rot',(Math.random()>.5?1:-1)*(320+Math.random()*220)+'deg');
  item.style.animationDuration=7+Math.random()*10+'s';
  const size=isPetal?18+Math.random()*28:10+Math.random()*22;
  item.style.width=size+'px';item.style.height=(isPetal?size*1.1:size)+'px';
  layer.appendChild(item);item.addEventListener('animationend',()=>item.remove(),{once:true});
 }
 function burst(n){for(let i=0;i<n;i++){const t=setTimeout(()=>{pending.delete(t);createFallingItem()},i*36);pending.add(t)}}
 function stop(){if(timer!==null){clearInterval(timer);timer=null}for(const t of pending)clearTimeout(t);pending.clear();layer.replaceChildren()}
 function reconcile(){if(!allowed()){stop();return}if(timer!==null)return;burst(compact()?48:84);timer=setInterval(()=>burst(compact()?3:5),1200)}
 new MutationObserver(()=>{if(!started&&(curtain.hidden||curtain.classList.contains('opening'))){started=true;reconcile()}}).observe(curtain,{attributes:true,attributeFilter:['class','hidden']});
 new MutationObserver(reconcile).observe(root,{attributes:true,attributeFilter:['class']});
 reduced.addEventListener('change',reconcile);document.addEventListener('visibilitychange',reconcile);
})();
