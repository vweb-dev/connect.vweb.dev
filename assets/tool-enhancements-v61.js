'use strict';
/* Pro workspace layer; source tool engines and controls remain untouched. */
(()=>{
const $=id=>document.getElementById(id);
const registry=()=>window.ConnectToolRoutes?.tools||[];
const create=(tag,cls,value)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(value!==undefined)el.textContent=String(value);return el;};
const descriptions={
 quick:['Choose or paste your input','Configure the options','Run the tool and use the result'],
 tab:['Select source files or content','Set output and quality','Process and download the result'],
 qr:['Choose the QR content type','Enter details and design','Preview, scan and export'],
 focus:['Enter or select your details','Review and adjust settings','Run and use the result'],
 office:['Choose your Microsoft product','Review licence status','Follow the official resolution path'],
 expand:['Read the appropriate method','Check official requirements','Follow instructions carefully']
};
const hints={
 password:'Generate a high-entropy password, adjust length and symbols, then copy it securely.',
 text:'Paste or write text, apply transformations and review the updated word and character counts.',
 units:'Choose the measurement category, enter a number and inspect the converted value.',
 compress:'Select an image, review size and format options, then export the optimized image.',
 csv:'Paste CSV with a header row. Convert it into structured JSON without uploading the file.',
 json:'Paste a valid JSON object or array. Validate, format or minify, then copy the output.',
 encode:'Enter text and choose URL or Base64 encoding. Decode with the matching mode.',
 hash:'Enter text to generate a SHA-256 fingerprint. This is a one-way hash, not encryption.',
 uuid:'Generate a UUID and copy it for development, testing or identifying records.',
 contrast:'Adjust foreground and background colors and review their WCAG contrast ratio.',
 'quick-qr':'Enter a website address or text and create a scannable code.',
 'image-lab':'Drag in images and select the output format. Review dimensions and quality before exporting.',
 'pdf-lab':'Choose a supported PDF tool, select the document, then process it locally where supported.',
 'audio-lab':'Upload a supported audio file, choose processing options, then export the result.',
 'video-lab':'Open a supported video, review settings and export where your browser supports it.',
 'ai-chat':'Write a detailed prompt, review the provider and account settings, then submit.',
 'ai-image':'Describe the desired image, including subject, style and composition, then generate.',
 'ai-video':'Describe your video and available settings, then submit a generation request.',
 'ai-caption':'Enter a post topic and platform, and refine the generated caption.',
 'daily-tasks':'Add a task, mark items complete and keep a lightweight daily checklist.',
 'daily-notes':'Write and save a quick note. Export important notes for backup.',
 'daily-timer':'Start a focused session, pause when needed and restart to reset.',
 'daily-currency':'Select currencies and an amount. Rates are daily reference values, not bank quotes.',
 'daily-text':'Paste text to analyze, transform and copy the result.',
 'daily-password':'Generate passwords with browser cryptography and store them securely.',
 'daily-date':'Pick two dates to calculate the interval between them.',
 'daily-backup':'Export a backup file before clearing or moving browser data.',
 'daily-dictionary':'Enter an English word to retrieve a definition where the provider is available.',
 'daily-books':'Search Open Library by book title or author.',
 'daily-calculator':'Enter numbers and select a supported arithmetic operation.',
 'daily-seo':'Enter a page title and description to review length and readability.',
 'windows-activation':'Check Windows licence status and compare with the official Microsoft guidance.',
 'office-activation':'Sign in with the licence-owning Microsoft account and inspect activation status.',
 'activation-diagnostics':'Review built-in Windows diagnostic commands before taking corrective action.',
 'mas-methods':'Read the original documentation and understand licensing implications first.',
 'winget':'Find the official package ID and copy an install command.',
 'windows-help':'Inspect Windows and Office diagnostics and troubleshooting guides.',
 'speed-test':'Run an on-demand test against the hosting server and review measured latency and throughput.'
};
const samples={
 text:{id:'text-content',value:'Write clear, helpful website content that your customers can understand.'},
 csv:{id:'csv-content',value:'name,city,role\nAli,Lahore,Designer\nSara,Karachi,Developer'},
 json:{id:'hub-json-input',value:'{"project":"Connect","tools":["JSON","QR","PDF"],"enabled":true}'},
 encode:{id:'hub-encode-input',value:'https://connect.vweb.dev/?q=hello world'},
 hash:{id:'hub-hash-input',value:'Example checksum input for Connect'},
 'daily-seo':{id:'daily-seo-title',value:'Free Online Developer Tools | VWEB.DEV Connect'},
 'daily-text':{id:'daily-text-tool',value:'One small step each day makes progress easier.'},
 'daily-dictionary':{id:'daily-word',value:'innovation'},
 'daily-books':{id:'daily-book',value:'The Design of Everyday Things'},
 'qr-url':{id:'qr-url',value:'https://connect.vweb.dev'},
 'qr-text':{id:'qr-text',value:'Explore useful browser tools with Connect'}
};
const outputCandidates=['[data-output]', '[data-result]', '.ai-result', '.convert-result', 'pre', 'output', 'textarea[readonly]', 'input[readonly]'];
function readOutput(section){for(const sel of outputCandidates){const els=[...section.querySelectorAll(sel)];for(const el of els){const val=('value'in el?el.value:el.textContent)||'';if(String(val).trim()&&!/^(result|output|waiting|formatted output appears here)/i.test(String(val).trim()))return String(val).trim().slice(0,200000)}}return''}
function tipsFor(t){let preset=descriptions[t.mode]||descriptions.focus;if(t.section==='ai')return['Write a clear and specific prompt','Check account/provider limits','Review and refine generated output'];if(t.section==='pc')return['Review the problem or licensing status','Follow the safe diagnostic steps','Confirm changes with official documentation'];if(t.section==='network')return['Check the self-hosted PHP backend','Start an on-demand measurement','Review results specific to this host'];return preset}
function bookmark(t){const key='connect.tools.bookmarks61';try{let list=JSON.parse(localStorage.getItem(key)||'[]');if(!Array.isArray(list))list=[];list=list.includes(t.id)?list.filter(x=>x!==t.id):[t.id,...list].slice(0,40);localStorage.setItem(key,JSON.stringify(list));return list.includes(t.id)}catch{return false}}
function saved(t){try{return (JSON.parse(localStorage.getItem('connect.tools.bookmarks61')||'[]')||[]).includes(t.id)}catch{return false}}
function createButton(text,onClick){const b=create('button','tool61-action',text);b.type='button';b.addEventListener('click',onClick);return b}
function liveInsight(t){
 const config={
  text:{id:'text-content',calculate:el=>{const v=el.value||'',words=v.trim()?v.trim().split(/\s+/).length:0;return words+' words · '+v.length+' characters · ~'+Math.ceil(words/225)+' min reading'}},
  csv:{id:'csv-content',calculate:el=>{const rows=el.value.trim()?el.value.trim().split(/\r?\n/):[];return rows.length?'~'+Math.max(0,rows.length-1)+' data rows · '+rows[0].split(',').length+' header columns':'Paste a CSV to preview row and column counts'}},
  json:{id:'hub-json-input',calculate:el=>{const v=el.value.trim();if(!v)return'Paste JSON to validate its structure';try{const parsed=JSON.parse(v);return '✓ Valid JSON · '+(Array.isArray(parsed)?parsed.length+' array items':parsed&&typeof parsed==='object'?Object.keys(parsed).length+' top-level keys':'Primitive value')}catch(e){return 'JSON needs attention · '+String(e.message).slice(0,95)}}},
  encode:{id:'hub-encode-input',calculate:el=>(el.value.length+' input characters · Browser-side encoding')},
  hash:{id:'hub-hash-input',calculate:el=>(el.value.length+' characters · SHA-256 is not reversible encryption')},
  password:{id:'password-output',calculate:el=>{const v=el.value||'';if(!v)return'Generate a password to review its length';const kinds=[/[a-z]/,/[A-Z]/,/[0-9]/,/[^a-zA-Z0-9]/].filter(re=>re.test(v)).length;return v.length+' characters · '+kinds+' character groups · Keep this password private'}},
  compress:{id:'image-file',calculate:el=>{const file=el.files?.[0];return file?file.name+' · '+(file.size/1024/1024).toFixed(2)+' MB input size':'Select an image to see file details before export'}}
 };
 const c=config[t.id];if(!c)return;
 const field=$(c.id);if(!field)return;
 let badge=field.parentElement?.querySelector('.tool61-live-insight');
 if(!badge){badge=create('div','tool61-live-insight');field.insertAdjacentElement('afterend',badge);}
 const update=()=>{badge.textContent=c.calculate(field);badge.classList.toggle('tool61-valid',badge.textContent.startsWith('✓'))};
 if(!field.dataset.tool61Insight){field.dataset.tool61Insight='1';field.addEventListener('input',update);field.addEventListener('change',update);
 if(t.id==='password')$('pass-create')?.addEventListener('click',()=>requestAnimationFrame(update));
 }
 update();
}
function activateTool(t){
 document.querySelectorAll('.tool61-toolbar,.tool61-guide').forEach(n=>n.remove());
 const hero=$('connect-tool59-hero');if(!hero)return;
 const toolbar=create('div','tool61-toolbar');toolbar.setAttribute('aria-label','Tool actions');
 const notice=create('span','tool61-privacy',(t.section==='ai'?'AI provider · account or credits may apply':t.section==='network'?'Self-hosted speed test · bandwidth usage':t.section==='pc'?'Windows / Office guidance':t.section==='daily'?'Local storage · where available':'Browser-first utility'));
 toolbar.append(notice);
 const buttons=create('div','tool61-actions');
 const save=createButton(saved(t)?'★ Saved':'☆ Save tool',()=>{const yes=bookmark(t);save.textContent=yes?'★ Saved':'☆ Save tool';save.setAttribute('aria-pressed',String(yes));});
 save.setAttribute('aria-pressed',String(saved(t)));buttons.append(save);
 buttons.append(createButton('↗ Copy link',async()=>{const btn=buttons.children[1];try{await navigator.clipboard.writeText(location.href);btn.textContent='✓ Link copied';setTimeout(()=>btn.textContent='↗ Copy link',1800)}catch{btn.textContent='Copy unavailable'}}));
 const example=samples[t.id];if(example)buttons.append(createButton('✦ Try example',()=>{const el=$(example.id);if(!el){return}el.value=example.value;el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));el.focus();}));
 if(t.section==='tools'||t.section==='daily')buttons.append(createButton('⌁ Copy output',async()=>{const block=$('page-'+t.section);const selected=block?.querySelector('.tool59-selected');const result=selected?readOutput(selected):'';const b=buttons.lastElementChild;if(!result){b.textContent='No result yet';setTimeout(()=>b.textContent='⌁ Copy output',1800);return}try{await navigator.clipboard.writeText(result);b.textContent='✓ Copied';setTimeout(()=>b.textContent='⌁ Copy output',1800)}catch{b.textContent='Clipboard unavailable'}}));
 toolbar.append(buttons);hero.append(toolbar);
 const details=create('details','tool61-guide'),summary=create('summary','','How to use '+t.title);details.append(summary);
 const inner=create('div','tool61-guide-content'),list=create('ol','tool61-howto');
 tipsFor(t).forEach(s=>list.append(create('li','',s)));inner.append(list,create('p','tool61-hint',hints[t.id]||t.description));details.append(inner);
 const related=$('connect-tool59-related');if(related)related.after(details);else hero.after(details);
 liveInsight(t);
}
function enhanceDirectory(){
 const root=$('connect-tool59-directory');if(!root||root.querySelector('.tool61-directory-search'))return;
 const grid=root.querySelector('.tool59-directory-grid');if(!grid)return;
 const input=create('input','tool61-directory-search');input.type='search';input.placeholder='Search tools by name, category or purpose…';input.setAttribute('aria-label','Search this tools directory');
 const meta=create('p','tool61-result-count');
 grid.before(input,meta);
 const empty=create('p','tool61-empty','No matching tools. Try a different keyword.');empty.hidden=true;grid.after(empty);
 const all=registry(),area=location.pathname.split('/')[1],items=area==='tools'?all:all.filter(t=>t.section===area),cards=[...grid.children];
 if(area==='tools'&&all.length>cards.length){grid.replaceChildren();for(const t of all){const a=create('a','tool59-directory-item');a.href=t.path;a.append(create('strong','',t.title),create('small','',t.description),create('span','','Open tool ↗'));grid.append(a)}}
 const entries=[...grid.querySelectorAll('a')];
 const doFilter=()=>{const q=input.value.trim().toLowerCase(),terms=q.split(/\s+/).filter(Boolean);let shown=0;entries.forEach(a=>{const t=all.find(x=>x.path===new URL(a.href,location.origin).pathname);const full=(a.textContent+' '+(t?.group||'')+' '+(t?.id||'')).toLowerCase();const match=terms.every(term=>full.includes(term));a.hidden=!match;if(match)shown++});meta.textContent=shown+' of '+entries.length+' tools';empty.hidden=shown>0};
 input.addEventListener('input',doFilter);doFilter();
}
function refresh(){
 const path=location.pathname;const t=registry().find(x=>x.path===path);
 if(t)activateTool(t);else{document.querySelectorAll('.tool61-toolbar,.tool61-guide').forEach(n=>n.remove());}
 enhanceDirectory();
}
window.addEventListener('popstate',()=>requestAnimationFrame(refresh));
window.addEventListener('pageshow',refresh);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',refresh,{once:true});else refresh();
})();


/* v62: real workspace affordances without replacing existing processing engines. */
(()=>{
const route=()=>window.ConnectToolRoutes?.tools?.find(t=>t.path===location.pathname);
let activeKey='',cleanup=()=>{};
function init(){
 const tool=route(),panel=document.querySelector('.tool59-selected');
 if(!tool||!panel)return;
 const key=tool.path;
 if(key===activeKey&&document.querySelector('.tool62-workspace'))return;
 cleanup();activeKey=key;
 document.querySelectorAll('.tool62-workspace').forEach(n=>n.remove());
 const controls=document.createElement('div');controls.className='tool62-workspace';
 const heading=document.createElement('div');heading.className='tool62-workspace-intro';
 heading.innerHTML='<strong>Workspace controls</strong><small>Work directly in this tool · no account required for local utilities</small>';
 const buttons=document.createElement('div');buttons.className='tool62-workspace-buttons';
 controls.append(heading,buttons);
 const actions=[];
 const add=(label,fn)=>{const b=document.createElement('button');b.type='button';b.className='tool62-button';b.textContent=label;b.addEventListener('click',fn);buttons.append(b);return b};
 const fields=[...panel.querySelectorAll('textarea,input:not([type=hidden]),select')].filter(el=>!el.disabled);
 const isPrivate=/password|activation|office|ai-|mas-/.test(tool.id)||tool.section==='ai';
 const storageKey='connect.draft62.'+tool.id;
 const textFields=fields.filter(el=>((el.tagName==='TEXTAREA')||(el.tagName==='INPUT'&&['text','search','url','email','number'].includes(el.type)))&&!el.readOnly&&!/password|token|key|secret/i.test(el.id+' '+el.name));
 const textArea=textFields.find(x=>x.tagName==='TEXTAREA')||textFields[0];
 if(textArea&&!isPrivate){
  const save=add('Save draft',()=>{try{localStorage.setItem(storageKey,JSON.stringify(textFields.map(x=>({id:x.id,name:x.name,value:x.value}))));save.textContent='✓ Draft saved';setTimeout(()=>save.textContent='Save draft',1400)}catch{save.textContent='Storage unavailable'}});
  add('Restore draft',()=>{try{const items=JSON.parse(localStorage.getItem(storageKey)||'[]');for(const item of items){const field=textFields.find(f=>(item.id&&f.id===item.id)||(item.name&&f.name===item.name));if(field){field.value=item.value;field.dispatchEvent(new Event('input',{bubbles:true}));field.dispatchEvent(new Event('change',{bubbles:true}));}}}catch{}});
  add('Clear draft',()=>{try{localStorage.removeItem(storageKey)}catch{}});
 }
 if(textArea)add('Clear input',()=>{textArea.value='';textArea.dispatchEvent(new Event('input',{bubbles:true}));textArea.focus()});
 const outputs=[...panel.querySelectorAll('output,pre,textarea[readonly],[data-output],[data-result]')];
 if(outputs.length)add('Download result',()=>{const item=outputs.map(n=>('value'in n?n.value:n.textContent)||'').filter(v=>v.trim()).pop();if(!item)return;const type=/json/i.test(tool.id)?'application/json':'text/plain';const ext=/json/i.test(tool.id)?'.json':'.txt';const blob=new Blob([item],{type:type+';charset=utf-8'}),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download='connect-'+tool.id+ext;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000)});
 const fileInputs=fields.filter(x=>x.type==='file');
 if(fileInputs.length){
  for(const input of fileInputs){
   const zone=document.createElement('div');zone.className='tool62-dropzone';zone.tabIndex=0;zone.setAttribute('role','button');zone.setAttribute('aria-label','Choose or drop files');
   const display=document.createElement('span');display.textContent='Drop files here, or choose files';zone.append(display);
   const status=()=>{const files=[...(input.files||[])];display.textContent=files.length?files.map(f=>f.name).slice(0,3).join(', ')+(files.length>3?' +'+(files.length-3)+' more':''):'Drop files here, or choose files'};
   zone.addEventListener('click',()=>input.click());zone.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();input.click()}});
   const drag=e=>{e.preventDefault();zone.classList.add('dragover')};zone.addEventListener('dragover',drag);zone.addEventListener('dragleave',()=>zone.classList.remove('dragover'));
   zone.addEventListener('drop',e=>{e.preventDefault();zone.classList.remove('dragover');if(!e.dataTransfer?.files?.length)return;try{const transfer=new DataTransfer();const allowed=[...e.dataTransfer.files].slice(0,input.multiple?50:1);allowed.forEach(f=>transfer.items.add(f));input.files=transfer.files;input.dispatchEvent(new Event('change',{bubbles:true}));status()}catch{display.textContent='Use Choose files in this browser'}});
   input.addEventListener('change',status);input.insertAdjacentElement('afterend',zone);actions.push(()=>{input.removeEventListener('change',status);zone.remove()});status();
  }
 }
 if(!buttons.children.length&&!fileInputs.length)return;
 const target=panel.querySelector('.tool-card')||panel;target.prepend(controls);
 cleanup=()=>{actions.forEach(fn=>fn());controls.remove()};
}
window.addEventListener('popstate',()=>setTimeout(init,80));
window.addEventListener('pageshow',()=>setTimeout(init,100));
window.addEventListener('connect:tool-route',()=>setTimeout(init,80));
document.addEventListener('DOMContentLoaded',()=>setTimeout(init,150),{once:true});
if(document.readyState!=='loading')setTimeout(init,150);
})();
