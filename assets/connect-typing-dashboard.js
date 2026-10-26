'use strict';
(()=>{
const progressKey='connect-touchtyping-progress-v1';
const historyKey='connect-typing-attempt-history-v1';
const get=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key))||fallback}catch{return fallback}};
const put=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value))}catch{}};
const $=id=>document.getElementById(id);
function init(){
const course=$('connect-typing-course');if(!course||$('ct-performance'))return;
const section=document.createElement('section');
section.id='ct-performance';section.className='ct-performance';
section.innerHTML='<h3>Performance dashboard</h3><p id="ct-best"></p><div id="ct-attempts" aria-live="polite"></div>';
course.querySelector('.ct-work')?.append(section);
let previousDisabled=false;
function refresh(){
const lessons=[...course.querySelectorAll('#ct-lessons button')];
const index=lessons.findIndex(b=>b.classList.contains('ct-selected'));
const saved=get(progressKey,{});
const attempts=get(historyKey,[]).filter(a=>a.lesson===index);
const passes=attempts.filter(a=>a.passed);
const best=passes.sort((a,b)=>b.wpm-a.wpm)[0]||saved[index];
$('ct-best').textContent=best?'Personal best: '+best.wpm+' WPM · '+best.accuracy+'% accuracy':'No passing attempt yet';
const host=$('ct-attempts');host.replaceChildren();
if(!attempts.length){host.textContent='Finish this lesson to see your latest attempts.';return}
for(const a of attempts.slice(0,5)){const row=document.createElement('p');row.className='ct-attempt';row.textContent=(a.passed?'Passed':'Try again')+' · '+a.wpm+' WPM · '+a.accuracy+'% · '+a.mistakes+' mistakes';host.append(row)}
}
const input=$('ct-input');
input?.addEventListener('input',()=>queueMicrotask(()=>{
if(!input.disabled||previousDisabled)return;
const lessons=[...course.querySelectorAll('#ct-lessons button')];
const index=lessons.findIndex(b=>b.classList.contains('ct-selected'));
const accuracy=parseInt($('ct-accuracy')?.textContent||'0',10);
const attempt={lesson:index,wpm:parseInt($('ct-wpm')?.textContent||'0',10),accuracy,mistakes:parseInt($('ct-mistakes')?.textContent||'0',10),passed:accuracy>=90,date:new Date().toISOString()};
put(historyKey,[attempt,...get(historyKey,[])].slice(0,100));previousDisabled=true;refresh();
}));
course.addEventListener('click',event=>{if(event.target.closest('#ct-lessons button,#ct-retry,#ct-next')){previousDisabled=false;queueMicrotask(refresh)}});
refresh();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();