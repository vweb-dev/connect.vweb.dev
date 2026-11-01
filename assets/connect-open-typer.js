'use strict';
(()=>{
let localEntry='/apps/open-typer/index.html';
const SOURCE='https://github.com/Open-Typer/Open-Typer';
const ONLINE='https://open-typer.github.io/web-app/';
function init(){
 const root=document.getElementById('connect-typing-course');
 if(!root||document.getElementById('connect-open-typer'))return;
 const archived=[...root.children];
 const section=document.createElement('section');
 section.id='connect-open-typer';section.className='cot-container';
 section.innerHTML='<div class="cot-heading"><span>CONNECT ACADEMY · TYPING LAB</span><h2>Open-Typer</h2><p>Open-source typing practice. Connect supports a locally hosted WebAssembly build, with your previous course available until the engine is installed.</p></div><div class="cot-actions"><button type="button" id="cot-launch">Check local Open-Typer</button><button type="button" id="cot-native">Use Connect typing course</button><a href="'+ONLINE+'" target="_blank" rel="noopener noreferrer">Official online beta ↗</a><a href="'+SOURCE+'" target="_blank" rel="noopener noreferrer">View source ↗</a></div><p id="cot-info" class="cot-info" role="status">Checking for a local Open-Typer WebAssembly build…</p><div id="cot-frame-holder" hidden></div><p class="cot-footnote">Open-Typer is independent GPL-3.0 software. Local lessons and certificates are Connect features; their scores are not transferred to Open-Typer.</p>';
 archived.forEach(child=>child.hidden=true);
 root.append(section);
 const info=document.getElementById('cot-info');
 const launch=document.getElementById('cot-launch');
 const old=document.getElementById('cot-native');
 const holder=document.getElementById('cot-frame-holder');
 let ready=false;
 function showLegacy(){archived.forEach(child=>child.hidden=false);section.hidden=true;}
 old.addEventListener('click',showLegacy);
 function openLocal(){
   if(!ready)return;
   holder.hidden=false;
   if(holder.firstElementChild)return;
   const frame=document.createElement('iframe');
   frame.src=localEntry;frame.title='Self-hosted Open-Typer';frame.loading='lazy';
   frame.setAttribute('allowfullscreen','');holder.append(frame);
   info.textContent='Locally hosted engine detected. If it does not start, use Connect typing course.';
 }
 launch.addEventListener('click',()=>{if(ready)openLocal();else showLegacy()});
 async function check(){
   try{
     const response=await fetch('/apps/open-typer/manifest.json',{cache:'no-store'});
     if(!response.ok)throw Error('No local manifest');
     const data=await response.json();
     if(data.engine!=='Open-Typer'||data.ready!==true||!data.entrypoint||!data.wasm||!data.javascript)throw Error('Incomplete compiled engine');
     const entry=new URL(data.entrypoint,location.origin);
     if(entry.origin!==location.origin||!entry.pathname.startsWith('/apps/open-typer/'))throw Error('Invalid entry');
     const assets=[entry.pathname,data.wasm,data.javascript];
     for(const asset of assets){
       const uri=new URL(asset,location.origin);
       if(uri.origin!==location.origin||!uri.pathname.startsWith('/apps/open-typer/'))throw Error('Unsafe engine path');
       const probe=await fetch(uri.pathname,{method:'GET',headers:{Range:'bytes=0-7'},cache:'no-store'});
       if(!probe.ok||!(probe.status===200||probe.status===206))throw Error('Missing engine runtime');
       if(uri.pathname.endsWith('.wasm')){const reader=probe.body?.getReader();if(!reader)throw Error('No WASM stream');const chunk=await reader.read();await reader.cancel();const head=chunk.value||new Uint8Array();if(head.length<4||head[0]!==0||head[1]!==97||head[2]!==115||head[3]!==109)throw Error('Invalid WebAssembly runtime')}
     }
     localEntry=entry.pathname;
     ready=true;launch.textContent='Launch local Open-Typer';
     info.textContent='Self-hosted WebAssembly entry detected. Select Launch to open it in Connect.';
   }catch{
     ready=false;launch.textContent='Start Connect typing course';
     info.textContent='Self-hosted engine is not installed. Opening the working Connect typing course. The official online beta remains available separately.';
     archived.forEach(child=>child.hidden=false);
     section.classList.add('cot-fallback');
     section.querySelector('.cot-heading h2').textContent='Typing course · Open-Typer not installed';
     launch.textContent='Continue Connect typing';
   }
 }
 check();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();