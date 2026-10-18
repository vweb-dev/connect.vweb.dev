'use strict';
/* VWEB.DEV Convert Studio.
 * No user files are uploaded. Conversion stays in browser memory.
 * PDF helper library is loaded on demand from jsDelivr only, pinned version.
 */
(() => {
const $=(s)=>document.querySelector(s);
const $$=(s)=>[...document.querySelectorAll(s)];
const tabs=['image','pdf','audio','video'];
const inputs={image:$('#convert-image-input'),pdf:$('#convert-pdf-input'),audio:$('#convert-audio-input'),video:$('#convert-video-input')};
const files={image:[],pdf:[],audio:[],video:[]};
const processing=new Set();
const objectURLs=new Set();
let pdfMode='merge', pdfLoad=null,audioSrc=null,videoSrc=null;
const prettySize=(n)=>{
 if(!Number.isFinite(n))return '?';
 if(n<1024)return n+' B';
 if(n<1024*1024)return (n/1024).toFixed(1)+' KB';
 return (n/(1024*1024)).toFixed(2)+' MB';
};
const baseName=(s)=>String(s).replace(/\.[^.]+$/,'').replace(/[^\w .()\-]+/g,'_').slice(0,110)||'file';
const formatTime=(n)=>Number.isFinite(n)?(Math.floor(n/60)+':'+String(Math.floor(n%60)).padStart(2,'0')):'unknown';
const mimeExt={'image/jpeg':'jpg','image/png':'png','image/webp':'webp','image/avif':'avif'};
function status(kind,msg,state='idle'){
 const elem=$('#convert-'+kind+'-status');elem.textContent=msg;elem.dataset.state=state;
}
function text(tag,value,className){
 const el=document.createElement(tag);el.textContent=value;if(className)el.className=className;return el;
}
function managedURL(blob){const url=URL.createObjectURL(blob);objectURLs.add(url);return url;}
function revokeURL(url){if(!url)return;URL.revokeObjectURL(url);objectURLs.delete(url);}
function cleanupResults(kind){
 const el=$('#convert-'+kind+'-results');
 for(const url of [...el.querySelectorAll('a[href^="blob:"]')].map(a=>a.href))revokeURL(url);
 el.replaceChildren();
}
function showFiles(kind){
 const root=$('#convert-'+kind+'-list');
 if(!root)return;
 root.replaceChildren();
 files[kind].forEach((file,index)=>{
  const row=text('div','','convert-file-row');
  const kindLabel=text('span',(file.name.split('.').pop()||'FILE').slice(0,4).toUpperCase(),'convert-file-type');
  const info=text('div','','convert-file-info');
  info.append(text('strong',file.name),text('small',prettySize(file.size)+' · on your device'));
  const remove=text('button','×');remove.type='button';remove.setAttribute('aria-label','Remove '+file.name);
  remove.addEventListener('click',()=>{if(processing.has(kind))return;files[kind].splice(index,1);inputs[kind].value='';showFiles(kind);cleanupResults(kind);});
  row.append(kindLabel,info,remove);root.append(row);
 });
}
function attachFiles(kind,values) {
 if(processing.has(kind))return;
 const list=[...values];
 if(!list.length)return;
 const accepted = kind==='image'?list.filter(f=>f.type.startsWith('image/')):
  kind==='pdf'?list.filter(f=>f.type==='application/pdf'||/\.pdf$/i.test(f.name)):
  kind==='audio'?list.filter(f=>f.type.startsWith('audio/')||/\.(mp3|wav|m4a|ogg|aac|flac)$/i.test(f.name)):
   list.filter(f=>f.type.startsWith('video/')||/\.(mp4|webm|mov)$/i.test(f.name));
 if(accepted.length!==list.length)status(kind,'Some files were not recognized as supported input types.','error');
 const maximum=kind==='image'?20:kind==='pdf'?30:1;
 if(accepted.some(f=>f.size>100*1024*1024)){
  status(kind,'For reliable local processing, each file must be at most 100 MB.','error');
  return;
 }
 if(kind==='audio'||kind==='video'){
  // The last selected file becomes active. Avoid retaining huge buffers.
  if(kind==='audio'&&audioSrc){revokeURL(audioSrc);audioSrc=null;}
  if(kind==='video'&&videoSrc){revokeURL(videoSrc);videoSrc=null;}
  files[kind]=accepted.slice(0,1);
 }else{
  const prev=files[kind];
  files[kind]=[...prev,...accepted].slice(0,maximum);
  if(prev.length+accepted.length>maximum)status(kind,'Maximum '+maximum+' files allowed in one batch.','error');
 }
 showFiles(kind);cleanupResults(kind);
 if(kind==='audio'){
  const f=files.audio[0],preview=$('#convert-audio-preview');
  preview.pause();preview.removeAttribute('src');preview.hidden=!f;
  if(f){audioSrc=managedURL(f);preview.src=audioSrc;preview.load();
   $('#convert-audio-meta').textContent=f.name+' · '+prettySize(f.size);
  }else $('#convert-audio-meta').textContent='';
 }
 if(kind==='video'){
  const f=files.video[0],preview=$('#convert-video-preview');
  preview.pause();preview.removeAttribute('src');preview.hidden=!f;
  if(f){videoSrc=managedURL(f);preview.src=videoSrc;preview.load();
   $('#convert-video-meta').textContent=f.name+' · '+prettySize(f.size);
  }else $('#convert-video-meta').textContent='';
 }
 if(accepted.length&&kind!=='audio'&&kind!=='video')status(kind,files[kind].length+' file(s) ready. Configure output settings and select Convert.');
 else if(accepted.length)status(kind,'File ready. Configure settings and process locally.');
}
for(const kind of tabs){
 inputs[kind].addEventListener('change',event=>{attachFiles(kind,event.target.files);});
 const drop=$('#convert-'+kind+'-drop');
 // Native file input handles tap/browse. Drag and drop is an additional path.
 drop.addEventListener('dragover',ev=>{ev.preventDefault();drop.classList.add('is-dragging');});
 drop.addEventListener('dragleave',ev=>{if(!drop.contains(ev.relatedTarget))drop.classList.remove('is-dragging');});
 drop.addEventListener('drop',ev=>{ev.preventDefault();drop.classList.remove('is-dragging');attachFiles(kind,ev.dataTransfer.files);});
 $('#convert-'+kind+'-clear').addEventListener('click',()=>clearKind(kind));
}
function clearKind(kind){
 if(processing.has(kind))return;
 files[kind]=[];inputs[kind].value='';showFiles(kind);cleanupResults(kind);
 if(kind==='audio'){$('#convert-audio-preview').pause();$('#convert-audio-preview').hidden=true;
  revokeURL(audioSrc);audioSrc=null;$('#convert-audio-meta').replaceChildren();}
 if(kind==='video'){$('#convert-video-preview').pause();$('#convert-video-preview').hidden=true;
  revokeURL(videoSrc);videoSrc=null;$('#convert-video-meta').replaceChildren();}
 status(kind,'Ready for another local conversion.');
}
function chooseTab(kind,focus=false){
 if(!tabs.includes(kind))return;
 tabs.forEach(k=>{
  const active=k===kind,b=$('#convert-tab-'+k),pane=$('#convert-pane-'+k);
  pane.hidden=!active;b.classList.toggle('active',active);
  b.setAttribute('aria-selected',String(active));b.tabIndex=active?0:-1;
 });
 if(focus)$('#convert-tab-'+kind).focus({preventScroll:true});
}
tabs.forEach((kind,index)=>{
 const b=$('#convert-tab-'+kind);
 b.addEventListener('click',()=>chooseTab(kind));
 b.addEventListener('keydown',ev=>{
  const key=ev.key;let pos=index;
  if(key==='ArrowRight')pos=(index+1)%tabs.length;
  else if(key==='ArrowLeft')pos=(index+tabs.length-1)%tabs.length;
  else if(key==='Home')pos=0;else if(key==='End')pos=tabs.length-1;else return;
  ev.preventDefault();chooseTab(tabs[pos],true);
 });
});
chooseTab('image');
async function busy(kind,button,fn){
 if(processing.has(kind))return;
 processing.add(kind);button.disabled=true;button.setAttribute('aria-busy','true');
 const clear=$('#convert-'+kind+'-clear');clear.disabled=true;
 const previousInput=inputs[kind].disabled;inputs[kind].disabled=true;
 // Allow browser to paint loader before CPU-intensive processing.
 await new Promise(resolve=>requestAnimationFrame(()=>setTimeout(resolve,0)));
 try{await fn();}catch(err){
  status(kind,err&&err.message?err.message:'Conversion failed. Please try a compatible file.','error');
  console.warn('Local convert failed:',err);
 }finally{processing.delete(kind);button.disabled=false;button.removeAttribute('aria-busy');clear.disabled=false;inputs[kind].disabled=previousInput;}
}
function result(kind,label,blob,filename,details){
 const root=$('#convert-'+kind+'-results');
 const row=text('div','','convert-result'),info=text('div','','convert-result-main');
 info.append(text('strong',label||filename),text('small',details||prettySize(blob.size)));
 const a=text('a','Download ↓','button secondary');
 a.href=managedURL(blob);a.download=filename;a.rel='noopener';
 row.append(info,a);root.append(row);
}
const extension=(mime)=>mimeExt[mime]||'bin';
async function canvasBlob(canvas,mime,quality=0.82){
 const blob=await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error('Your browser cannot export this image type.')),mime,quality));
 if(blob.type!==mime && !(mime==='image/jpeg'&&blob.type==='image/jpg'))
  throw Error('Your browser cannot encode '+extension(mime).toUpperCase()+'. Choose JPEG, PNG or WebP.');
 return blob;
}
async function loadImage(file){
 const url=URL.createObjectURL(file);
 try{
  const img=new Image();img.decoding='async';
  img.src=url;
  await new Promise((resolve,reject)=>{
   img.onload=resolve;img.onerror=()=>reject(Error(file.name+': image format not supported by this browser.'));
   if(img.complete&&img.naturalWidth>0)resolve();
  });
  if(!img.naturalWidth||img.naturalWidth*img.naturalHeight>40000000)throw Error(file.name+': image too large for reliable browser processing (40 MP limit).');
  return img;
 }finally{URL.revokeObjectURL(url);}
}
async function imageAsBlob(file,options){
 const img=await loadImage(file);
 const scaled=Math.min(1,options.width>0?options.width/img.naturalWidth:1);
 const w=Math.max(1,Math.round(img.naturalWidth*scaled)),h=Math.max(1,Math.round(img.naturalHeight*scaled));
 const rotated=options.rotate===90||options.rotate===270;
 const canvas=document.createElement('canvas');
 canvas.width=rotated?h:w;canvas.height=rotated?w:h;
 if(canvas.width>8192||canvas.height>8192)throw Error('Maximum output dimension is 8192 px. Lower the width.');
 const ctx=canvas.getContext('2d',{alpha:options.mime!=='image/jpeg'});
 if(!ctx)throw Error('Your browser cannot initialize an image canvas.');
 if(options.mime==='image/jpeg'){ctx.fillStyle='#ffffff';ctx.fillRect(0,0,canvas.width,canvas.height);}
 ctx.translate(canvas.width/2,canvas.height/2);
 ctx.rotate(options.rotate*Math.PI/180);
 ctx.drawImage(img,-w/2,-h/2,w,h);
 return await canvasBlob(canvas,options.mime,options.quality);
}
function u16(v){return [v&255,(v>>>8)&255];}
function u32(v){return [v&255,(v>>>8)&255,(v>>>16)&255,(v>>>24)&255];}
function crc32(data){
 let crc=-1;
 for(const b of data){
  crc^=b;
  for(let i=0;i<8;i++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);
 }
 return (crc^(-1))>>>0;
}
async function zipStored(entries){
 const encoder=new TextEncoder(),locals=[],central=[];let offset=0;
 const limit=230*1024*1024;
 let total=0;
 for(const entry of entries)total+=entry.blob.size;
 if(total>limit)throw Error('Batch exceeds 230 MB. Download results individually to avoid running out of memory.');
 if(entries.length>200)throw Error('Too many files in this ZIP.');
 for(const entry of entries){
  const name=encoder.encode(entry.name.replace(/[\/\\]+/g,'_'));
  if(name.length>500)throw Error('Filename too long for ZIP.');
  const body=new Uint8Array(await entry.blob.arrayBuffer()),size=body.byteLength,crc=crc32(body);
  const dosDate=((2026-1980)<<9)|(1<<5)|1, dosTime=0,flags=0x0800;
  const local=new Uint8Array([
   0x50,0x4b,0x03,0x04,...u16(20),...u16(flags),...u16(0),...u16(dosTime),...u16(dosDate),
   ...u32(crc),...u32(size),...u32(size),...u16(name.length),...u16(0),...name
  ]);
  const header=new Uint8Array([
   0x50,0x4b,0x01,0x02,...u16(20),...u16(20),...u16(flags),...u16(0),...u16(dosTime),...u16(dosDate),
   ...u32(crc),...u32(size),...u32(size),...u16(name.length),...u16(0),...u16(0),
   ...u16(0),...u16(0),...u32(0),...u32(offset),...name
  ]);
  locals.push(local,body);central.push(header);offset+=local.byteLength+size;
 }
 const centralSize=central.reduce((sum,p)=>sum+p.byteLength,0);
 const footer=new Uint8Array([0x50,0x4b,0x05,0x06,...u16(0),...u16(0),...u16(entries.length),...u16(entries.length),...u32(centralSize),...u32(offset),...u16(0)]);
 return new Blob([...locals,...central,footer],{type:'application/zip'});
}
$('#convert-image-quality').addEventListener('input',e=>{$('#convert-image-quality-label').textContent=e.target.value+'%';});
$('#convert-image-run').addEventListener('click',function(){busy('image',this,async()=>{
 const selection=[...files.image];
 if(!selection.length)throw Error('Choose at least one image.');
 cleanupResults('image');
 const mime=$('#convert-image-format').value;
 const width=Number($('#convert-image-width').value);
 if(!Number.isInteger(width)||width<0||width>8000)throw Error('Enter a width between 0 and 8000 px.');
 const options={mime,width,rotate:Number($('#convert-image-rotate').value),quality:Number($('#convert-image-quality').value)/100};
 const done=[],errors=[];
 for(let i=0;i<selection.length;i++){
  const f=selection[i];status('image','Converting '+(i+1)+' of '+selection.length+': '+f.name,'working');
  await new Promise(r=>setTimeout(r,8));
  try{
   const output=await imageAsBlob(f,options);
   const name=baseName(f.name)+'-vweb.'+extension(mime);
   done.push({name,blob:output});
   result('image',name,output,name,prettySize(f.size)+' → '+prettySize(output.size));
  }catch(err){errors.push(f.name+': '+err.message);}
 }
 if(done.length>1){
  status('image','Packaging '+done.length+' images into a ZIP…','working');
  try{const archive=await zipStored(done);result('image','Download all images',archive,'vweb-converted-images.zip',done.length+' files · '+prettySize(archive.size));}
  catch(err){errors.push('ZIP: '+err.message);}
 }
 if(errors.length)status('image',done.length+' converted; '+errors.length+' issue(s): '+errors.slice(0,2).join(' | '),'error');
 else status('image',done.length+' image(s) successfully converted locally. Use Download to save.','success');
});});

// Load pdf-lib from a pinned CDN only on explicit PDF operation.
// The script download transfers NO user file contents.
function getPdfLib(){
 if(window.PDFLib)return Promise.resolve(window.PDFLib);
 if(pdfLoad)return pdfLoad;
 pdfLoad=new Promise((resolve,reject)=>{
  const script=document.createElement('script');
  const timer=setTimeout(()=>{script.remove();pdfLoad=null;reject(Error('PDF helper download timed out. Check jsDelivr connectivity.'));},15000);
  script.src='https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js';
  script.async=true;
  script.onload=()=>{clearTimeout(timer);if(window.PDFLib)resolve(window.PDFLib);else{pdfLoad=null;reject(Error('PDF helper loaded without PDF functionality.'));}};
  script.onerror=()=>{clearTimeout(timer);pdfLoad=null;reject(Error('Cannot load the PDF helper on this network. Try later.'));};
  document.head.append(script);
 });
 return pdfLoad;
}
function parseRange(text,maxPage){
 if(!text.trim())throw Error('Enter page numbers, for example 1-3, 5.');
 const all=[],seen=new Set();
 for(const part of text.split(',')){
  const m=part.trim().match(/^(\d+)(?:\s*-\s*(\d+))?$/);
  if(!m)throw Error('Invalid page range. Use 1-3, 5, 8.');
  const from=Number(m[1]),to=m[2]?Number(m[2]):from;
  if(from<1||to<from||to>maxPage)throw Error('Page range must be 1–'+maxPage+'.');
  if(to-from>350)throw Error('Page range too large.');
  for(let p=from;p<=to;p++)if(!seen.has(p)){all.push(p-1);seen.add(p);}
 }
 if(all.length>350)throw Error('Too many pages selected; choose up to 350.');
 return all;
}
$$('[data-pdf-mode]').forEach(btn=>btn.addEventListener('click',()=>{
 if(processing.has('pdf'))return;
 pdfMode=btn.dataset.pdfMode;
 $$('[data-pdf-mode]').forEach(other=>other.classList.toggle('active',other===btn));
 $('#convert-extract-settings').hidden=pdfMode!=='extract';
 inputs.pdf.accept=pdfMode==='photos'?'image/*':'application/pdf,.pdf';
 inputs.pdf.multiple=pdfMode!=='extract'&&pdfMode!=='split';
 $('#convert-pdf-hint').textContent=pdfMode==='photos'?'Choose PNG, JPEG or WebP photographs. One photo per page.':
  pdfMode==='extract'?'Choose a PDF and enter page numbers to extract.':pdfMode==='split'?'Choose one PDF to split into separate pages.':'Choose two or more PDFs. Files merge in the order shown.';
 files.pdf=[];inputs.pdf.value='';showFiles('pdf');cleanupResults('pdf');
 status('pdf','Ready for '+({merge:'PDF merging',extract:'page extraction',split:'splitting into pages',photos:'image-to-PDF conversion'}[pdfMode])+'.');
}));
// Apply mode-specific input type checks through PDF drop/input filtering.
// Update PDF file attachments directly in response handlers below.
$('#convert-pdf-run').addEventListener('click',function(){busy('pdf',this,async()=>{
 const source=[...files.pdf],PDF=await getPdfLib();
 if(!source.length)throw Error('Choose the required files first.');
 if(source.reduce((n,f)=>n+f.size,0)>150*1024*1024)throw Error('Total input is over 150 MB. Split into smaller batches.');
 cleanupResults('pdf');status('pdf','Processing '+source.length+' document(s) on your device…','working');
 if(pdfMode==='merge'){
  if(source.length<2)throw Error('Choose at least two PDFs to merge.');
  const merged=await PDF.PDFDocument.create();
  for(let i=0;i<source.length;i++){
   const doc=await PDF.PDFDocument.load(await source[i].arrayBuffer());
   const selected=await merged.copyPages(doc,doc.getPageIndices());
   selected.forEach(p=>merged.addPage(p));
   status('pdf','Merging document '+(i+1)+' of '+source.length+'…','working');
  }
  const bytes=await merged.save();const blob=new Blob([bytes],{type:'application/pdf'});
  result('pdf','Merged PDF',blob,'vweb-merged.pdf',merged.getPageCount()+' pages · '+prettySize(blob.size));
 } else if(pdfMode==='extract'){
  if(source.length!==1)throw Error('Choose exactly one PDF.');
  const doc=await PDF.PDFDocument.load(await source[0].arrayBuffer());
  const indices=parseRange($('#convert-pdf-range').value,doc.getPageCount());
  const out=await PDF.PDFDocument.create();
  (await out.copyPages(doc,indices)).forEach(p=>out.addPage(p));
  const blob=new Blob([await out.save()],{type:'application/pdf'});
  result('pdf','Selected pages',blob,baseName(source[0].name)+'-pages.pdf',indices.length+' pages · '+prettySize(blob.size));
 } else if(pdfMode==='split'){
  if(source.length!==1)throw Error('Choose one PDF to split.');
  const doc=await PDF.PDFDocument.load(await source[0].arrayBuffer());
  const count=doc.getPageCount();
  if(count<2)throw Error('Document only contains one page.');
  if(count>120)throw Error('Split up to 120 pages at once to protect device memory.');
  const pages=[];
  for(let i=0;i<count;i++){
   const single=await PDF.PDFDocument.create();
   const [page]=await single.copyPages(doc,[i]);single.addPage(page);
   const blob=new Blob([await single.save()],{type:'application/pdf'});
   pages.push({name:baseName(source[0].name)+'-page-'+String(i+1).padStart(3,'0')+'.pdf',blob});
   if(i%4===0){status('pdf','Splitting page '+(i+1)+' of '+count+'…','working');await new Promise(resolve=>setTimeout(resolve,0));}
  }
  const archive=await zipStored(pages);
  result('pdf',count+' separate PDF pages',archive,baseName(source[0].name)+'-pages.zip',prettySize(archive.size));
 } else if(pdfMode==='photos'){
  const doc=await PDF.PDFDocument.create(),margin=25;
  for(let i=0;i<source.length;i++){
   const file=source[i];if(!file.type.startsWith('image/'))throw Error('Photo to PDF accepts image files only.');
   const jpeg=await imageAsBlob(file,{mime:'image/jpeg',width:2000,rotate:0,quality:0.87});
   const image=await doc.embedJpg(await jpeg.arrayBuffer());
   const width=595.28,height=841.89;
   const page=doc.addPage([width,height]);
   const scale=Math.min((width-2*margin)/image.width,(height-2*margin)/image.height);
   const w=image.width*scale,h=image.height*scale;
   page.drawImage(image,{x:(width-w)/2,y:(height-h)/2,width:w,height:h});
   status('pdf','Embedding photo '+(i+1)+' of '+source.length+'…','working');
  }
  const blob=new Blob([await doc.save()],{type:'application/pdf'});
  result('pdf','Photos converted to PDF',blob,'vweb-images.pdf',doc.getPageCount()+' A4 pages · '+prettySize(blob.size));
 }
 status('pdf','PDF created successfully in your browser. Download is ready.','success');
});});
// Explicit image/PDF type guard at interaction boundary.
const pdfInput=inputs.pdf, pdfDrop=$('#convert-pdf-drop');
function pdfPick(items){
 const arr=[...items],matches=pdfMode==='photos'?
  arr.filter(x=>x.type.startsWith('image/')||/\.(jpg|jpeg|png|webp|avif)$/i.test(x.name)):
  arr.filter(x=>x.type==='application/pdf'||/\.pdf$/i.test(x.name));
 if(matches.length!==arr.length)status('pdf','Unsupported file type for this PDF operation.','error');
 if(!matches.length)return;
 files.pdf=(pdfMode==='extract'||pdfMode==='split')?matches.slice(0,1):[...files.pdf,...matches].slice(0,30);
 pdfInput.value='';showFiles('pdf');cleanupResults('pdf');
 status('pdf',files.pdf.length+' input file(s) ready.');
}
// Capture input before the generic handler, so PDF mode-specific types
// are handled exactly once via stopImmediatePropagation.
pdfInput.addEventListener('change',e=>{e.stopImmediatePropagation();pdfPick(e.target.files);},true);
pdfDrop.addEventListener('drop',e=>{e.preventDefault();e.stopImmediatePropagation();pdfDrop.classList.remove('is-dragging');pdfPick(e.dataTransfer.files);},true);

function wav16(buffer,start,end,mono){
 const channels=mono?1:Math.min(2,buffer.numberOfChannels);
 const sampleRate=buffer.sampleRate;
 const from=Math.floor(start*sampleRate),to=Math.ceil(end*sampleRate);
 const count=to-from;
 const bytes=44+count*channels*2;
 if(bytes>175*1024*1024)throw Error('Result would exceed 175 MB. Trim a shorter selection.');
 const out=new ArrayBuffer(bytes),view=new DataView(out),data=new Uint8Array(out);
 const set=(at,s)=>{for(let i=0;i<s.length;i++)data[at+i]=s.charCodeAt(i);};
 set(0,'RIFF');view.setUint32(4,bytes-8,true);set(8,'WAVE');set(12,'fmt ');
 view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,channels,true);
 view.setUint32(24,sampleRate,true);view.setUint32(28,sampleRate*channels*2,true);
 view.setUint16(32,channels*2,true);view.setUint16(34,16,true);set(36,'data');view.setUint32(40,bytes-44,true);
 const ch=Array.from({length:buffer.numberOfChannels},(_,i)=>buffer.getChannelData(i));
 let offset=44;
 for(let i=from;i<to;i++){
  for(let c=0;c<channels;c++){
   const sample=mono?ch.reduce((n,arr)=>n+arr[i],0)/ch.length:ch[c][i];
   const clamped=Math.max(-1,Math.min(1,sample));
   view.setInt16(offset,clamped<0?clamped*0x8000:clamped*0x7fff,true);offset+=2;
  }
 }
 return new Blob([out],{type:'audio/wav'});
}
$('#convert-audio-run').addEventListener('click',function(){busy('audio',this,async()=>{
 const file=files.audio[0];
 if(!file)throw Error('Choose an audio file first.');
 if(file.size>75*1024*1024)throw Error('Large audio files may exhaust device memory. Use one under 75 MB.');
 cleanupResults('audio');status('audio','Decoding audio with your browser audio engine…','working');
 const AudioCtx=window.AudioContext||window.webkitAudioContext;
 if(!AudioCtx)throw Error('Your browser does not support local audio decoding.');
 const context=new AudioCtx();
 let buffer;
 try{buffer=await context.decodeAudioData(await file.arrayBuffer());}
 catch(err){throw Error('This browser cannot decode that audio format. Try MP3, WAV or compatible M4A.');}
 finally{await context.close().catch(()=>{});}
 if(buffer.duration>1800)throw Error('Limit processing to audio tracks shorter than 30 minutes.');
 const start=Number($('#convert-audio-start').value||0),end=$('#convert-audio-end').value?Number($('#convert-audio-end').value):buffer.duration;
 if(!Number.isFinite(start)||!Number.isFinite(end)||start<0||end>buffer.duration+.02||end<=start)
  throw Error('Enter a valid trim start/end within '+buffer.duration.toFixed(1)+' seconds.');
 status('audio','Creating '+formatTime(end-start)+' of 16-bit WAV audio…','working');
 await new Promise(resolve=>setTimeout(resolve,10));
 const mono=$('#convert-audio-channels').value==='1';
 const blob=wav16(buffer,start,Math.min(end,buffer.duration),mono);
 result('audio','WAV audio ready',blob,baseName(file.name)+'-vweb.wav',formatTime(end-start)+' · '+prettySize(blob.size));
 status('audio','WAV converted locally. Original track remains unchanged.','success');
});});

const video=$('#convert-video-preview');
async function untilEvent(elem,event,ms){
 await new Promise((resolve,reject)=>{
  let done=false;
  const finish=(err)=>{if(done)return;done=true;clearTimeout(timer);elem.removeEventListener(event,onOk);elem.removeEventListener('error',onError);err?reject(err):resolve();};
  const onOk=()=>finish(),onError=()=>finish(Error('Video could not be decoded by the browser.'));
  const timer=setTimeout(()=>finish(Error('Video decoding timed out. Try an MP4 with H.264/AAC codec.')),ms);
  elem.addEventListener(event,onOk,{once:true});elem.addEventListener('error',onError,{once:true});
 });
}
$('#convert-video-run').addEventListener('click',function(){busy('video',this,async()=>{
 const file=files.video[0];
 if(!file)throw Error('Choose a video file.');
 cleanupResults('video');
 if(video.readyState<1)await untilEvent(video,'loadedmetadata',12000);
 if(!video.videoWidth||!video.videoHeight||!Number.isFinite(video.duration))
  throw Error('This browser cannot decode this video format or does not expose video duration.');
 const time=Number($('#convert-video-time').value||0);
 if(!Number.isFinite(time)||time<0||time>video.duration)
  throw Error('Choose a time between 0 and '+video.duration.toFixed(1)+' seconds.');
 video.pause();
 const target=Math.min(time,Math.max(0,video.duration-0.08));
 status('video','Seeking to frame at '+target.toFixed(1)+'s…','working');
 if(Math.abs(video.currentTime-target)>0.04){
  const seek=untilEvent(video,'seeked',14000);
  video.currentTime=target;
  await seek;
 }
 if(video.readyState<2)await untilEvent(video,'loadeddata',12000);
 const canvas=document.createElement('canvas');
 canvas.width=video.videoWidth;canvas.height=video.videoHeight;
 if(canvas.width*canvas.height>35000000)throw Error('Frame exceeds browser memory limit (35 MP).');
 const ctx=canvas.getContext('2d');if(!ctx)throw Error('Unable to create video snapshot canvas.');
 ctx.drawImage(video,0,0);
 const mime=$('#convert-video-format').value,blob=await canvasBlob(canvas,mime,.92);
 const name=baseName(file.name)+'-'+Math.floor(time*1000)+'ms.'+extension(mime);
 result('video','Captured frame at '+time.toFixed(1)+'s',blob,name,canvas.width+' × '+canvas.height+' · '+prettySize(blob.size));
 status('video','Video frame captured locally. Download your image.','success');
});});
// Release file-backed memory when the page closes. Audio/video are never sent
// to backend endpoints or other origins; PDF helper script carries no files.
window.addEventListener('pagehide',()=>{
 for(const url of objectURLs)URL.revokeObjectURL(url);
 objectURLs.clear();
});
})();
