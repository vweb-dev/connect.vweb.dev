'use strict';
/* Dedicated VWEB.DEV Connect QR designer. All entered content stays in the browser.
 * QR styling is the open-source qr-code-styling library, lazy-loaded from a CDN.
 * QR codes here are static. There is no server redirect, scan tracking or analytics.
 */
(function(){
 const root=document.querySelector('#page-qr');if(!root)return;
 const $=s=>root.querySelector(s),$$=s=>Array.from(root.querySelectorAll(s));
 const types=new Set(['url','text','wifi','whatsapp','contact','email','sms','phone','location','event']);
 const presets={
  classic:{dark:'#17212b',dark2:'#17212b',light:'#ffffff',frame:'#ffffff',caption:'#17212b',gradient:false,dots:'square',eye:'square'},
  gold:{dark:'#2b241c',dark2:'#ae7b38',light:'#fffbf2',frame:'#e9d5ae',caption:'#28231d',gradient:true,dots:'rounded',eye:'extra-rounded'},
  ocean:{dark:'#073b5b',dark2:'#007c96',light:'#f2fdff',frame:'#e1f7fb',caption:'#073b5b',gradient:true,dots:'classy-rounded',eye:'dot'},
  rose:{dark:'#642c50',dark2:'#b2538d',light:'#fff6fb',frame:'#f7dfea',caption:'#622c4a',gradient:true,dots:'dots',eye:'extra-rounded'},
  midnight:{dark:'#e5d7a4',dark2:'#93afc7',light:'#111b29',frame:'#192638',caption:'#f3e5bc',gradient:true,dots:'rounded',eye:'extra-rounded'}
 };
 const init=$('#qr-design'),content=$('#qr-content'),status=$('#qr-status'),preview=$('#qr-preview'),frame=$('#qr-preview-frame');
 let qr=null,loadPromise=null,logo='',payload='',renderVersion=0,debounce=null,activeType='url',pending=false;
 const val=id=>String($('#'+id)?.value||'').trim();
 const setStatus=(msg,bad=false)=>{status.textContent=msg;status.classList.toggle('qr-note-warn',bad)};
 const escWifi=s=>s.replace(/([\\;,":])/g,'\\$1');
 const escCard=s=>s.replace(/\\/g,'\\\\').replace(/\r?\n/g,'\\n').replace(/([,;])/g,'\\$1');
 const escCal=s=>s.replace(/\\/g,'\\\\').replace(/\r?\n/g,'\\n').replace(/([,;])/g,'\\$1');
 function buildPayload(){
  switch(activeType){
   case 'url':{
    const raw=val('qr-url');if(!raw)throw Error('Enter a website URL.');
    const url=new URL(/^[a-z][a-z0-9+.-]*:/i.test(raw)?raw:'https://'+raw);
    if(!['http:','https:'].includes(url.protocol))throw Error('Only HTTPS or HTTP website URLs are supported.');
    return url.href;
   }
   case 'text':{const s=val('qr-text');if(!s)throw Error('Enter some text.');return s;}
   case 'wifi':{
    const ssid=val('qr-wifi-ssid'),security=val('qr-wifi-security');
    if(!ssid)throw Error('Enter the Wi-Fi network name.');
    if(security!=='nopass'&&!val('qr-wifi-password'))throw Error('Enter the Wi-Fi password.');
    return 'WIFI:T:'+security+';S:'+escWifi(ssid)+';P:'+(security==='nopass'?'':escWifi(val('qr-wifi-password')))+';'+($('#qr-wifi-hidden').checked?'H:true;':'')+';';
   }
   case 'whatsapp':{
    const digits=val('qr-wa-number').replace(/[\s()+-]/g,'');
    if(!/^\d{8,15}$/.test(digits))throw Error('Enter an international WhatsApp number (8–15 digits).');
    const message=val('qr-wa-message');
    return 'https://wa.me/'+digits+(message?'?text='+encodeURIComponent(message):'');
   }
   case 'contact':{
    const name=val('qr-contact-name');if(!name)throw Error('Enter a contact name.');
    const props=['BEGIN:VCARD','VERSION:3.0','FN:'+escCard(name)];
    for(const [field,key] of [['qr-contact-phone','TEL'],['qr-contact-email','EMAIL'],['qr-contact-company','ORG'],['qr-contact-website','URL']]){
     if(val(field))props.push(key+':'+escCard(val(field)));
    }
    props.push('END:VCARD');return props.join('\r\n');
   }
   case 'email':{
    const email=val('qr-email-to');
    if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))throw Error('Enter a valid recipient email address.');
    const params=new URLSearchParams();
    if(val('qr-email-subject'))params.set('subject',val('qr-email-subject'));
    if(val('qr-email-body'))params.set('body',val('qr-email-body'));
    return 'mailto:'+email+(params.size?'?'+params.toString():'');
   }
   case 'sms':{
    const phone=val('qr-sms-number');if(!/^[+()\d\s-]{7,22}$/.test(phone))throw Error('Enter a valid SMS phone number.');
    const message=val('qr-sms-message');
    return 'SMSTO:'+phone.replace(/[()\s-]/g,'')+':'+message;
   }
   case 'phone':{
    const phone=val('qr-phone-number');if(!/^[+()\d\s-]{7,22}$/.test(phone))throw Error('Enter a phone number.');
    return 'tel:'+phone.replace(/[()\s-]/g,'');
   }
   case 'location':{
    const lat=Number(val('qr-location-lat')),lng=Number(val('qr-location-lng'));
    if(!val('qr-location-lat')||!val('qr-location-lng')||!Number.isFinite(lat)||!Number.isFinite(lng)||Math.abs(lat)>90||Math.abs(lng)>180)throw Error('Enter valid latitude (−90…90) and longitude (−180…180).');
    return 'geo:'+lat+','+lng;
   }
   case 'event':{
    const title=val('qr-event-title'),start=val('qr-event-start'),end=val('qr-event-end');
    if(!title||!start||!end)throw Error('Enter an event name, start time and end time.');
    if(end<=start)throw Error('Event end must be after the start.');
    const stamp=s=>s.replace(/[-:]/g,'').replace('T','T')+'00';
    return ['BEGIN:VCALENDAR','VERSION:2.0','BEGIN:VEVENT','SUMMARY:'+escCal(title),'DTSTART:'+stamp(start),'DTEND:'+stamp(end),
     val('qr-event-location')?'LOCATION:'+escCal(val('qr-event-location')):'','END:VEVENT','END:VCALENDAR'].filter(Boolean).join('\r\n');
   }
   default:throw Error('Choose a content type.');
  }
 }
 function optsFor(text,size){
  const dark=val('qr-dark'),dark2=val('qr-dark2'),light=val('qr-light');
  const dots=$('#qr-gradient').checked?
   {type:val('qr-dots'),gradient:{type:val('qr-gradient-type'),rotation:Number(val('qr-gradient-angle'))*Math.PI/180,
    colorStops:[{offset:0,color:dark},{offset:1,color:dark2}]}}:
   {type:val('qr-dots'),color:dark};
  const eyes={type:val('qr-eyes'),color:val('qr-eye-color')||dark};
  return {width:size,height:size,type:'svg',data:text,margin:Number(val('qr-margin')),
   qrOptions:{errorCorrectionLevel:logo?'H':val('qr-ec')},
   dotsOptions:dots,cornersSquareOptions:eyes,
   cornersDotOptions:{type:val('qr-pupils'),color:val('qr-eye-color')||dark},
   backgroundOptions:{color:light},
   image:logo||undefined,
   imageOptions:{hideBackgroundDots:true,imageSize:Number(val('qr-logo-size'))/100,margin:4,
    crossOrigin:'anonymous',saveAsBlob:true}};
 }
 async function loadLibrary(){
  if(typeof window.QRCodeStyling==='function')return window.QRCodeStyling;
  if(loadPromise)return loadPromise;
  const urls=[
   'https://cdn.jsdelivr.net/npm/qr-code-styling@1.9.2/lib/qr-code-styling.js',
   'https://unpkg.com/qr-code-styling@1.9.2/lib/qr-code-styling.js'
  ];
  loadPromise=(async()=>{
   for(const src of urls){
    try{
     await new Promise((resolve,reject)=>{
      const script=document.createElement('script');script.src=src;script.async=true;script.referrerPolicy='no-referrer';
      let settled=false;const finish=err=>{if(settled)return;settled=true;clearTimeout(timer);if(err){script.remove();reject(err);}else resolve()};
      const timer=setTimeout(()=>finish(new Error('Library timed out')),11000);
      script.onload=()=>finish();script.onerror=()=>finish(new Error('Library could not load'));
      document.head.append(script);
     });
     if(typeof window.QRCodeStyling==='function')return window.QRCodeStyling;
    }catch(_){}
   }
   throw Error('QR engine unavailable. Connect to the internet and retry. Your content has not been uploaded.');
  })().catch(e=>{loadPromise=null;throw e});
  return loadPromise;
 }
 function updateFrame(){
  frame.style.setProperty('--qr-frame',val('qr-frame-color'));
  frame.style.setProperty('--qr-caption',val('qr-caption-color'));
  const caption=$('#qr-caption-preview'),label=val('qr-caption');
  caption.textContent=label;caption.hidden=!label;
 }
 function countBytes(text){
  const bytes=new TextEncoder().encode(text).length;
  $('#qr-byte-count').textContent=bytes+' / 850 bytes';
  return bytes;
 }
 function setReady(ready){
  $$('.qr-export-button').forEach(b=>b.disabled=!ready);
 }
 async function render(){
  const ticket=++renderVersion;clearTimeout(debounce);updateFrame();
  let data;
  try{data=buildPayload();const n=countBytes(data);if(n>850)throw Error('Content exceeds 850 UTF-8 bytes. Shorten it to keep the code scan-friendly.');}
  catch(e){payload='';setReady(false);setStatus(e.message,true);return;}
  pending=true;setReady(false);setStatus('Generating your live QR preview…');
  try{
   const QR=await loadLibrary();if(ticket!==renderVersion)return;
   const options=optsFor(data,300);
   if(qr)qr.update(options);
   else{preview.replaceChildren();qr=new QR(options);qr.append(preview);}
   payload=data;setReady(true);
   const caution=logo?' Logo applied · high error correction. Test scanning before print.':
     ($('#qr-gradient').checked?' Gradient applied · check scan contrast.':' Test on a real phone before printing.');
   setStatus('QR ready. Generated in your browser.'+caution);
   $('#qr-preview-state').textContent='LIVE PREVIEW';
  }catch(e){if(ticket!==renderVersion)return;payload='';setReady(false);setStatus(e.message,true);}
  finally{if(ticket===renderVersion)pending=false;}
 }
 function scheduleRender(){setReady(false);clearTimeout(debounce);debounce=setTimeout(render,240);}
 async function readLogo(file){
  if(!file)return;
  if(!['image/png','image/jpeg','image/webp'].includes(file.type)){setStatus('Logo must be PNG, JPG or WebP.',true);return;}
  if(file.size>1024*1024){setStatus('Logo must be under 1 MB.',true);return;}
  try{
   const data=await new Promise((resolve,reject)=>{
    const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=()=>reject(Error('Could not read logo.'));reader.readAsDataURL(file);
   });
   logo=data;$('#qr-logo-remove').disabled=false;scheduleRender();
  }catch(e){setStatus(e.message,true);}
 }
 async function svgBlob(size){
  if(!payload||pending)throw Error('Wait for a valid QR preview.');
  const QR=await loadLibrary();
  const generator=new QR(optsFor(payload,size));
  const result=await generator.getRawData('svg');
  if(!result)throw Error('Could not export SVG.');
  const xml=await result.text(),doc=new DOMParser().parseFromString(xml,'image/svg+xml');
  if(doc.querySelector('parsererror')||doc.documentElement.localName!=='svg')throw Error('SVG export failed.');
  const margin=Math.max(24,Math.round(size*.055)),caption=val('qr-caption').slice(0,40);
  const captionHeight=caption?Math.round(size*.105):0;
  const total=size+margin*2;
  const ns='http://www.w3.org/2000/svg',wrap=document.createElementNS(ns,'svg');
  wrap.setAttribute('xmlns',ns);wrap.setAttribute('width',String(total));wrap.setAttribute('height',String(total+captionHeight));
  wrap.setAttribute('viewBox','0 0 '+total+' '+(total+captionHeight));
  const bg=document.createElementNS(ns,'rect');
  bg.setAttribute('width',String(total));bg.setAttribute('height',String(total+captionHeight));
  bg.setAttribute('rx',String(Math.max(8,Math.round(size*.025))));bg.setAttribute('fill',val('qr-frame-color'));wrap.append(bg);
  const artwork=document.importNode(doc.documentElement,true);
  artwork.setAttribute('x',String(margin));artwork.setAttribute('y',String(margin));artwork.setAttribute('width',String(size));artwork.setAttribute('height',String(size));
  wrap.append(artwork);
  if(caption){
   const label=document.createElementNS(ns,'text');
   label.setAttribute('x',String(total/2));label.setAttribute('y',String(total+captionHeight*.66));
   label.setAttribute('text-anchor','middle');label.setAttribute('fill',val('qr-caption-color'));
   label.setAttribute('font-size',String(Math.max(15,Math.round(size*.041))));
   label.setAttribute('font-weight','700');label.setAttribute('font-family','Arial,sans-serif');
   label.textContent=caption;wrap.append(label);
  }
  return new Blob([new XMLSerializer().serializeToString(wrap)],{type:'image/svg+xml;charset=utf-8'});
 }
 async function rasterBlob(svg,mime,size){
  const url=URL.createObjectURL(svg);
  try{
   const image=new Image();image.decoding='async';
   await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=()=>reject(Error('Could not render image export.'));image.src=url});
   const canvas=document.createElement('canvas');canvas.width=image.naturalWidth||size;canvas.height=image.naturalHeight||size;
   const context=canvas.getContext('2d');
   if(!context)throw Error('Canvas export not supported in this browser.');
   context.drawImage(image,0,0);
   return await new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(Error('Could not encode the image.')),mime,.94));
  }finally{URL.revokeObjectURL(url)}
 }
 function saveBlob(blob,name){
  const link=document.createElement('a'),url=URL.createObjectURL(blob);
  link.href=url;link.download=name;document.body.append(link);link.click();link.remove();
  setTimeout(()=>URL.revokeObjectURL(url),2500);
 }
 async function download(format){
  if(!payload||pending)return;
  const btn=$('[data-qr-export="'+format+'"]');
  if(!btn)return;
  btn.disabled=true;
  try{
   setStatus('Preparing '+format.toUpperCase()+' export…');
   const dimension=Math.max(256,Math.min(2048,Number(val('qr-export-size'))||1024));
   const svg=await svgBlob(dimension);
   let blob=svg;
   if(format!=='svg'){
    const mime={png:'image/png',webp:'image/webp',jpeg:'image/jpeg'}[format];
    blob=await rasterBlob(svg,mime,dimension);
    if(blob.type!==mime)throw Error(format.toUpperCase()+' export is not supported by this browser.');
   }
   saveBlob(blob,'vweb-connect-qr.'+(format==='jpeg'?'jpg':format));
   setStatus(format.toUpperCase()+' downloaded. Scan-test before distributing.');
  }catch(e){setStatus(e.message,true);}
  finally{btn.disabled=false;}
 }
 async function copyText(){
  if(!payload)return;
  try{await navigator.clipboard.writeText(payload);setStatus('QR content copied.');}
  catch(_){setStatus('Clipboard unavailable; select the original content and copy it.',true);}
 }
 async function copyImage(){
  if(!payload||!window.ClipboardItem||!navigator.clipboard?.write)return setStatus('Image copying is unavailable in this browser. Use PNG download.',true);
  try{
   const svg=await svgBlob(640),png=await rasterBlob(svg,'image/png',640);
   await navigator.clipboard.write([new ClipboardItem({'image/png':png})]);setStatus('QR image copied to clipboard.');
  }catch(e){setStatus(e.message,true);}
 }
 function applyPreset(name){
  const style=presets[name];if(!style)return;
  for(const [id,key] of [['qr-dark','dark'],['qr-dark2','dark2'],['qr-light','light'],
    ['qr-frame-color','frame'],['qr-caption-color','caption']])$('#'+id).value=style[key];
  $('#qr-eye-color').value=style.dark;$('#qr-gradient').checked=style.gradient;
  $('#qr-dots').value=style.dots;$('#qr-eyes').value=style.eye;
  $$('.qr-preset').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.preset===name)));
  scheduleRender();
 }
 $$('.qr-type-button').forEach(button=>button.addEventListener('click',()=>{
  const next=button.dataset.qrType;if(!types.has(next))return;
  activeType=next;
  $$('.qr-type-button').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
  $$('[data-qr-pane]').forEach(p=>p.hidden=p.dataset.qrPane!==next);
  scheduleRender();
 }));
 $$('.qr-preset').forEach(b=>b.addEventListener('click',()=>applyPreset(b.dataset.preset)));
 init.addEventListener('submit',event=>event.preventDefault());
 init.addEventListener('input',event=>{
  if(event.target.id==='qr-caption')updateFrame();
  scheduleRender();
 });
 init.addEventListener('change',event=>{
  if(event.target.id==='qr-logo-file')readLogo(event.target.files?.[0]);else scheduleRender();
 });
 $('#qr-logo-remove').addEventListener('click',()=>{logo='';$('#qr-logo-file').value='';$('#qr-logo-remove').disabled=true;scheduleRender()});
 $('#qr-reset').addEventListener('click',()=>{
  init.reset();logo='';$('#qr-logo-file').value='';$('#qr-logo-remove').disabled=true;
  activeType='url';
  $$('.qr-type-button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.qrType==='url')));
  $$('[data-qr-pane]').forEach(p=>p.hidden=p.dataset.qrPane!=='url');
  applyPreset('classic');
 });
 $$('.qr-export-button').forEach(button=>button.addEventListener('click',()=>download(button.dataset.qrExport)));
 $('#qr-copy-data').addEventListener('click',copyText);
 $('#qr-copy-image').addEventListener('click',copyImage);
 $('#qr-retry').addEventListener('click',render);
 window.addEventListener('hashchange',()=>{if(location.hash==='#qr'&&(!qr||!payload))render();});
 updateFrame();setReady(false);
 if(location.hash==='#qr')render();
})();
