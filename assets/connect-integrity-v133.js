'use strict';
/* Connect Release QA: in-browser, read-only integrity audit. No remote telemetry. */
(()=>{
 const $=s=>document.querySelector(s);
 const host=$('#page-dashboard');
 if(!host||$('#connect-qa-panel'))return;
 const section=document.createElement('section');
 section.id='connect-qa-panel';section.className='connect-qa-panel';
 section.setAttribute('aria-labelledby','connect-qa-title');
 section.innerHTML='<div class="connect-qa-head"><div><span class="connect-qa-kicker">CONNECT · RELIABILITY CENTER</span><h2 id="connect-qa-title">App integrity & recovery</h2><p>Inspect pages, installed assets, offline readiness and browser storage. Checks run locally and never upload workspace data.</p></div><span class="connect-qa-status" id="connect-qa-status" role="status">Ready</span></div><div class="connect-qa-controls"><button type="button" id="connect-qa-run">Run complete check</button><button type="button" id="connect-qa-copy" disabled>Copy report</button><button type="button" id="connect-qa-update">Check app update</button></div><div class="connect-qa-results" id="connect-qa-results" aria-live="polite"></div><p class="connect-qa-note">An unavailable external website does not indicate a failure in Connect. This test checks only first-party pages and essential assets.</p>';
 const existing=$('.connect-upgrade-panel');if(existing&&existing.parentNode===host)existing.after(section);else host.prepend(section);
 const out=$('#connect-qa-results'),status=$('#connect-qa-status'),copy=$('#connect-qa-copy');
 let report=null,running=false;
 const requiredRoutes=['home','daily','studios','academy','network','pc','apps','dashboard','convert','tools','qr','ai','play','offers','community','account'];
 const criticalAssets=['/assets/app.js','/assets/hub.js','/assets/mobile-app.js','/assets/lms.js','/assets/qr-studio.js','/assets/converter.js','/data/connect-hub.json','/manifest.webmanifest'];
 const put=(name,state,detail)=>{
  const row=document.createElement('div');row.className='connect-qa-result';
  const title=document.createElement('strong');title.textContent=name;
  const stateTag=document.createElement('span');stateTag.className='connect-qa-mark '+state;stateTag.textContent=state.toUpperCase();
  const desc=document.createElement('small');desc.textContent=detail;
  row.append(title,stateTag,desc);out.append(row);
 };
 const testAsset=async path=>{
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),6000);
  try{
   const response=await fetch(path+'?connect_qa=1',{method:'HEAD',cache:'no-store',signal:controller.signal});
   return {path,ok:response.ok||response.status===405,status:response.status};
  }catch(e){return {path,ok:false,status:e.name==='AbortError'?'timeout':'network error'};}
  finally{clearTimeout(timer);}
 };
 async function run(){
  if(running)return;running=true;report={at:new Date().toISOString(),origin:location.origin,checks:[]};
  out.replaceChildren();status.textContent='Checking…';copy.disabled=true;
  const add=(name,state,detail)=>{report.checks.push({name,state,detail});put(name,state,detail)};
  try{
   const absent=requiredRoutes.filter(id=>!$('#page-'+id));
   add('Page routing',absent.length?'fail':'pass',absent.length?('Missing route sections: '+absent.join(', ')):(requiredRoutes.length+' standard page sections found'));
   const anchors=[...document.querySelectorAll('a[href^="#"]')].filter(a=>{
    const id=a.getAttribute('href').slice(1);return id&&!document.getElementById(id)&&!requiredRoutes.includes(id)&&!/^(?:top|!)$/.test(id);
   });
   const unique=[...new Set(anchors.map(a=>a.getAttribute('href')))];
   add('On-page anchors',unique.length?'warn':'pass',unique.length?unique.length+' targets missing or dynamically supplied: '+unique.slice(0,8).join(', '):'No unresolved static hash anchors');
   let storage='unknown';
   try{const key='connect.qa.test';localStorage.setItem(key,'1');storage=localStorage.getItem(key)==='1'?'available':'restricted';localStorage.removeItem(key);}
   catch(e){storage='restricted';}
   add('Local storage',storage==='available'?'pass':'warn',storage==='available'?'Learning progress and preferences can be persisted in this browser':'Browser privacy settings are restricting storage');
   add('Network',navigator.onLine?'pass':'warn',navigator.onLine?'Browser reports online':'Browser reports offline; asset tests may use offline cache');
   if(!('serviceWorker' in navigator))add('PWA service worker','warn','Not supported by this browser');
   else {
    const registration=await navigator.serviceWorker.getRegistration('/');
    add('PWA service worker',registration?'pass':'warn',registration?(registration.active?'Active registration':'Registration present; not yet active'):'No registered service worker for Connect');
   }
   const results=[];
   for(let i=0;i<criticalAssets.length;i+=4){results.push(...await Promise.all(criticalAssets.slice(i,i+4).map(testAsset)));}
   const bad=results.filter(item=>!item.ok);
   add('Essential first-party assets',bad.length?'fail':'pass',bad.length?('Unavailable: '+bad.map(x=>x.path+' ('+x.status+')').join(', ')):(results.length+' asset requests succeeded'));
   const pageCount=document.querySelectorAll('.page').length;
   add('Page mounting',pageCount>=requiredRoutes.length?'pass':'warn',pageCount+' .page elements detected');
   report.summary={passed:report.checks.filter(x=>x.state==='pass').length,warnings:report.checks.filter(x=>x.state==='warn').length,failed:report.checks.filter(x=>x.state==='fail').length};
   status.textContent=report.summary.failed?'Issues found':report.summary.warnings?'Review warnings':'Checks passed';
   copy.disabled=false;
  }catch(e){add('Audit execution','fail',String(e.message||e));status.textContent='Audit incomplete';copy.disabled=false;}
  finally{running=false;}
 }
 $('#connect-qa-run').addEventListener('click',run);
 copy.addEventListener('click',async()=>{
  if(!report)return;
  const payload=JSON.stringify(report,null,2);
  try{await navigator.clipboard.writeText(payload);copy.textContent='Copied';setTimeout(()=>copy.textContent='Copy report',2000);}
  catch(e){const blob=new Blob([payload],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='connect-integrity-report.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
 });
 $('#connect-qa-update').addEventListener('click',async()=>{
  const btn=$('#connect-qa-update');btn.disabled=true;btn.textContent='Checking…';
  try{
   if(!('serviceWorker' in navigator))throw new Error('Service workers unavailable');
   const reg=await navigator.serviceWorker.getRegistration('/');
   if(!reg)throw new Error('No service worker is registered. Reload the app while online.');
   await reg.update();status.textContent=reg.waiting?'Update available — reload to activate':'Update check complete. Reload if a new version was downloaded.';
  }catch(e){status.textContent=e.message||'Update check failed';}
  finally{btn.disabled=false;btn.textContent='Check app update';}
 });
})();
