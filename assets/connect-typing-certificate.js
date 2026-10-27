'use strict';
(()=>{
function init(){
const host=document.getElementById('ct-performance');
if(!host||document.getElementById('ct-certificate'))return;
const button=document.createElement('button');
button.id='ct-certificate';button.type='button';button.textContent='Print completion certificate';
button.addEventListener('click',()=>{
let progress={};try{progress=JSON.parse(localStorage.getItem('connect-touchtyping-progress-v1')||'{}')}catch{}
const completed=Array.from({length:8},(_,i)=>Boolean(progress[i])).filter(Boolean).length;
if(completed!==8){alert('Complete all 8 lessons with at least 90% accuracy before printing a completion certificate. '+completed+'/8 completed.');return}
const win=window.open('','_blank','width=900,height=700');
if(!win){alert('Please enable pop-ups to print the certificate.');return}
const d=win.document;
d.title='VWEB.DEV Connect — Self-Assessed Completion';
const css=d.createElement('style');
css.textContent='@page{size:A4 landscape;margin:14mm}body{font-family:Arial,sans-serif;margin:0;color:#17242c}.sheet{border:8px double #b49050;padding:54px 42px;min-height:420px;text-align:center;box-sizing:border-box}.brand{font-size:16px;letter-spacing:4px;color:#8c6b31;font-weight:bold}.eyebrow{margin-top:48px;letter-spacing:3px;text-transform:uppercase;font-size:13px}h1{font-size:40px;margin:14px 0;color:#182a35}p{line-height:1.7}.disclaimer{font-size:12px;margin-top:65px;color:#555}.date{margin-top:30px;font-size:13px}@media screen{body{padding:20px;background:#eee}.sheet{background:#fff;max-width:1000px;margin:auto}}';
d.head.append(css);
const sheet=d.createElement('main');sheet.className='sheet';
for(const [tag,cls,label] of [['div','brand','VWEB.DEV CONNECT'],['div','eyebrow','Certificate of self-assessed completion'],['h1','','Touch Typing Course'],['p','','All 8 practice lessons completed with at least 90% recorded accuracy.'],['p','date','Generated '+new Date().toLocaleDateString()],['p','disclaimer','This is a personal practice record generated from local browser progress, not an accredited or identity-verified certificate.']]){const el=d.createElement(tag);el.className=cls;el.textContent=label;sheet.append(el)}
d.body.append(sheet);win.focus();win.print();
});
host.append(button);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();