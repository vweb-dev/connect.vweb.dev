'use strict';
(function(){
 const badges=Array.from(document.querySelectorAll('.connect-social-status'));
 const allowed=new Map([['Reddit','Reddit'],['Discord','Discord']]);
 window.addEventListener('connect:provider-status',event=>{
  const item=event.detail;if(!item)return;
  badges.forEach(badge=>{
   if(allowed.get(badge.dataset.statusName)!==item.name)return;
   badge.textContent=item.message;
   badge.className='connect-social-status '+(item.kind==='ok'?'is-ok':item.kind==='outage'?'is-outage':item.kind==='warning'?'is-warning':'');
  });
 });
})();