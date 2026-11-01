'use strict';
(()=>{
const OFFICIAL='https://open-typer.github.io/web-app/';
function init(){
const root=document.getElementById('connect-typing-course');
if(!root||document.getElementById('connect-open-typer'))return;
for(const item of [...root.children])item.hidden=true;
const section=document.createElement('section');
section.id='connect-open-typer';section.className='cot-container';
section.innerHTML='<div class="cot-heading"><span>CONNECT ACADEMY · TYPING LAB</span><h2>Open-Typer</h2><p>Practice touch typing with the official open-source Open-Typer online beta. It runs on the provider\'s website and may require a modern desktop browser.</p></div><div class="cot-actions"><button type="button" id="cot-embed">Try in Connect</button><a href="https://open-typer.github.io/web-app/" target="_blank" rel="noopener noreferrer">Open full-screen ↗</a><a href="https://sourceforge.net/projects/open-typer/" target="_blank" rel="noopener noreferrer">Desktop download ↗</a></div><p id="cot-info" class="cot-info" role="status">Choose Try in Connect to load the official application. If embedding is blocked, use Open full-screen.</p><div id="cot-frame-holder" hidden></div><details class="cot-legacy"><summary>Previous Connect typing progress (archived)</summary><p>Your earlier lesson scores remain in this browser. The Open-Typer application does not automatically import them.</p><button type="button" id="cot-old">Show previous typing course</button></details>';
root.append(section);
const holder=document.getElementById('cot-frame-holder');
document.getElementById('cot-embed').addEventListener('click',()=>{
 holder.hidden=false;
 if(holder.firstElementChild)return;
 const frame=document.createElement('iframe');frame.src=OFFICIAL;frame.title='Open-Typer official browser app';frame.loading='lazy';frame.referrerPolicy='no-referrer';frame.setAttribute('allowfullscreen','');holder.append(frame);
 document.getElementById('cot-info').textContent='Official Open-Typer is loading. If it remains blank or refuses to open, select Open full-screen.';
});
document.getElementById('cot-old').addEventListener('click',()=>{
 for(const item of [...root.children])if(item!==section)item.hidden=false;
 section.hidden=true;
});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();