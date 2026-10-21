'use strict';
/* Connect LibreSpeed interface. Test runs only after user interaction. No telemetry or IP lookup. */
(()=>{
const $=id=>document.getElementById(id);
const start=$('connect-speed-start'),stop=$('connect-speed-stop'),message=$('connect-speed-message'),bar=$('connect-speed-progress'),state=$('speed61-backend-state');
if(!start||!stop||!message||!bar)return;
let current=null,token=0,dl=[],ul=[],backendReady=false,last=null;
const write=(id,text)=>{const n=$(id);if(n)n.textContent=text};
function value(x){const n=Number(x);return Number.isFinite(n)&&n>=0?n:null}
function metric(id,n){write(id,n===null?'—':n.toFixed(1))}
function line(id,points,color){const canvas=$(id);if(!canvas)return;const ctx=canvas.getContext('2d');if(!ctx)return;const w=canvas.clientWidth||340,h=canvas.clientHeight||120,dpr=Math.min(2,devicePixelRatio||1);canvas.width=w*dpr;canvas.height=h*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);ctx.strokeStyle='rgba(186,203,215,.22)';ctx.lineWidth=1;for(let k=1;k<4;k++){ctx.beginPath();ctx.moveTo(0,k*h/4);ctx.lineTo(w,k*h/4);ctx.stroke();}if(points.length<2)return;const max=Math.max(1,...points)*1.2;ctx.beginPath();points.forEach((n,i)=>{const x=(i/(points.length-1))*w,y=h-12-(n/max)*(h-24);if(!i)ctx.moveTo(x,y);else ctx.lineTo(x,y)});ctx.strokeStyle=color;ctx.lineWidth=2.5;ctx.stroke();}
function sample(id,n,arr,canvas,color){metric(id,n);if(n===null)return;arr.push(n);if(arr.length>48)arr.shift();line(canvas,arr,color)}
function reset(){dl=[];ul=[];for(const id of ['connect-speed-down','connect-speed-up','connect-speed-latency','connect-speed-jitter'])write(id,'—');['speed46-streaming','speed46-gaming','speed46-calls'].forEach(id=>write(id,'Not assessed'));line('speed45-download-chart',[], '#e5b76c');line('speed45-upload-chart',[],'#b5a0ef');bar.style.width='0%';write('speed45-test-time','—');}
function update(s){if(!s)return;sample('connect-speed-down',value(s.dlStatus),dl,'speed45-download-chart','#e5b76c');sample('connect-speed-up',value(s.ulStatus),ul,'speed45-upload-chart','#b5a0ef');metric('connect-speed-latency',value(s.pingStatus));metric('connect-speed-jitter',value(s.jitterStatus));const state=Number(s.testState);const progress=state===2?0.05+0.18*(Number(s.pingProgress)||0):state===1?0.25+0.48*(Number(s.dlProgress)||0):state===3?0.75+0.23*(Number(s.ulProgress)||0):state===4?1:0.03;bar.style.width=Math.round(Math.max(0,Math.min(1,progress))*100)+'%';const phases={'0':'Preparing server…','1':'Measuring download…','2':'Measuring latency & jitter…','3':'Measuring upload…','4':'Test complete','5':'Stopped'};message.textContent=phases[String(state)]||'Testing…';}
function qualify(s){const d=value(s?.dlStatus),u=value(s?.ulStatus),p=value(s?.pingStatus),j=value(s?.jitterStatus);write('speed46-streaming',d===null?'Not assessed':d>=25?'Likely good':d>=5?'Basic streaming':'May struggle');write('speed46-gaming',p===null||j===null?'Not assessed':p<40&&j<15?'Likely responsive':p<100?'Variable latency':'High latency');write('speed46-calls',u===null||j===null?'Not assessed':u>3&&j<30?'Likely good':u>1?'Variable quality':'May struggle');}
function finish(){start.disabled=!backendReady;stop.disabled=true;current=null;}
function saved(){try{const x=JSON.parse(localStorage.getItem('connect.speed61.history')||'[]');return Array.isArray(x)?x:[]}catch{return []}}
function reportHistory(){const host=$('speed61-history');if(!host)return;host.replaceChildren();const rows=saved();if(!rows.length){host.textContent='No completed tests saved on this device.';return}for(const r of rows.slice(0,5)){const row=document.createElement('div');row.className='speed61-history-row';row.textContent=new Date(r.at).toLocaleString()+'  ·  ↓ '+r.download+' Mbps  ↑ '+r.upload+' Mbps  ·  '+r.ping+' ms';host.append(row)}}
function record(s){const n=x=>{const z=value(x);return z===null?'—':z.toFixed(1)};last={at:new Date().toISOString(),download:n(s.dlStatus),upload:n(s.ulStatus),ping:n(s.pingStatus),jitter:n(s.jitterStatus)};try{localStorage.setItem('connect.speed61.history',JSON.stringify([last,...saved()].slice(0,10)))}catch{}reportHistory()}
const history=document.createElement('details');history.className='speed61-history';const summary=document.createElement('summary');summary.textContent='Previous tests on this device';const items=document.createElement('div');items.id='speed61-history';history.append(summary,items);
const section=start.closest('.connect-native-speed');section?.append(history);reportHistory();
const controls=start.parentElement;
const copy=document.createElement('button');copy.type='button';copy.className='button secondary speed61-copy';copy.textContent='Copy results';copy.disabled=true;controls?.append(copy);
copy.addEventListener('click',async()=>{if(!last)return;const text='LibreSpeed · Connect server\nDownload: '+last.download+' Mbps\nUpload: '+last.upload+' Mbps\nPing: '+last.ping+' ms\nJitter: '+last.jitter+' ms\nMeasured: '+new Date(last.at).toLocaleString()+'\nServer-limited results, not universal ISP speed.';try{await navigator.clipboard.writeText(text);copy.textContent='Copied ✓';setTimeout(()=>copy.textContent='Copy results',1600)}catch{copy.textContent='Clipboard unavailable'}});
const check=async()=>{
 if(typeof Speedtest!=='function'){state.textContent='LibreSpeed engine not loaded';message.textContent='Speed test files missing. Check the deployment and reload.';start.disabled=true;return}
 try{const ctl=new AbortController();const timer=setTimeout(()=>ctl.abort(),8000);let response;try{response=await fetch('/librespeed/backend/empty.php?health='+Date.now(),{cache:'no-store',signal:ctl.signal});}finally{clearTimeout(timer)}
  if(!response.ok)throw Error('HTTP '+response.status);const body=(await response.text()).trim();if(body.includes('<?php'))throw Error('PHP not executing');
  backendReady=true;state.textContent='PHP backend ready';message.textContent='Ready · Starts only when you press Start. Hosting bandwidth will be used.';start.disabled=false;
 }catch(e){backendReady=false;start.disabled=true;state.textContent='PHP backend unavailable';message.textContent='Cannot reach LibreSpeed PHP backend. Deploy backend files and enable PHP on hosting.';}
};
start.disabled=true;stop.disabled=true;check();
start.addEventListener('click',()=>{if(!backendReady||current)return;const id=++token;reset();last=null;copy.disabled=true;start.disabled=true;stop.disabled=false;
 try{const speed=new Speedtest();current=speed;speed.setParameter('url_dl','/librespeed/backend/garbage.php');speed.setParameter('url_ul','/librespeed/backend/empty.php');speed.setParameter('url_ping','/librespeed/backend/empty.php');speed.setParameter('url_getIp','/librespeed/backend/empty.php');speed.setParameter('test_order','P_D_U');speed.setParameter('time_dl_max',8);speed.setParameter('time_ul_max',8);speed.setParameter('count_ping',10);speed.setParameter('telemetry_level',0);speed.setParameter('time_auto',true);speed.setParameter('xhr_dlMultistream',2);speed.setParameter('xhr_ulMultistream',2);
 let latest=null;speed.onupdate=data=>{if(id!==token)return;latest=data;update(data)};
 speed.onend=aborted=>{if(id!==token)return;if(!aborted&&latest&&Number(latest.testState)===4){qualify(latest);record(latest);copy.disabled=false;bar.style.width='100%';write('speed45-test-time',new Date().toLocaleString());message.textContent='Completed · Measurements are specific to this hosting server.';}else message.textContent=aborted?'Test stopped.':'Test ended without complete results. Check server limits and retry.';finish();};
 speed.start();
 }catch(e){finish();message.textContent='Unable to start LibreSpeed. Check worker and PHP files.';state.textContent='Engine error';}
});
stop.addEventListener('click',()=>{if(!current)return;token++;try{current.abort()}catch{}finish();message.textContent='Test stopped.';bar.style.width='0%'});
window.addEventListener('resize',()=>{line('speed45-download-chart',dl,'#e5b76c');line('speed45-upload-chart',ul,'#b5a0ef')});
})();
