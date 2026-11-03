'use strict';
(()=>{
 const PREFIX='/apps/open-typer/';
 const ONLINE='https://open-typer.github.io/web-app/';
 const SOURCE='https://github.com/Open-Typer/Open-Typer';
 const REQUIRED=['qtloader.js','open-typer.worker.js'];
 const $=id=>document.getElementById(id);
 function init(){
   const root=$('connect-typing-course');
   if(!root||$('connect-open-typer'))return;
   const lessons=[...root.children];
   const section=document.createElement('section');
   section.id='connect-open-typer';
   section.className='cot-container cot-fallback';
   section.innerHTML='<div class="cot-heading"><span>CONNECT ACADEMY · TYPING LAB</span><h2>Open-Typer</h2><p>Practice with the locally hosted Open-Typer engine when installed, or continue your existing Connect typing lessons.</p></div><div class="cot-actions"><button type="button" id="cot-launch" disabled>Checking installation…</button><button type="button" id="cot-native">Continue Connect lessons</button><button type="button" id="cot-recheck">Recheck engine</button><a id="cot-direct" href="#" target="_blank" rel="noopener noreferrer" hidden>Open local app in new tab ↗</a><a href="'+ONLINE+'" target="_blank" rel="noopener noreferrer">Official online beta ↗</a><a href="'+SOURCE+'" target="_blank" rel="noopener noreferrer">Source and license ↗</a></div><p class="cot-info" id="cot-info" role="status" aria-live="polite">Checking local engine files…</p><div id="cot-frame-holder" hidden></div><p class="cot-footnote">Open-Typer is independent GPL-3.0 software. Previous Connect typing scores remain in this browser; they are not imported into Open-Typer.</p>';
   root.append(section);
   const holder=$('cot-frame-holder'),info=$('cot-info'),launch=$('cot-launch'),native=$('cot-native'),recheck=$('cot-recheck'),direct=$('cot-direct');
   let ready=false,entry='',checking=false,active=false;
   function nativeCourse(){
     active=false;
     lessons.forEach(node=>node.hidden=false);
     holder.hidden=true;
     holder.replaceChildren();
     section.classList.add('cot-fallback');
     launch.textContent=ready?'Launch local Open-Typer':'Connect typing course available';
     info.textContent=ready?'Local Open-Typer is available. Your Connect lessons remain ready below.':'Connect typing lessons are ready. Local Open-Typer is not installed.';
   }
   function launchLocal(){
     if(!ready){nativeCourse();return}
     active=true;
     lessons.forEach(node=>node.hidden=true);
     section.classList.remove('cot-fallback');
     holder.hidden=false;
     holder.replaceChildren();
     const frame=document.createElement('iframe');
     frame.src=entry;
     frame.title='Locally hosted Open-Typer application';
     frame.loading='eager';
     frame.setAttribute('allowfullscreen','');
     frame.addEventListener('error',()=>{info.textContent='Embedded application could not load. Use Open local app in new tab or Continue Connect lessons.'});
     holder.append(frame);
     launch.textContent='Restart local Open-Typer';
     info.textContent='Local Open-Typer loading. If the application remains blank, open it in a new tab or return to Connect lessons.';
   }
   native.addEventListener('click',nativeCourse);
   launch.addEventListener('click',()=>{if(ready)launchLocal();else nativeCourse()});
   recheck.addEventListener('click',check);
   async function check(){
     if(checking)return;
     checking=true;recheck.disabled=true;
     info.textContent='Checking local WebAssembly assets…';
     try{
       const controller=new AbortController();
       const timeout=setTimeout(()=>controller.abort(),12000);
       let manifest;
       try{
         const response=await fetch(PREFIX+'manifest.json',{cache:'no-store',signal:controller.signal});
         if(!response.ok||!String(response.headers.get('content-type')||'').includes('json'))throw Error('No valid manifest');
         manifest=await response.json();
         if(manifest?.engine!=='Open-Typer'||manifest.ready!==true)throw Error('Engine not ready');
         const paths=[manifest.entrypoint,manifest.javascript,manifest.wasm,...REQUIRED.map(x=>PREFIX+x)];
         if(paths.some(x=>typeof x!=='string'||!x.startsWith(PREFIX)||x.includes('..')||x.includes('?')||x.includes('#')))throw Error('Invalid runtime path');
         for(const path of paths){
           const isWasm=path.endsWith('.wasm');
           const response=await fetch(path,{cache:'no-store',signal:controller.signal,headers:isWasm?{Range:'bytes=0-15'}:{}});
           if(!response.ok)throw Error('Missing runtime asset: '+path);
           if(isWasm){
             const reader=response.body?.getReader();
             if(!reader)throw Error('WebAssembly unavailable');
             const head=[];
             try{
               while(head.length<4){
                 const chunk=await reader.read();
                 if(chunk.done)break;
                 for(const byte of chunk.value){head.push(byte);if(head.length===4)break}
               }
             }finally{await reader.cancel()}
             if(head.length<4||head[0]!==0||head[1]!==97||head[2]!==115||head[3]!==109)throw Error('Invalid WebAssembly signature');
           }else await response.body?.cancel();
         }
       }finally{clearTimeout(timeout)}
       ready=true;entry=manifest.entrypoint;
       direct.href=entry;direct.hidden=false;launch.disabled=false;
       if(!active){launch.textContent='Launch local Open-Typer';info.textContent='Local runtime files detected. Launch Open-Typer or continue with your saved Connect lessons.'}
     }catch{
       ready=false;entry='';direct.hidden=true;direct.removeAttribute('href');launch.disabled=true;
       if(active)nativeCourse();
       info.textContent='Local Open-Typer engine not available or incomplete. Connect typing lessons remain usable below; the official online beta is available separately.';
     }finally{
       checking=false;recheck.disabled=false;
     }
   }
   check();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();