'use strict';
(function(){
 const root=document.getElementById('network-status-results');
 const trigger=document.getElementById('network-status-refresh');
 const updated=document.getElementById('network-status-time');
 if(!root||!trigger)return;
 const providers=[
  {name:'Cloudflare',endpoint:'https://www.cloudflarestatus.com/api/v2/summary.json',website:'https://www.cloudflarestatus.com/'},
  {name:'GitHub',endpoint:'https://www.githubstatus.com/api/v2/summary.json',website:'https://www.githubstatus.com/'},
  {name:'OpenAI',endpoint:'https://status.openai.com/api/v2/summary.json',website:'https://status.openai.com/'},
  {name:'Discord',endpoint:'https://discordstatus.com/api/v2/summary.json',website:'https://discordstatus.com/'},
  {name:'Reddit',endpoint:'https://www.redditstatus.com/api/v2/summary.json',website:'https://www.redditstatus.com/'},
  {name:'Slack',endpoint:'https://status.slack.com/api/v2.0.0/current',website:'https://status.slack.com/'}
 ];
 let busy=false;
 const make=(tag,cls,text)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=text;return el;};
 function card(provider,message,kind,incidents){
  const item=make('article','network-provider-card');
  const title=make('h3','',provider.name),status=make('strong','network-provider-state '+kind,message);
  item.append(title,status);
  if(incidents?.length){const list=make('ul','network-incident-list');incidents.slice(0,3).forEach(value=>list.append(make('li','',value)));item.append(list);}
  const link=make('a','','Official status ↗');link.href=provider.website;link.target='_blank';link.rel='noopener noreferrer';item.append(link);return item;
 }
 async function query(provider){
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),9000);
  try{
   const response=await fetch(provider.endpoint,{signal:controller.signal,cache:'no-store',headers:{Accept:'application/json'}});
   if(!response.ok)throw new Error('status request failed');
   const data=await response.json();
   if(!data||!data.status||typeof data.status.indicator!=='string')throw new Error('unsupported feed response');
   const indicator=data.status.indicator;
   const labels={none:'Operational',minor:'Minor disruption',major:'Service disruption',critical:'Critical outage'};
   const label=labels[indicator]||'Status unknown';
   const incidents=Array.isArray(data.incidents)?data.incidents.filter(x=>x&&x.status!=='resolved').map(x=>String(x.name||'Reported incident')):[];
   return card(provider,label,indicator==='none'?'ok':indicator==='minor'?'warning':indicator==='major'||indicator==='critical'?'outage':'unknown',incidents);
  }catch(error){return card(provider,'Status unavailable','unknown',[]);}
  finally{clearTimeout(timer);}
 }
 async function refresh(){
  if(busy)return;busy=true;trigger.disabled=true;trigger.textContent='Updating…';
  root.replaceChildren(make('p','','Checking official feeds…'));
  const results=await Promise.all(providers.map(query));
  root.replaceChildren(...results);
  updated.textContent='Last checked '+new Date().toLocaleTimeString()+' · Auto-refresh every 5 minutes while open. Unavailable does not mean outage.';
  busy=false;trigger.disabled=false;trigger.textContent='Refresh status';
 }
 trigger.addEventListener('click',refresh);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden&&location.hash==='#network')refresh();});
 setInterval(()=>{if(!document.hidden&&location.hash==='#network')refresh();},300000);
 refresh();
})();