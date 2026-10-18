'use strict';
(function () {
var $ = function (s) { return document.querySelector(s); };
var $$ = function (s) { return Array.from(document.querySelectorAll(s)); };
var routes=['home','tools','ai','offers','community','internet','rewards'];
function route(){
  var key=location.hash.replace('#','')||'home';if(routes.indexOf(key)<0)key='home';
  $$('.page').forEach(function(el){el.hidden=el.id!=='page-'+key;});
  $$('[data-nav]').forEach(function(el){var active=el.dataset.nav===key;el.classList.toggle('active',active);if(active){el.setAttribute('aria-current','page');}else{el.removeAttribute('aria-current');}});
  document.title=(key==='home'?'VWEB.DEV Connect':key.charAt(0).toUpperCase()+key.slice(1)+' | VWEB.DEV Connect');
  window.scrollTo(0,0);
}
window.addEventListener('hashchange',route);route();
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
  footer.append(a,save);article.append(header,title,p,footer);grid.append(article);
 });
}
var cats=['All'].concat(Array.from(new Set(offers.map(function(o){return o.category;}))));
cats.forEach(function(cat){var b=document.createElement('button');b.type='button';b.textContent=cat;b.addEventListener('click',function(){chosen=cat;$$('#offers-filters button').forEach(function(n){n.classList.toggle('active',n===b);});renderOffers();});if(cat==='All')b.classList.add('active');$('#offers-filters').append(b);});
$('#offers-search').addEventListener('input',renderOffers);renderOffers();

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

// Load optional third-party AI library only on explicit action, never for ordinary visits.
var puterPromise;
function getPuter(){if(window.puter)return Promise.resolve(window.puter);if(puterPromise)return puterPromise;
 puterPromise=new Promise(function(resolve,reject){var s=document.createElement('script');s.src='https://js.puter.com/v2/';s.async=true;s.onload=function(){window.puter?resolve(window.puter):reject(Error('AI SDK unavailable.'));};s.onerror=function(){reject(Error('Puter could not load. Check the network allowlist.'));};document.head.append(s);});return puterPromise;}
$('#ask-ai').addEventListener('click',async function(){
 var prompt=$('#chat-prompt').value.trim(),out=$('#chat-result'),b=this;if(!prompt){out.textContent='Enter a question first.';return;}
 b.disabled=true;out.textContent='Connecting to Puter — sign in if requested…';
 try{var puter=await getPuter();var result=await puter.ai.chat(prompt);out.textContent=(typeof result==='string'?result:(result&&result.message&&result.message.content)||JSON.stringify(result))||'No response returned.';}catch(e){out.textContent='AI request failed: '+(e.message||String(e))+' Please check Puter login, credits and connectivity.';}finally{b.disabled=false;}
});
$('#generate-ai-image').addEventListener('click',async function(){
 var prompt=$('#image-prompt').value.trim(),out=$('#image-result'),b=this;if(!prompt){out.textContent='Describe an image first.';return;}
 b.disabled=true;out.textContent='Generating via Puter — sign in if requested…';
 try{var puter=await getPuter();var result=await puter.ai.txt2img(prompt);out.replaceChildren();
 if(result instanceof HTMLElement){result.alt='AI-generated image';out.append(result);}else if(typeof result==='string'){var img=document.createElement('img');img.src=result;img.alt='AI-generated image';out.append(img);}else{out.textContent='Unexpected response; please try again.';}
 }catch(e){out.textContent='Image request failed: '+(e.message||String(e))+' Please check credits and connectivity.';}finally{b.disabled=false;}
});
})();