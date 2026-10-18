'use strict';
/** VWEB.DEV Entertainment: browser-first approved embeds, radio, games and local favorites. */
(function () {
const $=(s)=>document.querySelector(s);
const $$=(s)=>Array.from(document.querySelectorAll(s));
const safeUrl=(value)=>{
  try{const u=new URL(String(value));return u.protocol==='https:'?u.href:null;}catch(_){return null;}
};
const favoriteKey='vweb.entertainment.favorites.v1',radioFavoriteKey='vweb.radio.favorites.v1';
function loadSaved(key,defaultValue){
  try{const v=JSON.parse(localStorage.getItem(key)||'null');return v===null?defaultValue:v;}catch(_){return defaultValue;}
}
function save(key,val){try{localStorage.setItem(key,JSON.stringify(val));}catch(_){}}
let media=[],tvFilter='All',tvSearch='',favoriteOnly=false,selectedTv=null,radioStations=[],
  radioResults=null,radioFilterMode='radio',currentRadio=null,radioPlaying=false;
let tvPlayer=null,podcastIframe=null,hlsInstance=null,hlsSDK=null;
let tvFavorites=loadSaved(favoriteKey,[]);
if(!Array.isArray(tvFavorites))tvFavorites=[];
let radioFavorites=loadSaved(radioFavoriteKey,[]);
if(!Array.isArray(radioFavorites))radioFavorites=[];
const audio=new Audio();audio.preload='none';audio.setAttribute('aria-label','Radio stream');
const radioDock=document.createElement('div');radioDock.className='ent-radio-dock';radioDock.hidden=true;
const dockIcon=document.createElement('span');dockIcon.className='ent-radio-logo';dockIcon.textContent='♫';
const dockName=document.createElement('strong');dockName.textContent='Radio player';
const dockPlay=document.createElement('button');dockPlay.type='button';dockPlay.textContent='Pause';
const dockClose=document.createElement('button');dockClose.type='button';dockClose.textContent='✕';dockClose.setAttribute('aria-label','Stop radio');
radioDock.append(dockIcon,dockName,dockPlay,dockClose);document.body.append(radioDock);

function empty(parent,msg){parent.replaceChildren();const el=document.createElement('div');el.className='ent-empty';el.textContent=msg;parent.append(el);}
function textNode(tag,text,cls){const el=document.createElement(tag);el.textContent=text;if(cls)el.className=cls;return el;}
function clearTv(){
  if(hlsInstance){hlsInstance.destroy();hlsInstance=null;}
  const stage=$('#tv-player');if(!stage)return;
  stage.replaceChildren();
  const holder=textNode('div','','ent-player-idle');
  holder.append(textNode('div','▶','ent-play-mark'),textNode('h2','Choose something to watch.'),textNode('p','Select an authorized official stream below.'));
  stage.append(holder);tvPlayer=null;
  $('#tv-stop').hidden=true;
  $('#tv-official-link').hidden=true;
}
function clearPodcast(){const p=$('#podcast-player');p.replaceChildren();p.hidden=true;podcastIframe=null;}
function stopRadio(){
  audio.pause();audio.removeAttribute('src');audio.load();radioPlaying=false;currentRadio=null;radioDock.hidden=true;dockPlay.textContent='Pause';
}
function externalLink(url,label='Open official source ↗'){
  const a=document.createElement('a');a.className='button secondary';a.textContent=label;
  a.href=url;a.target='_blank';a.rel='noopener noreferrer';return a;
}
function setNow(item,message){
  const root=$('#tv-now-playing');const title=root.querySelector('strong'),note=root.querySelector('p');
  title.textContent=item?item.title:'No channel selected';note.textContent=message;
}
function getHLS(){
 if(window.Hls)return Promise.resolve(window.Hls);
 if(hlsSDK)return hlsSDK;
 hlsSDK=new Promise((resolve,reject)=>{
  const script=document.createElement('script');
  script.src='https://cdn.jsdelivr.net/npm/hls.js@1.7.3/dist/hls.min.js';
  script.async=true;
  const timeout=setTimeout(()=>{script.remove();reject(Error('HLS library did not load.'));hlsSDK=null;},13000);
  script.onload=()=>{clearTimeout(timeout);window.Hls?resolve(window.Hls):reject(Error('HLS library unavailable.'));};
  script.onerror=()=>{clearTimeout(timeout);hlsSDK=null;reject(Error('HLS library unavailable.'));};
  document.head.append(script);
 });
 return hlsSDK;
}
async function loadLicensedHLS(url,video,item){
 if(tvPlayer!==video)return;
 if(video.canPlayType('application/vnd.apple.mpegurl')){
  video.src=url;
  return;
 }
 const Hls=await getHLS();
 if(tvPlayer!==video)return;
 if(!Hls.isSupported())throw Error('Browser does not support native HLS or MediaSource HLS.');
 const controller=new Hls({enableWorker:true});
 hlsInstance=controller;
 controller.on(Hls.Events.ERROR,(_,detail)=>{
  if(detail.fatal&&tvPlayer===video)setNow(item,'HLS stream error from source or CORS policy. Please open the official licensed stream.');
 });
 controller.loadSource(url);
 controller.attachMedia(video);
}

function playTv(item){
  const link=safeUrl(item.source_url);
  if(!link)return;
  if(!item.permission || !['official_embed','licensed_stream','official_link'].includes(item.permission))return;
  if(item.provider==='external'){$('#tv-official-link').href=link;$('#tv-official-link').hidden=false;
    window.open(link,'_blank','noopener,noreferrer');
    setNow(item,'Opens at the publisher site because an official third-party embed is not confirmed.');return;}
  if(item.permission==='official_link'){$('#tv-official-link').href=link;$('#tv-official-link').hidden=false;
    window.open(link,'_blank','noopener,noreferrer');
    setNow(item,'This content plays on its official site.');return;}
  clearPodcast();stopRadio();clearTv();
  $('#tv-official-link').href=link;$('#tv-official-link').hidden=false;
  const stage=$('#tv-player');
  let video=null;
  if(item.provider==='youtube'&&/^[A-Za-z0-9_-]{11}$/.test(item.external_id)){
    video=document.createElement('iframe');
    video.src='https://www.youtube-nocookie.com/embed/'+item.external_id+'?autoplay=1&rel=0&playsinline=1';
    video.allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen';
    video.allowFullscreen=true;video.referrerPolicy='strict-origin-when-cross-origin';
    video.title=item.title+' — official YouTube player';
  }else if(item.provider==='twitch'&&/^[A-Za-z0-9_]{1,40}$/.test(item.external_id)){
    video=document.createElement('iframe');
    video.src='https://player.twitch.tv/?channel='+encodeURIComponent(item.external_id)+'&parent='+encodeURIComponent(location.hostname)+'&autoplay=true';
    video.allow='autoplay; fullscreen';video.allowFullscreen=true;video.title=item.title+' — Twitch';
  }else if(item.provider==='hls'&&item.permission==='licensed_stream'){
    // No silent proxy or arbitrary IPTV playlist; native playback only
    // until an explicit licensed HLS host/codec is vetted.
    video=document.createElement('video');video.controls=true;video.playsInline=true;video.preload='none';
    video.addEventListener('error',()=>setNow(item,'This stream could not play in the browser. Open the licensed source instead.'));
  }
  if(!video){stage.append(textNode('div','Provider embed unavailable. Please open the official source.','ent-empty'));return;}
  tvPlayer=video;selectedTv=item;
  stage.append(video);$('#tv-stop').hidden=false;
  if(item.provider==='hls'){
    loadLicensedHLS(link,video,item).catch((error)=>{
      if(tvPlayer!==video)return;
      setNow(item,'Licensed HLS stream unavailable in this browser. Use the official source button below.');
    });
  }
  setNow(item,'Publisher-controlled player. If it is blank, unavailable or blocked, use Watch on official site.');
  // The player is never proxied through Hostinger.
}
$('#tv-stop').addEventListener('click',()=>{clearTv();setNow(null,'Video player stopped.');});
function safeMedia(item){
 if(!item||typeof item!=='object')return null;
 const kind=String(item.kind||''),provider=String(item.provider||'');
 if(!['tv','watch','podcast','discover'].includes(kind)||!['youtube','spotify','external','twitch','hls'].includes(provider))return null;
 const link=safeUrl(item.source_url);
 if(!link)return null;
 if(provider==='youtube'&&!/^[A-Za-z0-9_-]{11}$/.test(String(item.external_id||'')))return null;
 if(provider==='spotify'&&!/^[A-Za-z0-9]{22}$/.test(String(item.external_id||'')))return null;
 if(provider==='twitch'&&!/^[A-Za-z0-9_]{1,40}$/.test(String(item.external_id||'')))return null;
 if(provider==='hls'&&item.permission!=='licensed_stream')return null;
 if(!['official_embed','official_link','licensed_stream'].includes(item.permission))return null;
 return {id:String(item.id||'').slice(0,100),kind,provider,external_id:String(item.external_id||''),
  title:String(item.title||'Untitled').slice(0,160),summary:String(item.summary||'').slice(0,450),
  category:String(item.category||'General').slice(0,70),country:String(item.country||'').slice(0,10),
  language:String(item.language||'').slice(0,40),source_url:link,source_name:String(item.source_name||'Official source').slice(0,90),
  poster_style:['news','space','culture','learning','entertainment'].includes(item.poster_style)?item.poster_style:'learning',
  permission:item.permission,badge:String(item.badge||'Official source').slice(0,70)};
}
async function loadCatalog(){
 let local=[];
 try{
  const r=await fetch('/data/entertainment.json',{cache:'force-cache'});
  if(r.ok){const d=await r.json();local=(d.items||[]).map(safeMedia).filter(Boolean);}
 }catch(_){}
 if(!local.length){empty($('#tv-list'),'Catalog unavailable offline until first successful load.');return;}
 media=local;
 try{
  const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),6000);
  const r=await fetch('/api/media.php',{signal:controller.signal,cache:'no-store'});
  clearTimeout(timeout);
  if(r.ok){const d=await r.json();if(d.ok&&Array.isArray(d.items)){
    const additions=d.items.map(safeMedia).filter(Boolean);
    const map=new Map(media.map((i)=>[i.id,i]));
    additions.forEach(i=>map.set(i.id,i));
    media=[...map.values()];
  }}
 }catch(_){/* CMS is optional: static curated official sources remain. */}
 tvCategoryButtons();renderTv();renderWatch();renderPodcasts();renderDiscover();
}
function makeMediaCard(item,mode){
 const article=document.createElement('article');article.className='ent-item';
 const poster=document.createElement('div');poster.className='ent-poster p-'+item.poster_style;
 const symbols={news:'◉',space:'✧',learning:'✦',culture:'◈',entertainment:'▶'};
 poster.append(textNode('span',symbols[item.poster_style]||'▶','ent-poster-symbol'),textNode('span',item.badge||item.category,'ent-poster-label'));
 const body=document.createElement('div');body.className='ent-item-body';
 const meta=textNode('div',[item.source_name,item.category].filter(Boolean).join(' · '),'ent-item-meta');
 const title=textNode('h3',item.title);
 const desc=textNode('p',item.summary);
 const actions=document.createElement('div');actions.className='ent-item-actions';
 if(mode==='tv'&&item.provider!=='external'&&item.permission!=='official_link'){
  const play=document.createElement('button');play.className='button primary';play.type='button';play.textContent='▶ Play channel';
  play.addEventListener('click',()=>{playTv(item);$('#tv-player').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth',block:'center'});});
  actions.append(play);
 }
 if(mode==='podcast'&&item.provider==='spotify'){
  const play=document.createElement('button');play.className='button primary';play.type='button';play.textContent='▶ Listen here';
  play.addEventListener('click',()=>{stopRadio();clearTv();clearPodcast();
    const player=$('#podcast-player');player.hidden=false;
    const embed=document.createElement('iframe');embed.src='https://open.spotify.com/embed/show/'+item.external_id;
    embed.title=item.title+' — Spotify podcast';embed.allow='autoplay; encrypted-media; fullscreen; picture-in-picture';embed.loading='lazy';
    podcastIframe=embed;player.append(embed);player.scrollIntoView({behavior:'smooth',block:'center'});
  });actions.append(play);
 }
 const link=externalLink(item.source_url,mode==='tv'?'Watch official site ↗':item.provider==='external'?'Open official site ↗':'Official source ↗');
 actions.append(link);
 if(mode==='tv'){
  const fav=document.createElement('button');fav.className='ent-heart';fav.type='button';
  const liked=tvFavorites.includes(item.id);fav.textContent=liked?'♥':'♡';fav.setAttribute('aria-label',(liked?'Remove':'Save')+' '+item.title);
  fav.setAttribute('aria-pressed',String(liked));
  fav.addEventListener('click',()=>{
    tvFavorites=tvFavorites.includes(item.id)?tvFavorites.filter(i=>i!==item.id):tvFavorites.concat(item.id);
    save(favoriteKey,tvFavorites);renderTv();
  });actions.append(fav);
 }
 body.append(meta,title,desc,actions);article.append(poster,body);return article;
}
function renderTv(){
 const list=$('#tv-list');list.replaceChildren();
 const items=media.filter(i=>i.kind==='tv'&&(!favoriteOnly||tvFavorites.includes(i.id))&&
   (tvFilter==='All'||i.category===tvFilter)&&[i.title,i.summary,i.category,i.country].join(' ').toLowerCase().includes(tvSearch));
 $('#tv-count').textContent=items.length+' approved listings';
 if(!items.length){empty(list,'No channels match this selection. Try All or clear your search.');return;}
 items.forEach(i=>list.append(makeMediaCard(i,'tv')));
}
function tvCategoryButtons(){
 const root=$('#tv-categories');root.replaceChildren();
 ['All',...new Set(media.filter(i=>i.kind==='tv').map(i=>i.category))].forEach(cat=>{
  const b=document.createElement('button');b.type='button';b.textContent=cat;b.className='ent-chip'+(cat===tvFilter?' active':'');
  b.addEventListener('click',()=>{tvFilter=cat;tvCategoryButtons();renderTv();});root.append(b);
 });
}
$('#tv-search').addEventListener('input',(e)=>{tvSearch=e.target.value.toLowerCase().trim();renderTv();});
$('#tv-show-favorites').addEventListener('click',function(){favoriteOnly=!favoriteOnly;this.classList.toggle('active',favoriteOnly);this.setAttribute('aria-pressed',String(favoriteOnly));renderTv();});
function renderWatch(){const el=$('#watch-list');el.replaceChildren();media.filter(i=>i.kind==='watch').forEach(i=>el.append(makeMediaCard(i,'watch')));}
function renderDiscover(){const el=$('#discover-list');el.replaceChildren();media.filter(i=>i.kind==='discover').forEach(i=>el.append(makeMediaCard(i,'discover')));}
function renderPodcasts(){const el=$('#podcast-list');el.replaceChildren();media.filter(i=>i.kind==='podcast').forEach(i=>el.append(makeMediaCard(i,'podcast')));}
loadCatalog();


// Approved first-party sponsorship cards from the existing CMS.
// No third-party ad network, click incentivization, impression claims or overlay on players.
async function renderEntSponsors(){
 try{
  const r=await fetch('/api/public.php',{cache:'no-store'});
  if(!r.ok)return;
  const data=await r.json();
  if(!data.ok||!Array.isArray(data.ads))return;
  for(const item of data.ads){
    const placement=String(item.placement||'');
    const host=$('[data-ent-sponsor="'+placement+'"]');
    if(!host || !Number.isInteger(Number(item.id)) || !safeUrl(item.url))continue;
    if(!host.hidden)continue; // one approved sponsor per section
    const label=textNode('small','SPONSORED · '+String(item.brand||'VWEB partner').slice(0,70));
    const title=textNode('strong',String(item.title||'').slice(0,130));
    const detail=textNode('p',String(item.summary||'').slice(0,300));
    const cta=externalLink('/api/go.php?id='+Number(item.id),'Explore sponsor ↗');
    // Internal first-party redirect should remain same-origin; no URL interpolation in HTML.
    cta.href='/api/go.php?id='+Number(item.id);
    host.replaceChildren(label,title,detail,cta);host.hidden=false;
  }
 }catch(_){}
}
renderEntSponsors();

function radioOfficialFallback(show=true){const el=$('#radio-official-fallback');if(el)el.hidden=!show;}
// Browser-direct public radio directory. Stations/streams may disappear and
// may have separate licensing terms. Never proxy audio through Hostinger.
const radioHosts=['https://de1.api.radio-browser.info','https://nl1.api.radio-browser.info','https://at1.api.radio-browser.info','https://all.api.radio-browser.info'];
async function fetchStations(){
 const query=$('#radio-search').value.trim().slice(0,80),country=$('#radio-country').value;
 const params=new URLSearchParams({hidebroken:'true',order:'votes',reverse:'true',limit:'28'});
 if(country)params.set('countrycode',country);
 if(query)params.set('name',query);
 $('#radio-feedback').textContent='Searching the independent Radio Browser directory…';
 const list=$('#radio-list');empty(list,'Searching stations…');
 let stations=null,error=null;
 for(const host of radioHosts){
  const ctrl=new AbortController();const timeout=setTimeout(()=>ctrl.abort(),9000);
  try{
   const response=await fetch(host+'/json/stations/search?'+params.toString(),{signal:ctrl.signal,mode:'cors',headers:{Accept:'application/json'}});
   if(!response.ok)throw Error('Directory HTTP '+response.status);
   stations=await response.json();if(!Array.isArray(stations))throw Error('Invalid station response');
   clearTimeout(timeout);break;
  }catch(err){error=err;clearTimeout(timeout);}
 }
 if(!stations){$('#radio-feedback').textContent='Radio directory unavailable here. Please use a verified official broadcaster site below.';empty(list,'Directory unavailable. Try an official radio destination.');radioOfficialFallback(true);return;}
 radioStations=stations.filter(s=>s&&s.stationuuid&&s.name).slice(0,28).map(s=>({
  uuid:String(s.stationuuid),name:String(s.name).slice(0,100),country:String(s.countrycode||''),
  codec:String(s.codec||''),bitrate:Number(s.bitrate||0),stream:s.url_resolved||s.url||'',
  homepage:safeUrl(s.homepage||'')||'',tags:String(s.tags||'').slice(0,120)}));
 radioResults=radioStations;renderRadio();radioOfficialFallback(!radioStations.length);
 $('#radio-feedback').textContent=radioStations.length+' directory entries found. Playback availability is not guaranteed.';
}
function renderRadio(){
 const root=$('#radio-list');root.replaceChildren();
 const list=radioFilterMode==='favorites'?radioFavorites:radioStations;
 if(!list.length){empty(root,radioFilterMode==='favorites'?'No saved stations yet. Save a station from your search results.':'No stations matched your search.');return;}
 list.forEach(station=>{
  const row=document.createElement('article');row.className='ent-radio-card';
  row.append(textNode('div','♫','ent-radio-logo'));
  const detail=document.createElement('div');detail.className='ent-radio-detail';
  detail.append(textNode('strong',station.name),textNode('small',[station.country,station.codec,station.bitrate?station.bitrate+' kbps':''].filter(Boolean).join(' · ')));
  const play=document.createElement('button');play.type='button';play.className='ent-radio-play';play.textContent='▶ Play';
  play.addEventListener('click',()=>startRadio(station));
  const fav=document.createElement('button');fav.type='button';fav.className='ent-heart';
  const liked=radioFavorites.some(i=>i.uuid===station.uuid);fav.textContent=liked?'♥':'♡';fav.setAttribute('aria-pressed',String(liked));
  fav.setAttribute('aria-label',(liked?'Remove favorite ':'Favorite ')+station.name);
  fav.addEventListener('click',()=>{
    radioFavorites=liked?radioFavorites.filter(i=>i.uuid!==station.uuid):radioFavorites.concat(station).slice(-80);
    save(radioFavoriteKey,radioFavorites);renderRadio();
  });
  const website=safeUrl(station.homepage);
  if(website){const site=document.createElement('a');site.href=website;site.target='_blank';site.rel='noopener noreferrer';
    site.className='ent-radio-official';site.textContent='Site ↗';site.setAttribute('aria-label','Open '+station.name+' official website');
    row.append(detail,play,site,fav);
  }else row.append(detail,play,fav);
  root.append(row);
 });
}
async function startRadio(station){
 const stream=safeUrl(station.stream);
 if(!stream){$('#radio-feedback').textContent='This station uses an insecure/unsupported stream. Open its official site instead.';radioOfficialFallback(true);return;}
 clearTv();clearPodcast();stopRadio();
 currentRadio=station;audio.src=stream;dockName.textContent=station.name;radioDock.hidden=false;
 $('#radio-feedback').textContent='Opening '+station.name+' directly from the broadcaster…';
 try{await audio.play();radioPlaying=true;dockPlay.textContent='Pause';$('#radio-feedback').textContent='Listening to '+station.name+'. Stream is supplied by the station.';}
 catch(err){$('#radio-feedback').textContent='Station playback failed or is blocked. Use Site ↗ or the official broadcasters below.';radioOfficialFallback(true);dockPlay.textContent='Retry';}
}
dockPlay.addEventListener('click',async ()=>{
 if(!currentRadio)return;
 if(!audio.paused){audio.pause();radioPlaying=false;dockPlay.textContent='Play';}
 else{try{await audio.play();radioPlaying=true;dockPlay.textContent='Pause';}catch(_){dockPlay.textContent='Retry';}}
});
dockClose.addEventListener('click',stopRadio);
audio.addEventListener('error',()=>{$('#radio-feedback').textContent='Station stream failed. Use Site ↗ or select another.';radioOfficialFallback(true);dockPlay.textContent='Retry';});
$('#radio-find').addEventListener('click',()=>{radioFilterMode='radio';$('#radio-favorites').setAttribute('aria-pressed','false');fetchStations();});
$('#radio-favorites').addEventListener('click',function(){
 radioFilterMode=radioFilterMode==='favorites'?'radio':'favorites';
 this.setAttribute('aria-pressed',String(radioFilterMode==='favorites'));
 this.textContent=radioFilterMode==='favorites'?'♥ Saved':'♡ Saved';
 renderRadio();
});
$('#radio-search').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();radioFilterMode='radio';fetchStations();}});
let radioInitialized=false;
function setListenTab(which){
 const onRadio=which==='radio';
 $('#listen-panel-radio').hidden=!onRadio;$('#listen-panel-podcasts').hidden=onRadio;
 $('#listen-tab-radio').classList.toggle('active',onRadio);$('#listen-tab-podcasts').classList.toggle('active',!onRadio);
 $('#listen-tab-radio').setAttribute('aria-selected',String(onRadio));$('#listen-tab-podcasts').setAttribute('aria-selected',String(!onRadio));
 if(onRadio&&!radioInitialized){radioInitialized=true;fetchStations();}
 if(!onRadio&&currentRadio){stopRadio();}
 if(onRadio&&podcastIframe)clearPodcast();
}
$('#listen-tab-radio').addEventListener('click',()=>setListenTab('radio'));
$('#listen-tab-podcasts').addEventListener('click',()=>setListenTab('podcasts'));

// Open Trivia DB: questions are CC BY-SA 4.0; client fetch, no backend burden.
const fallbackQuiz=[
 {q:'Which planet is known as the Red Planet?',answers:['Mars','Venus','Neptune','Jupiter'],correct:'Mars'},
 {q:'What does HTML stand for?',answers:['HyperText Markup Language','Home Tool Markup Language','Hyperlink Text Main Language','High Text Media Link'],correct:'HyperText Markup Language'},
 {q:'How many minutes are in an hour?',answers:['60','100','50','30'],correct:'60'},
 {q:'Which gas do plants absorb from the air?',answers:['Carbon dioxide','Oxygen','Helium','Hydrogen'],correct:'Carbon dioxide'},
 {q:'Which ocean is the largest?',answers:['Pacific','Atlantic','Arctic','Indian'],correct:'Pacific'},
 {q:'Which of these is a web browser?',answers:['Firefox','MySQL','PHP','DNS'],correct:'Firefox'},
 {q:'What is the square root of 81?',answers:['9','8','7','6'],correct:'9'},
 {q:'Which continent contains Pakistan?',answers:['Asia','Africa','Europe','Australia'],correct:'Asia'}
];
let quiz=[],quizIndex=0,quizScore=0,lastQuizCall=0,quizSource='online';
function shuffled(arr){const a=[...arr];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function decodeB64(text){
 const bin=atob(text);return new TextDecoder().decode(Uint8Array.from(bin,c=>c.charCodeAt(0)));
}
async function beginQuiz(){
 $('#quiz-start').disabled=true;
 const root=$('#quiz-main');empty(root,'Loading your questions from Open Trivia DB…');
 try{
  if(Date.now()-lastQuizCall<5500)throw Error('Please wait a few seconds between question downloads.');
  lastQuizCall=Date.now();
  const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),9000);
  const response=await fetch('https://opentdb.com/api.php?amount=8&type=multiple&encode=base64',{signal:ctl.signal,cache:'no-store'});
  clearTimeout(timer);
  if(!response.ok)throw Error('External quiz source unavailable.');
  const data=await response.json();
  if(data.response_code===5)throw Error('Open Trivia DB rate limit reached.');
  if(data.response_code!==0||!Array.isArray(data.results))throw Error('No questions returned.');
  quizSource='online';
  quiz=data.results.map(x=>({q:decodeB64(x.question),correct:decodeB64(x.correct_answer),
    answers:shuffled([x.correct_answer,...x.incorrect_answers].map(decodeB64))}));
 }catch(err){
  quizSource='offline';
  quiz=shuffled(fallbackQuiz).map(x=>({...x,answers:shuffled(x.answers)}));
  const tip=textNode('p','Using a locally authored offline question set because the external API is unavailable or rate-limited.','ent-helper');root.replaceChildren(tip);
 }
 quizIndex=0;quizScore=0;showQuizQuestion();
}
function showQuizQuestion(){
 const root=$('#quiz-main');root.replaceChildren();$('#quiz-score').textContent='Score: '+quizScore;
 if(quizIndex>=quiz.length){
  root.append(textNode('div','Round complete','overline'),textNode('div',quizScore+' / '+quiz.length+' correct','ent-question'));
  const b=textNode('button','Play again ↻','button primary');b.type='button';b.addEventListener('click',beginQuiz);root.append(b);return;
 }
 const item=quiz[quizIndex];root.append(textNode('div',(quizSource==='offline'?'OFFLINE PRACTICE · ':'')+'QUESTION '+(quizIndex+1)+' / '+quiz.length,'ent-quiz-progress'),textNode('div',item.q,'ent-question'));
 const options=document.createElement('div');options.className='ent-answers';
 const response=textNode('p','');
 const next=textNode('button',quizIndex===quiz.length-1?'See results ↗':'Next question ↗','button secondary');next.type='button';next.hidden=true;
 item.answers.forEach(answer=>{
  const b=textNode('button',answer,'ent-answer');b.type='button';
  b.addEventListener('click',()=>{
   options.querySelectorAll('button').forEach(t=>{t.disabled=true;if(t.textContent===item.correct)t.classList.add('correct');});
   if(answer===item.correct){quizScore++;response.textContent='Correct!';}else{b.classList.add('wrong');response.textContent='Correct answer: '+item.correct;}
   $('#quiz-score').textContent='Score: '+quizScore;next.hidden=false;
  });options.append(b);
 });
 next.addEventListener('click',()=>{quizIndex++;showQuizQuestion();});
 root.append(options,response,next);
}
$('#quiz-start').addEventListener('click',beginQuiz);
let memoryCards=[],openMemory=[],memoryMoves=0,memoryMatched=0,memoryLock=false;
function makeMemory(){
 const icons=['◆','●','✳','♣','☀','♫','✦','☾'];memoryCards=shuffled(icons.concat(icons));
 openMemory=[];memoryMoves=0;memoryMatched=0;memoryLock=false;
 $('#memory-moves').textContent='Moves: 0';$('#memory-feedback').textContent='';
 const board=$('#memory-board');board.replaceChildren();
 memoryCards.forEach((symbol,index)=>{
  const b=textNode('button','?','ent-memory-cell');b.type='button';b.setAttribute('aria-label','Hidden card '+(index+1));
  b.addEventListener('click',()=>{
   if(memoryLock||b.classList.contains('matched')||openMemory.some(x=>x.index===index))return;
   b.textContent=symbol;b.classList.add('open');openMemory.push({index,symbol,button:b});
   if(openMemory.length===2){
    memoryMoves++;$('#memory-moves').textContent='Moves: '+memoryMoves;
    if(openMemory[0].symbol===openMemory[1].symbol){
      openMemory.forEach(c=>{c.button.classList.remove('open');c.button.classList.add('matched');c.button.disabled=true;});
      memoryMatched++;openMemory=[];
      if(memoryMatched===8)$('#memory-feedback').textContent='All 8 pairs matched in '+memoryMoves+' moves!';
    }else{memoryLock=true;setTimeout(()=>{
      openMemory.forEach(c=>{c.button.textContent='?';c.button.classList.remove('open');});
      openMemory=[];memoryLock=false;
    },750);}
   }
  });board.append(b);
 });
}
$('#memory-new').addEventListener('click',makeMemory);makeMemory();
let numberCorrect=0,numberAnswer=0;
function nextNumber(){
 const a=2+Math.floor(Math.random()*17),b=2+Math.floor(Math.random()*15);
 numberAnswer=a+b;$('#number-question').textContent=a+' + '+b+' = ?';
 const responses=shuffled([numberAnswer,numberAnswer+2,numberAnswer-3]);
 const root=$('#number-answers');root.replaceChildren();$('#number-feedback').textContent='';
 responses.forEach(n=>{const btn=textNode('button',String(n));btn.type='button';btn.addEventListener('click',()=>{
  root.querySelectorAll('button').forEach(x=>{x.disabled=true;if(Number(x.textContent)===numberAnswer)x.classList.add('correct');});
  if(n===numberAnswer){numberCorrect++;$('#number-feedback').textContent='Correct!';}
  else{btn.classList.add('wrong');$('#number-feedback').textContent='Answer: '+numberAnswer;}
  $('#number-score').textContent='Correct: '+numberCorrect;
 });root.append(btn);});
}
$('#number-next').addEventListener('click',nextNumber);nextNumber();
$$('[data-game]').forEach(btn=>btn.addEventListener('click',()=>{
 const type=btn.dataset.game;$$('[data-game]').forEach(x=>x.classList.toggle('active',x===btn));
 ['quiz','memory','number','flags','word','sudoku'].forEach(x=>$('#game-'+x).hidden=x!==type);
}));

/* Additional zero-backend games and direct Open Library discovery */
const flagPairs=[
 ['🇵🇰','Pakistan'],['🇮🇳','India'],['🇨🇦','Canada'],['🇯🇵','Japan'],
 ['🇧🇷','Brazil'],['🇫🇷','France'],['🇩🇪','Germany'],['🇦🇺','Australia'],
 ['🇹🇷','Turkey'],['🇰🇪','Kenya'],['🇬🇧','United Kingdom'],['🇦🇪','United Arab Emirates']
];
let flagCorrect=0,currentFlag=null;
function newFlag(){
 currentFlag=flagPairs[Math.floor(Math.random()*flagPairs.length)];
 $('#flag-symbol').textContent=currentFlag[0];
 const opts=shuffled([currentFlag[1],...shuffled(flagPairs.filter(p=>p!==currentFlag)).slice(0,3).map(p=>p[1])]);
 const root=$('#flag-answers');root.replaceChildren();$('#flag-feedback').textContent='';
 for(const option of opts){
  const btn=textNode('button',option,'ent-answer');btn.type='button';
  btn.addEventListener('click',()=>{
   root.querySelectorAll('button').forEach(el=>{el.disabled=true;if(el.textContent===currentFlag[1])el.classList.add('correct');});
   if(option===currentFlag[1]){flagCorrect++;$('#flag-feedback').textContent='Correct!';}
   else{btn.classList.add('wrong');$('#flag-feedback').textContent='Correct answer: '+currentFlag[1];}
   $('#flag-score').textContent='Correct: '+flagCorrect;
  });root.append(btn);
 }
}
$('#flag-next').addEventListener('click',newFlag);newFlag();
const words=['BROWSER','LIBRARY','NETWORK','PLANET','DESIGN','ROUTER','LEARNING','CREATIVE','COMPUTER','SCIENCE'];
let activeWord='',wordScore=0,wordSolved=false;
function newWord(){
 activeWord=words[Math.floor(Math.random()*words.length)];
 let mixed=activeWord;
 for(let i=0;i<8&&mixed===activeWord;i++)mixed=shuffled(activeWord.split('')).join('');
 $('#word-letters').textContent=mixed;
 $('#word-answer').value='';wordSolved=false;$('#word-feedback').textContent='';
}
$('#word-check').addEventListener('click',()=>{
 const attempt=$('#word-answer').value.trim().toUpperCase();
 if(!attempt){$('#word-feedback').textContent='Enter your guess.';return;}
 if(attempt===activeWord&&!wordSolved){wordSolved=true;wordScore++;$('#word-score').textContent='Correct: '+wordScore;$('#word-feedback').textContent='Correct! Try another word.';}
 else if(wordSolved)$('#word-feedback').textContent='Already solved! Choose a new word.';
 else $('#word-feedback').textContent='Not quite. Try again.';
});
$('#word-next').addEventListener('click',newWord);
$('#word-answer').addEventListener('keydown',e=>{if(e.key==='Enter'){$('#word-check').click();}});
newWord();
const sudokuSolution=[1,2,3,4,3,4,1,2,2,1,4,3,4,3,2,1];
const sudokuStart=[1,0,3,0,0,4,0,2,2,0,4,0,0,3,0,1];
function resetSudoku(){
 const grid=$('#sudoku-grid');grid.replaceChildren();
 sudokuStart.forEach((n,i)=>{
  const input=document.createElement('input');input.type='number';input.inputMode='numeric';
  input.min='1';input.max='4';input.step='1';input.maxLength=1;
  input.className='ent-sudoku-cell'+(n?' fixed':'');
  if(n){input.value=String(n);input.disabled=true;}
  input.setAttribute('aria-label','Row '+(Math.floor(i/4)+1)+' column '+(i%4+1));
  grid.append(input);
 });
 $('#sudoku-feedback').textContent='';
}
$('#sudoku-check').addEventListener('click',()=>{
 const got=$('#sudoku-grid input').map(i=>Number(i.value));
 const filled=got.every(n=>Number.isInteger(n)&&n>=1&&n<=4);
 if(!filled){$('#sudoku-feedback').textContent='Fill all blank squares with numbers 1–4.';return;}
 const valid=got.every((v,i)=>v===sudokuSolution[i]);
 $('#sudoku-feedback').textContent=valid?'Solved! Every number is correct.':'Some squares are incorrect. Keep trying.';
});
$('#sudoku-new').addEventListener('click',resetSudoku);resetSudoku();
$('#book-form').addEventListener('submit',async(e)=>{
 e.preventDefault();
 const query=$('#book-query').value.trim(),root=$('#book-results');
 if(!query){return;}
 empty(root,'Searching Open Library…');
 const ctrl=new AbortController(),timeout=setTimeout(()=>ctrl.abort(),9500);
 try{
  const u=new URL('https://openlibrary.org/search.json');
  u.search=new URLSearchParams({q:query,limit:'9',fields:'key,title,author_name,first_publish_year,cover_i'}).toString();
  const response=await fetch(u,{signal:ctrl.signal});
  if(!response.ok)throw Error('Open Library returned an error');
  const data=await response.json();
  root.replaceChildren();
  const docs=Array.isArray(data.docs)?data.docs:[];
  if(!docs.length){empty(root,'No matching books. Try another search.');return;}
  for(const book of docs){
   if(typeof book.key!=='string'||!/^\/works\/[A-Za-z0-9]+$/.test(book.key))continue;
   const article=document.createElement('article');article.className='ent-item';
   const poster=document.createElement('div');poster.className='ent-poster p-culture';
   if(Number.isInteger(book.cover_i)&&book.cover_i>0){
    const img=document.createElement('img');img.className='ent-book-cover';
    img.src='https://covers.openlibrary.org/b/id/'+book.cover_i+'-M.jpg';img.loading='lazy';img.alt='Book cover';poster.append(img);
   }else poster.append(textNode('span','▤','ent-poster-symbol'));
   const body=document.createElement('div');body.className='ent-item-body';
   body.append(textNode('div',(book.author_name||[]).slice(0,2).join(', ')||'Unknown author','ent-item-meta'),
    textNode('h3',String(book.title||'Untitled').slice(0,100)),
    textNode('p','First published: '+(book.first_publish_year||'Not available')));
   body.append(externalLink('https://openlibrary.org'+book.key,'View book ↗'));
   article.append(poster,body);root.append(article);
  }
 }catch(err){empty(root,'Open Library search is unavailable or blocked. Please retry shortly.');}
 finally{clearTimeout(timeout);}
});

window.addEventListener('hashchange',()=>{
 const dest=(location.hash||'#home').slice(1);
 if(dest!=='tv'&&tvPlayer){clearTv();setNow(null,'Playback stopped after leaving VWEB TV.');}
 if(dest==='listen'&&!radioInitialized){radioInitialized=true;fetchStations();}
 if(dest!=='listen'&&podcastIframe)clearPodcast();
});
// Load radio only once the section is visited.
if(location.hash==='#listen'){radioInitialized=true;fetchStations();}
})();
