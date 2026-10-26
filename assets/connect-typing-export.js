'use strict';
(()=>{
function init(){
const root=document.getElementById('ct-performance');if(!root)return;
const button=document.createElement('button');button.type='button';button.textContent='Export progress (JSON)';
button.addEventListener('click',()=>{
let progress={},history=[];
try{progress=JSON.parse(localStorage.getItem('connect-touchtyping-progress-v1')||'{}');history=JSON.parse(localStorage.getItem('connect-typing-attempt-history-v1')||'[]')}catch{}
const blob=new Blob([JSON.stringify({course:'Connect Typing',progress,history,exportedAt:new Date().toISOString()},null,2)],{type:'application/json'});
const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download='connect-typing-progress.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
});
root.append(button);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();