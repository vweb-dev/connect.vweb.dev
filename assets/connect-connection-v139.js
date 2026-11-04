'use strict';
/* Connect v139: nonintrusive offline/reconnect status. Never reloads or clears data automatically. */
(()=>{
 const node=document.createElement('div');node.id='connect-connection-banner';node.className='cx139-status';
 node.setAttribute('role','status');node.setAttribute('aria-live','polite');node.hidden=true;
 const dot=document.createElement('span');dot.className='cx139-dot';dot.setAttribute('aria-hidden','true');
 const label=document.createElement('span');label.className='cx139-copy';
 const dismiss=document.createElement('button');dismiss.type='button';dismiss.textContent='Dismiss';dismiss.setAttribute('aria-label','Dismiss connection status');
 node.append(dot,label,dismiss);
 document.body.append(node);
 let offlineDismissed=false,restoreTimer=null;
 const clearTimer=()=>{if(restoreTimer!==null){clearTimeout(restoreTimer);restoreTimer=null;}};
 function update(){
  clearTimer();
  if(!navigator.onLine){
   node.classList.remove('cx139-restored');
   label.textContent='You are offline. Cached Connect pages may still work; online services and downloads need a connection.';
   node.hidden=offlineDismissed;
  }else if(node.dataset.wasOffline==='1'){
   offlineDismissed=false;
   node.classList.add('cx139-restored');
   label.textContent='Connection restored. You can retry online tools or refresh an incomplete task.';
   node.hidden=false;
   restoreTimer=setTimeout(()=>{node.hidden=true;node.dataset.wasOffline='0';restoreTimer=null;},6500);
  }else node.hidden=true;
  if(!navigator.onLine)node.dataset.wasOffline='1';
 }
 dismiss.addEventListener('click',()=>{if(!navigator.onLine)offlineDismissed=true;node.hidden=true;clearTimer()});
 window.addEventListener('offline',()=>{offlineDismissed=false;update()});
 window.addEventListener('online',update);
 update();
})();
