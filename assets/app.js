'use strict';
(function () {
var $ = function (s) { return document.querySelector(s); };
var $$ = function (s) { return Array.from(document.querySelectorAll(s)); };
var routes=['home','studios','academy','pc','apps','dashboard','convert','tools','ai','play','offers','community','account'];

var contextTitles={
 home:'Overview',studios:'Tool Studios',academy:'Video Academy',pc:'Windows & PC Help',
 apps:'App Directory',dashboard:'My Workspace',convert:'File Converter',tools:'Quick Utilities',
 ai:'AI Studio',play:'Games & Quizzes',
 offers:'Deals',community:'Local & Learn',account:'My Account'
};
var contextRelated={
 studios:[['#tools','Quick utilities'],['#convert','File converter'],['#apps','App directory']],
 academy:[['#dashboard','My progress'],['#apps','Useful apps'],['#tools','Quick tools']],
 pc:[['#apps','Software directory'],['#tools','Browser tools'],['#academy','Learn Windows']],
 apps:[['#pc','WinGet builder'],['#studios','Tool studios'],['#dashboard','Saved apps']],
 dashboard:[['#academy','Continue learning'],['#apps','Find apps'],['#tools','Quick tools']],
 convert:[['#tools','Quick utilities'],['#studios','Tool studios'],['#dashboard','My workspace']],
 tools:[['#convert','File converter'],['#studios','Tool studios'],['#apps','App directory']],
 ai:[['#tools','Free utilities'],['#academy','Video academy'],['#studios','Tool studios']],
 play:[['#academy','Academy'],['#tools','Quick tools'],['#apps','App directory']],
 offers:[['#apps','App directory'],['#community','Community'],['#studios','Tool studios']],
 community:[['#academy','Academy'],['#play','Games & quizzes'],['#apps','Useful apps']],
 account:[['#dashboard','Local workspace'],['#apps','Apps'],['#home','Overview']]
};
function renderContext(key){
 var container=$('#hub-context');
 if(!container)return;
 container.hidden=key==='home';
 if(key==='home')return;
 $('#hub-context-label').textContent=contextTitles[key]||'Connect';
 var nav=$('#hub-context-actions');nav.replaceChildren();
 (contextRelated[key]||[]).forEach(function(item){
  var link=document.createElement('a');link.href=item[0];link.textContent=item[1]+' ↗';nav.append(link);
 });
}

function route(focusHeading){
  var key=location.hash.replace('#','')||'home';
  if(['watch','discover','tv','listen'].includes(key)){key='home';history.replaceState(null,'','#home');}
  if(key==='internet'||key==='rewards'){key='dashboard';history.replaceState(null,'','#dashboard');}
  if(routes.indexOf(key)<0)key='home';
  $$('.page').forEach(function(el){el.hidden=el.id!=='page-'+key;});
  $$('[data-nav]').forEach(function(el){var active=el.dataset.nav===key;el.classList.toggle('active',active);if(active){el.setAttribute('aria-current','page');}else{el.removeAttribute('aria-current');}});
  document.title=(key==='home'?'VWEB.DEV Connect':key.charAt(0).toUpperCase()+key.slice(1)+' | VWEB.DEV Connect');
  renderContext(key);
  if(focusHeading){
    var heading=$('#page-'+key+' h1');
    if(heading){heading.setAttribute('tabindex','-1');heading.focus({preventScroll:true});}
  }
  window.scrollTo(0,0);
}
window.addEventListener('hashchange',function(){route(true);});route(false);
// Mobile app navigation is handled independently by assets/mobile-app.js.
$('#year').textContent=new Date().getFullYear();
if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('/sw.js').catch(function(){});});}
var installEvent=null;window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();installEvent=e;$('#install').hidden=false;});
$('#install').addEventListener('click',async function(){if(!installEvent)return;installEvent.prompt();await installEvent.userChoice;installEvent=null;$('#install').hidden=true;});
window.addEventListener('appinstalled',function(){$('#install').hidden=true;});

// Campaign inventory is first-party only; no third-party ad tracking.
var campaigns=[
 {tag:'HOSTING PARTNER',title:'Hostinger hosting',desc:'Explore hosting and website setup through VWEB.DEV.',href:'https://vweb.dev',cta:'Learn more'},
 {tag:'SOFTWARE',title:'ASTER Multiseat',desc:'See how independent multi-user workstations can help teams.',href:'https://aster.vweb.dev',cta:'Explore ASTER'},
 {tag:'SELL ONLINE',title:'Start a Shopify store',desc:'A custom storefront, product catalogue and store support.',href:'https://vweb.dev',cta:'Our Shopify services'}
];
$('#home-promotions').replaceChildren();
campaigns.forEach(function(c){
  var article=document.createElement('article');article.className='promo-mini';
  var small=document.createElement('small');small.textContent=c.tag;
  var strong=document.createElement('strong');strong.textContent=c.title;
  var p=document.createElement('p');p.textContent=c.desc;
  var link=document.createElement('a');link.textContent=c.cta+' ↗';link.href=c.href;link.target='_blank';link.rel='noopener noreferrer';
  article.append(small,strong,p,link);$('#home-promotions').append(article);
});

// Curated destinations. No unverified coupon codes or exaggerated discounts.
var offers=[
{id:'aster',title:'ASTER Multiseat',category:'Software',description:'Licenses and solutions for multiple independent workstations from a single PC.',url:'https://aster.vweb.dev',cta:'View ASTER',note:'VWEB.DEV'},
{id:'shopify',title:'Shopify Store Services',category:'Business',description:'Store launches, theme customization, migrations, catalogues and ongoing support.',url:'https://vweb.dev',cta:'Explore service',note:'VWEB.DEV'},
{id:'hostinger',title:'Hostinger Partner Services',category:'Hosting',description:'Get help selecting hosting, domains and websites. Ask about currently eligible partner offers.',url:'https://vweb.dev',cta:'Ask for offer',note:'Partner service'},
{id:'daraz',title:'Daraz Shopping',category:'Shopping',description:'Explore the Daraz marketplace. Affiliate links and verified coupons may be added later.',url:'https://www.daraz.pk/',cta:'Visit Daraz',note:'Marketplace'},
{id:'seller',title:'Daraz Seller Services',category:'Business',description:'Need product images, listings or a new e-commerce store? VWEB.DEV can help.',url:'https://vweb.dev',cta:'Explore services',note:'VWEB.DEV'},
{id:'design',title:'Branding & Web Design',category:'Business',description:'Brand identity, websites, web apps, digital integrations and automations.',url:'https://vweb.dev',cta:'Discover VWEB.DEV',note:'VWEB.DEV'}
];
var chosen='All';var saved;
try{saved=JSON.parse(localStorage.getItem('vweb-saved-offers')||'[]');if(!Array.isArray(saved))saved=[];}catch(e){saved=[];}
function renderOffers(){
 var keyword=$('#offers-search').value.toLowerCase().trim();var grid=$('#offers-grid');grid.replaceChildren();
 var result=offers.filter(function(o){return(chosen==='All'||o.category===chosen)&&[o.title,o.description,o.category].join(' ').toLowerCase().includes(keyword);});
 if(!result.length){var msg=document.createElement('p');msg.textContent='No matching offers yet.';grid.append(msg);return;}
 result.forEach(function(o){
  var article=document.createElement('article');article.className='offer-card';
  var header=document.createElement('header');var cat=document.createElement('span');cat.className='category';cat.textContent=o.category.toUpperCase();
  var note=document.createElement('span');note.className='tag';note.textContent=o.note;header.append(cat,note);
  var title=document.createElement('h3');title.textContent=o.title;
  var p=document.createElement('p');p.textContent=o.description;
  var footer=document.createElement('div');footer.className='offer-footer';
  var a=document.createElement('a');a.href=o.url;a.target='_blank';a.rel='noopener noreferrer';a.textContent=o.cta+' ↗';
  var save=document.createElement('button');save.type='button';save.className='save-offer'+(saved.includes(o.id)?' saved':'');save.textContent=saved.includes(o.id)?'♥':'♡';save.setAttribute('aria-label',(saved.includes(o.id)?'Remove saved ':'Save ')+o.title);save.setAttribute('aria-pressed',saved.includes(o.id)?'true':'false');
  save.addEventListener('click',function(){saved=saved.includes(o.id)?saved.filter(function(s){return s!==o.id;}):saved.concat(o.id);try{localStorage.setItem('vweb-saved-offers',JSON.stringify(saved));}catch(e){}renderOffers();});
  footer.append(a,save);article.append(header,title,p);
  if(o.code){var codebox=document.createElement('div');codebox.className='coupon-code';
   var codeText=document.createElement('code');codeText.textContent=o.code;
   var codeBtn=document.createElement('button');codeBtn.type='button';codeBtn.textContent='Copy code';
   codeBtn.setAttribute('aria-label','Copy '+o.title+' coupon code');
   codeBtn.addEventListener('click',function(){copy(o.code,codeBtn);});
   codebox.append(codeText,codeBtn);article.append(codebox);
  }
  article.append(footer);grid.append(article);
 });
}
var cats=['All'].concat(Array.from(new Set(offers.map(function(o){return o.category;}))));
cats.forEach(function(cat){var b=document.createElement('button');b.type='button';b.textContent=cat;b.addEventListener('click',function(){chosen=cat;$$('#offers-filters button').forEach(function(n){n.classList.toggle('active',n===b);});renderOffers();});if(cat==='All')b.classList.add('active');$('#offers-filters').append(b);});
$('#offers-search').addEventListener('input',renderOffers);renderOffers();

// Optional free CMS. The existing curated cards remain fully usable until
// the private Hostinger backend is configured. No private data in this payload.
async function loadPublishedContent(){
 try{
  var response=await fetch('/api/public.php',{headers:{'Accept':'application/json'}});
  if(!response.ok)return;
  var data=await response.json();
  if(!data||!data.ok)return;
  var coupons=Array.isArray(data.coupons)?data.coupons:[];
  var news=Array.isArray(data.news)?data.news:[];
  var ads=Array.isArray(data.ads)?data.ads:[];
  coupons.forEach(function(item){
   var id=Number(item.id);
   if(!Number.isSafeInteger(id)||id<=0)return;
   var entry={id:'cms-'+id,title:String(item.title||''),category:String(item.category||'Deals'),
      description:String(item.summary||''),code:String(item.code||''),
      url:'/api/go.php?id='+id,cta:'View verified offer',
      note:String(item.brand||'Verified source')};
   if(!entry.title||offers.some(function(o){return o.id===entry.id;}))return;
   offers.push(entry);
  });
  // Extend category filters to include admin-published categories.
  Array.from(new Set(offers.map(function(o){return o.category;}))).forEach(function(cat){
   if(cats.includes(cat))return;cats.push(cat);
   var button=document.createElement('button');button.type='button';button.textContent=cat;
   button.addEventListener('click',function(){chosen=cat;$('#offers-filters button').forEach(function(n){n.classList.toggle('active',n===button);});renderOffers();});
   $('#offers-filters').append(button);
  });
  renderOffers();
  if(news.length){
   var newsBox=document.createElement('section');newsBox.className='cms-news';
   var label=document.createElement('div');label.className='overline';label.textContent='VERIFIED LOCAL UPDATES';
   var heading=document.createElement('h2');heading.textContent='Latest from your community';
   var list=document.createElement('div');list.className='tiles two';
   news.slice(0,6).forEach(function(item){
    var id=Number(item.id);if(!Number.isSafeInteger(id)||id<=0)return;
    var card=document.createElement('article');card.className='guide-card';
    var origin=document.createElement('div');origin.className='overline';origin.textContent=String(item.brand||'Community update');
    var title=document.createElement('h3');title.textContent=String(item.title||'');
    var desc=document.createElement('p');desc.textContent=String(item.summary||'');
    var link=document.createElement('a');link.href='/api/go.php?id='+id;link.textContent='View source ↗';
    link.target='_blank';link.rel='noopener noreferrer';
    card.append(origin,title,desc,link);list.append(card);
   });newsBox.append(label,heading,list);
   $('#page-community .page-header').after(newsBox);
   var placeholder=$('#page-community .informative');if(placeholder)placeholder.hidden=true;
  }
  // Maximum one featured new sponsor placement per section, avoiding ad-heavy UI.
  ['home','offers','news'].forEach(function(placement){
   var item=ads.find(function(ad){return ad.placement===placement;});
   if(!item)return;
   var id=Number(item.id);if(!Number.isSafeInteger(id)||id<=0)return;
   var card=document.createElement('article');card.className='cms-sponsored';
   var label=document.createElement('small');label.textContent='SPONSORED • '+String(item.brand||'PARTNER');
   var title=document.createElement('h3');title.textContent=String(item.title||'');
   var desc=document.createElement('p');desc.textContent=String(item.summary||'');
   var link=document.createElement('a');link.href='/api/go.php?id='+id;link.target='_blank';link.rel='noopener noreferrer';link.textContent='Discover offer ↗';
   card.append(label,title,desc,link);
   var anchor=placement==='home'?$('#home-promotions'):placement==='offers'?$('#offers-grid'):$('#guides');
   if(anchor){if(placement==='offers'||placement==='news')anchor.before(card);else anchor.after(card);}
  });
 }catch(e){
  // CMS is optional and may not be installed; offline tools must still function.
  if(location.hostname==='localhost')console.info('CMS not connected:',e.message);
 }
}
// Optional CMS: only visit PHP when browsing offers or community.
var publishedContentRequested=false;
function loadPublishedWhenNeeded(){
 var section=(location.hash||'#home').slice(1);
 if(!publishedContentRequested&&(section==='offers'||section==='community')){
  publishedContentRequested=true;loadPublishedContent();
 }
}
window.addEventListener('hashchange',loadPublishedWhenNeeded);
loadPublishedWhenNeeded();


// Local learning resources: source-linked, evergreen and not represented as live news.
var guides=[
 {label:'ONLINE SAFETY',title:'Protect your online accounts',text:'Create unique passwords, enable two-factor authentication and review recovery methods.',url:'https://www.cisa.gov/secure-our-world'},
 {label:'BUSINESS LEARNING',title:'Launch a practical online store',text:'Plan your catalogue, pricing, shipping and product photos before you pay for a platform.',url:'https://www.shopify.com/blog'},
 {label:'DIGITAL SKILLS',title:'Learn web performance fundamentals',text:'Explore quick wins for fast and accessible websites.',url:'https://web.dev/learn/performance/'},
 {label:'LOCAL DISCOVERY',title:'Submit a community suggestion',text:'Propose useful local news sources or local businesses for future verified listings.',url:'https://vweb.dev'}
];
guides.forEach(function(g){var c=document.createElement('article');c.className='guide-card';var label=document.createElement('div');label.className='overline';label.textContent=g.label;var title=document.createElement('h3');title.textContent=g.title;var desc=document.createElement('p');desc.textContent=g.text;var a=document.createElement('a');a.href=g.url;a.textContent='Read more ↗';a.target='_blank';a.rel='noopener noreferrer';c.append(label,title,desc,a);$('#guides').append(c);});

// Browser-only utilities
var quality=$('#image-quality');quality.addEventListener('input',function(){$('#quality-output').textContent=quality.value+'%';});
var outputUrl=null;
$('#compress').addEventListener('click',async function(){
 var file=$('#image-file').files[0],status=$('#compress-status'),link=$('#download-image');link.hidden=true;
 if(!file){status.textContent='Please choose an image.';return;}
 if(!['image/jpeg','image/png','image/webp'].includes(file.type)){status.textContent='Use JPG, PNG or WebP.';return;}
 if(file.size>30*1024*1024){status.textContent='Please choose an image under 30 MB.';return;}
 status.textContent='Compressing locally…';var temp=URL.createObjectURL(file);
 try{var img=new Image();img.src=temp;await img.decode();var width=img.naturalWidth,height=img.naturalHeight,cap=Number($('#image-width').value);
 if(cap&&width>cap){height=Math.max(1,Math.round(height*cap/width));width=cap;}
 if(width*height>25000000)throw Error('Image resolution is too large for this device.');
 var canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
 var ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,width,height);ctx.drawImage(img,0,0,width,height);
 var blob=await new Promise(function(resolve){canvas.toBlob(resolve,'image/jpeg',Number(quality.value)/100);});
 if(!blob)throw Error('Image could not be converted.');
 if(outputUrl)URL.revokeObjectURL(outputUrl);outputUrl=URL.createObjectURL(blob);
 link.href=outputUrl;link.hidden=false;status.textContent='Done: '+(file.size/1024).toFixed(0)+' KB → '+(blob.size/1024).toFixed(0)+' KB (JPG).';
 }catch(e){status.textContent='Unable to process image: '+e.message;}finally{URL.revokeObjectURL(temp);}
});
var length=$('#pass-length');length.addEventListener('input',function(){$('#pass-length-output').textContent=length.value;});
$('#pass-create').addEventListener('click',function(){
 var chars='ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789'+($('#pass-symbols').checked?'!@#$%&*?+-_':'');
 var arr=new Uint32Array(Number(length.value));crypto.getRandomValues(arr);var pass=Array.from(arr,function(n){return chars[n%chars.length];}).join('');
 $('#password-output').value=pass;$('#pass-status').textContent='Generated on your device.';
});
async function copy(text,target){if(!text){target.textContent='Nothing to copy.';return;}try{await navigator.clipboard.writeText(text);target.textContent='Copied.';}catch(e){target.textContent='Copy not available in this browser.';}}
$('#pass-copy').addEventListener('click',function(){copy($('#password-output').value,$('#pass-status'));});
function updateText(){var t=$('#text-content').value;$('#char-count').textContent=t.length;$('#word-count').textContent=(t.trim().match(/\S+/g)||[]).length;}
$('#text-content').addEventListener('input',updateText);
$('#text-upper').addEventListener('click',function(){$('#text-content').value=$('#text-content').value.toUpperCase();updateText();});
$('#text-clean').addEventListener('click',function(){$('#text-content').value=$('#text-content').value.replace(/[ \t]+/g,' ').replace(/\n\s*\n\s*\n/g,'\n\n').trim();updateText();});
$('#text-copy').addEventListener('click',function(){copy($('#text-content').value,$('#text-status'));});
function jsonAction(minify){try{var parsed=JSON.parse($('#json-content').value);$('#json-content').value=JSON.stringify(parsed,null,minify?0:2);$('#json-status').textContent='Valid JSON.';}catch(e){$('#json-status').textContent='Invalid JSON: '+e.message;}}
$('#json-format').addEventListener('click',function(){jsonAction(false);});$('#json-minify').addEventListener('click',function(){jsonAction(true);});
$('#json-copy').addEventListener('click',function(){copy($('#json-content').value,$('#json-status'));});

// Optional member accounts; anonymous pages never request member/ISP data.
var connectState={csrf:null,user:null};
async function connectGet(path){
 var response=await fetch('/api/'+path,{credentials:'same-origin',cache:'no-store',headers:{Accept:'application/json'}});
 var body=await response.json();if(!response.ok||!body.ok)throw Error(body.message||'Account service unavailable.');
 return body;
}
async function connectPost(path,data){
 if(!connectState.csrf)throw Error('Account service unavailable. Open My Account and try again.');
 var response=await fetch('/api/'+path,{method:'POST',credentials:'same-origin',cache:'no-store',
 headers:{'Content-Type':'application/json','X-CSRF-Token':connectState.csrf},
 body:JSON.stringify(data)});
 var body=await response.json();if(!response.ok||!body.ok)throw Error(body.message||'Request was not completed.');
 return body;
}
function connectText(selector,value){var el=$(selector);if(el)el.textContent=value;}
function memberUI(){
 var signed=!!connectState.user;
 $('#member-guest').hidden=signed;
 $('#member-profile').hidden=!signed;
 if(signed){
  connectText('#member-name','Hello, '+connectState.user.name);
  connectText('#member-email',connectState.user.email);
  $('#member-marketing').checked=!!Number(connectState.user.marketing_opt_in);
 }
}
async function loadSupportTickets(){
 if(!connectState.user)return;
 var tickets=$('#member-tickets');tickets.replaceChildren();
 try{
  var payload=await connectGet('member-tickets.php');
  var list=Array.isArray(payload.tickets)?payload.tickets:[];
  if(!list.length){tickets.textContent='No support requests yet.';return;}
  list.forEach(function(item){
   var entry=document.createElement('p');entry.textContent=item.subject+' — '+item.status;
   tickets.append(entry);
  });
 }catch(err){tickets.textContent='Recent requests are unavailable. '+err.message;}
}
async function refreshMember(){
 try{
  var info=await connectGet('member.php');
  connectState.csrf=info.csrf;connectState.user=info.user||null;
  memberUI();
  if(connectState.user){await loadSupportTickets();await updatePushAvailability();}
  else{$('#enable-push').disabled=true;$('#disable-push').disabled=true;}
 }catch(err){
  connectState.csrf=null;connectState.user=null;memberUI();
  connectText('#login-feedback','Account service unavailable: '+err.message);
 }
}
function bindMemberForm(formId,handler,feedbackId){
 var form=$(formId);
 if(!form)return;
 form.addEventListener('submit',async function(ev){ev.preventDefault();
  var btn=form.querySelector('button[type=submit]');btn.disabled=true;connectText(feedbackId,'Working…');
  try{await handler();connectText(feedbackId,'Success.');}catch(e){connectText(feedbackId,e.message);}
  finally{btn.disabled=false;}
 });
}
bindMemberForm('#login-form',async function(){
 await connectPost('member.php',{action:'login',email:$('#login-email').value,password:$('#login-password').value});
 $('#login-password').value='';await refreshMember();location.hash='#account';
},'#login-feedback');
bindMemberForm('#register-form',async function(){
 await connectPost('member.php',{action:'register',name:$('#register-name').value,
  email:$('#register-email').value,password:$('#register-password').value,
  marketing_opt_in:$('#register-marketing').checked});
 $('#register-password').value='';await refreshMember();location.hash='#account';
},'#register-feedback');
$('#member-logout').addEventListener('click',async function(){try{await connectPost('member.php',{action:'logout'});await refreshMember();location.hash='#home';}catch(e){connectText('#prefs-status',e.message);}});
$('#save-prefs').addEventListener('click',async function(){
 try{await connectPost('member.php',{action:'prefs',marketing_opt_in:$('#member-marketing').checked});
 await refreshMember();connectText('#prefs-status','Saved.');}catch(e){connectText('#prefs-status',e.message);}
});
bindMemberForm('#merchant-form',async function(){
 var reply=await connectPost('member.php',{action:'merchant',business_name:$('#merchant-business').value,
  offer_title:$('#merchant-title').value,description:$('#merchant-description').value,website:$('#merchant-url').value});
 $('#merchant-form').reset();connectText('#merchant-feedback',reply.message);
},'#merchant-feedback');
bindMemberForm('#support-form',async function(){
 var reply=await connectPost('member.php',{action:'support',subject:$('#support-subject').value,message:$('#support-message').value});
 $('#support-form').reset();connectText('#support-feedback',reply.message);await loadSupportTickets();
},'#support-feedback');
// Browser Web Push requires an installed service worker, explicit opt-in and
// server-side VAPID signing. Nothing auto-subscribes a visitor.
var pushVapid='';
async function updatePushAvailability(){
 try{
  var p=await connectGet('push.php');pushVapid=p.vapid_public_key||'';
  var supported=!!(connectState.user&&p.available&&'serviceWorker' in navigator&&'PushManager' in window&&'Notification' in window);
  $('#enable-push').disabled=!supported;$('#disable-push').disabled=!supported;
  if(!p.available)connectText('#prefs-status','Web Push sender is not configured yet; account settings still work.');
 }catch(e){$('#enable-push').disabled=true;$('#disable-push').disabled=true;}
}
function pushKey(key){
 var text=key.replace(/-/g,'+').replace(/_/g,'/');var padded=text+'='.repeat((4-text.length%4)%4);
 return Uint8Array.from(atob(padded),function(c){return c.charCodeAt(0);});
}
$('#enable-push').addEventListener('click',async function(){
 try{
  if(!$('#member-marketing').checked)throw Error('Save optional promotional consent first.');
  var permission=await Notification.requestPermission();
  if(permission!=='granted')throw Error('Notifications were not permitted by your browser.');
  var reg=await navigator.serviceWorker.ready;
  var sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:pushKey(pushVapid)});
  await connectPost('push.php',{action:'subscribe',subscription:sub.toJSON()});
  connectText('#prefs-status','Notifications enabled. You can disable them any time.');
 }catch(e){connectText('#prefs-status',e.message);}
});
$('#disable-push').addEventListener('click',async function(){
 try{var reg=await navigator.serviceWorker.ready;var sub=await reg.pushManager.getSubscription();
  if(sub){await connectPost('push.php',{action:'unsubscribe',endpoint:sub.endpoint});await sub.unsubscribe();}
  connectText('#prefs-status','Notifications disabled.');
 }catch(e){connectText('#prefs-status',e.message);}
});
// Login/PHP/MySQL loads only after the visitor opens the optional Account page.
var accountInitialized=false;
function openAccountIfRequested(){
 if(location.hash==='#account'&&!accountInitialized){
  accountInitialized=true;refreshMember();
 }
}
window.addEventListener('hashchange',openAccountIfRequested);
openAccountIfRequested();


// Additional fully browser-side free utilities.
function convertUnits(){
 var x=Number($('#conv-input').value),mode=$('#conv-mode').value;
 if(!Number.isFinite(x)){connectText('#conv-result','Enter a valid number.');return;}
 var out,unit;
 switch(mode){
 case 'km-mi':out=x*0.6213711922;unit='miles';break;
 case 'mi-km':out=x/0.6213711922;unit='kilometres';break;
 case 'kg-lb':out=x*2.2046226218;unit='pounds';break;
 case 'lb-kg':out=x/2.2046226218;unit='kilograms';break;
 case 'sqft-sqm':out=x*0.09290304;unit='m²';break;
 case 'sqm-sqft':out=x/0.09290304;unit='ft²';break;
 case 'c-f':out=x*9/5+32;unit='°F';break;
 case 'f-c':out=(x-32)*5/9;unit='°C';break;
 default:return;
 }
 connectText('#conv-result',out.toLocaleString(undefined,{maximumFractionDigits:5})+' '+unit);
}
$('#conv-mode').addEventListener('change',convertUnits);
$('#conv-input').addEventListener('input',convertUnits);convertUnits();
// Quote-aware CSV parser, supports CRLF and escaped quoted commas.
function parseCsv(input){
 var rows=[],row=[],value='',quoted=false;
 for(var i=0;i<input.length;i++){
  var ch=input[i];
  if(ch==='"'){if(quoted&&input[i+1]==='"'){value+='"';i++;}else quoted=!quoted;}
  else if(ch===','&&!quoted){row.push(value);value='';}
  else if((ch==='\n'||ch==='\r')&&!quoted){if(ch==='\r'&&input[i+1]==='\n')i++;row.push(value);rows.push(row);row=[];value='';}
  else value+=ch;
 }
 if(quoted)throw Error('Unclosed CSV quote.');
 if(value!==''||row.length){row.push(value);rows.push(row);}
 return rows.filter(function(r){return !(r.length===1&&r[0]==='');});
}
$('#csv-convert').addEventListener('click',function(){
 try{
  var source=$('#csv-content').value;if(source.length>200000)throw Error('Use CSV under 200 KB.');
  var rows=parseCsv(source),keys=rows.shift();
  if(!keys||keys.some(function(x){return !x.trim();}))throw Error('Include a header row.');
  if(new Set(keys).size!==keys.length)throw Error('CSV headers must be unique.');
  var result=rows.map(function(row){var obj={};keys.forEach(function(key,i){obj[key]=row[i]||'';});return obj;});
  connectText('#csv-result',JSON.stringify(result,null,2));
 }catch(e){connectText('#csv-result',e.message);}
});
$('#csv-copy').addEventListener('click',function(){copy($('#csv-result').textContent,$('#csv-copy'));});
function contrastRatio(fg,bg){
 function linear(hex){
  return [1,3,5].map(function(i){var c=parseInt(hex.slice(i,i+2),16)/255;return c<=.04045?c/12.92:Math.pow((c+.055)/1.055,2.4);});
 }
 function lum(hex){var c=linear(hex);return .2126*c[0]+.7152*c[1]+.0722*c[2];}
 var x=lum(fg),y=lum(bg);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);
}
function checkContrast(){
 var fg=$('#contrast-fg').value,bg=$('#contrast-bg').value;
 $('#contrast-sample').style.color=fg;$('#contrast-sample').style.backgroundColor=bg;
 var n=contrastRatio(fg,bg);
 connectText('#contrast-result',n.toFixed(2)+':1 contrast — '+(n>=7?'AAA normal text':n>=4.5?'AA normal text':n>=3?'AA large text only':'Insufficient text contrast'));
}
$('#contrast-fg').addEventListener('input',checkContrast);
$('#contrast-bg').addEventListener('input',checkContrast);checkContrast();
})();
