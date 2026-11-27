'use strict';
(()=>{
 if(document.documentElement.dataset.rsvpMode!=='server')return;
 const $=id=>document.getElementById(id),form=$('wishForm'),status=$('status'),submit=form.querySelector('button[type=submit]'),retry=$('retryRsvpStatus');
 $('wishList').hidden=true;$('exportWishes').hidden=true;$('clearWishes').hidden=true;
 form.querySelector('.notice').textContent='Khi gửi, tên, lời chúc và số khách được lưu trên máy chủ để chuẩn bị lễ cưới. Chỉ quản trị viên có quyền xem; không hiển thị công khai.';
 let pending=null,busy=false,ready=false,checking=false,uncertain=false;
 const say=(text,kind='info')=>{status.textContent=text;status.dataset.state=kind};
 function sync(){submit.disabled=!ready||busy||!navigator.onLine;retry.hidden=ready&&navigator.onLine;retry.disabled=checking;form.setAttribute('aria-busy',String(busy));}
 async function check(){
  if(checking||busy)return;checking=true;ready=false;sync();say('Đang kiểm tra kết nối…');
  try{if(!navigator.onLine)throw Error('offline');const r=await fetch('/api/wedding/status',{cache:'no-store',signal:AbortSignal.timeout(8000)});if(!r.ok)throw Error();const x=await r.json();if(!x.ready)throw Error();$('inviteCodeLabel').hidden=!x.inviteRequired;$('inviteCode').required=!!x.inviteRequired;ready=true;say(uncertain?'Đã kết nối lại. Hãy gửi lại đúng nội dung trước để tránh trùng hồi âm.':'');}
  catch{say('Chưa kết nối được máy chủ. Kiểm tra mạng rồi bấm Kiểm tra kết nối lại.','error')}
  finally{checking=false;sync()}
 }
 retry.addEventListener('click',check);addEventListener('online',check);addEventListener('offline',()=>{ready=false;sync();if(!busy)say('Đang mất kết nối. Nội dung vẫn còn trong biểu mẫu.','error')});sync();check();
 form.addEventListener('submit',async ev=>{
  ev.preventDefault();if(busy||!ready||!navigator.onLine)return;
  const name=$('guest').value.trim(),message=$('wish').value.trim(),attendance=form.querySelector('input[name=attendance]:checked').value,guests=attendance==='no'?0:Number($('guests').value);
  if(!name||!message){say('Vui lòng nhập tên và lời chúc.','error');return}
  const fields={name,message,attendance,guests},fingerprint=JSON.stringify(fields);
  if(uncertain&&pending&&pending.fingerprint!==fingerprint){say('Lần gửi trước chưa được xác nhận. Hãy khôi phục đúng nội dung cũ và gửi lại trước khi thay đổi hồi âm.','error');return}
  if(!pending||pending.fingerprint!==fingerprint)pending={fingerprint,id:crypto.randomUUID()};
  const body={id:pending.id,...fields,website:$('website').value,inviteCode:$('inviteCode').value};
  const controls=[...form.querySelectorAll('input,textarea,select')].map(el=>[el,el.disabled]);controls.forEach(([el])=>el.disabled=true);
  busy=true;sync();say('Đang gửi hồi âm…');
  let sent=false;
  try{
   const r=await fetch('/api/wedding/rsvp',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(12000)});
   const x=await r.json();
   if(r.ok&&x.ok&&x.id===pending.id){sent=true;pending=null;uncertain=false;form.reset();say('Đã gửi và lưu hồi âm. Cảm ơn bạn!','success')}
   else if(r.status===403&&x.error==='invitation code required'){say('Mã mời chưa đúng. Vui lòng kiểm tra và thử lại.','error')}
   else if(r.status===429){say('Có quá nhiều lượt gửi. Vui lòng thử lại sau ít nhất 60 giây.','error')}
   else if(r.status===400||r.status===413||r.status===415){say('Thông tin chưa hợp lệ. Vui lòng kiểm tra tên, lời chúc và số khách.','error')}
   else if(r.status===409){uncertain=true;say('Hồi âm bị xung đột. Vui lòng liên hệ gia đình để kiểm tra, không gửi lại nhiều lần.','error')}
   else{uncertain=true;say('Chưa xác nhận gửi thành công. Hãy gửi lại đúng nội dung để tránh ghi trùng.','error')}
  }catch{uncertain=true;say('Chưa xác nhận gửi thành công. Hãy thử lại với cùng nội dung; hệ thống tránh ghi trùng.','error')}
  finally{controls.forEach(([el,disabled])=>el.disabled=disabled);if(sent)$('guests').disabled=false;busy=false;sync()}
 });
})();
