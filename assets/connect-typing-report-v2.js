'use strict';
(()=>{
function init(){
 const host=document.getElementById('ct-performance');
 if(!host||document.getElementById('ct-csv-export'))return;
 const read=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key)||'null')||fallback}catch{return fallback}};
 const getData=()=>({progress:read('connect-touchtyping-progress-v1',{}),history:read('connect-typing-attempt-history-v1',[])});
 const btn=document.createElement('button');
 btn.id='ct-csv-export';btn.type='button';btn.textContent='Export CSV';
 btn.addEventListener('click',()=>{
  const data=getData(),records=Array.isArray(data.history)?data.history:[];
  const rows=[['Lesson','Passed','WPM','Accuracy (%)','Mistakes','Date']];
  for(const item of records){if(!item||!Number.isInteger(item.lesson))continue;
   rows.push([String(item.lesson+1),item.passed?'Yes':'No',item.wpm,item.accuracy,item.mistakes,item.date]);
  }
  const esc=value=>'"'+String(value??'').replaceAll('"','""')+'"';
  const csv=rows.map(row=>row.map(esc).join(',')).join('\r\n');
  const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));
  const a=document.createElement('a');a.href=url;a.download='connect-typing-history.csv';a.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
 });
 const print=document.createElement('button');print.type='button';print.textContent='Print completion summary';
 print.addEventListener('click',()=>{
  const data=getData();
  const completed=Object.keys(data.progress).filter(key=>data.progress[key]&&Number(key)>=0&&Number(key)<8).length;
  const printWindow=window.open('','_blank','width=780,height=640');
  if(!printWindow){alert('Allow pop-ups to print your summary.');return}
  const d=printWindow.document;
  d.title='Connect Typing Progress Summary';
  const style=d.createElement('style');style.textContent='body{font-family:Arial,sans-serif;max-width:720px;margin:40px auto;color:#17242c}h1{font-size:24px}p{line-height:1.6}.note{font-size:12px;color:#667}';
  d.head.append(style);
  const title=d.createElement('h1');title.textContent='VWEB.DEV Connect — Typing Progress';
  const stat=d.createElement('p');stat.textContent='Lessons completed: '+completed+' of 8';
  const attempts=d.createElement('p');attempts.textContent='Recorded attempts: '+(Array.isArray(data.history)?data.history.length:0);
  const note=d.createElement('p');note.className='note';note.textContent='Personal self-assessed progress record stored locally in this browser. Not an accredited certificate.';
  d.body.append(title,stat,attempts,note);
  printWindow.focus();printWindow.print();
 });
 host.append(btn,print);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();