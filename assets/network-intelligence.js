'use strict';
(function(){
 const refresh=document.getElementById('connect-intel-refresh');
 const host=document.getElementById('connect-uptime-results');
 const radar=document.getElementById('connect-radar-results');
 const stamp=document.getElementById('connect-uptime-updated');
 if(!refresh||!host||!radar)return;
 function line(label,value){const p=document.createElement('p');p.textContent=label+': '+value;return p;}
 async function update(){
  refresh.disabled=true;host.textContent='Checking from Connect server…';radar.textContent='Checking Radar configuration…';
  const [health,regional]=await Promise.allSettled([
   fetch('/api/network-health.php',{cache:'no-store'}).then(async r=>{if(!r.ok)throw Error('API unavailable');return r.json();}),
   fetch('/api/radar-outages.php',{cache:'no-store'}).then(async r=>{if(!r.ok)throw Error('Radar API not configured');return r.json();})
  ]);
  host.replaceChildren();
  if(health.status==='fulfilled'&&Array.isArray(health.value.targets)){
   health.value.targets.forEach(t=>host.append(line(t.name,t.reachable?'Responding ('+t.response_ms+' ms)':'Unable to verify')));
   stamp.textContent='Server check: '+new Date(health.value.checked_at).toLocaleString();
  }else{host.textContent='Server-side monitoring unavailable. Check Hostinger PHP deployment.';stamp.textContent='';}
  if(regional.status==='fulfilled'&&regional.value.configured){
   radar.textContent=regional.value.summary||'Radar returned no summarized outage information.';
  }else radar.textContent='Radar API token not configured. View official outage center for Pakistan.';
  refresh.disabled=false;
 }
 refresh.addEventListener('click',update);
 window.addEventListener('hashchange',()=>{if(location.hash==='#network')update();});
 update();
})();