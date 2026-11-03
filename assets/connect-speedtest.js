'use strict';
// Load Cloudflare's open-source measurement engine only when the user starts a test.
// A blocked CDN must not disable the Stop button or the rest of Connect.
let speedTestLoader=null;
async function loadSpeedTest(){
 if(speedTestLoader)return speedTestLoader;
 speedTestLoader=(async()=>{
   let lastError;
   for(const url of ['https://cdn.jsdelivr.net/npm/@cloudflare/speedtest@1.14.2/+esm','https://cdn.skypack.dev/@cloudflare/speedtest@1.14.2']){
     try{
       const loaded=await Promise.race([import(url),new Promise((_,reject)=>setTimeout(()=>reject(Error('Engine download timed out')),14000))]);
       const Engine=loaded.default||loaded.SpeedTest;
       if(typeof Engine==='function')return Engine;
       throw Error('Invalid measurement module');
     }catch(error){lastError=error}
   }
   throw lastError||Error('Measurement engine unavailable');
 })().catch(error=>{speedTestLoader=null;throw error});
 return speedTestLoader;
}
const $=id=>document.getElementById(id), start=$('connect-speed-start'),stop=$('connect-speed-stop'),message=$('connect-speed-message'),progress=$('connect-speed-progress');
if(start&&stop){
let current=null,run=0,down=[],up=[],loading=false;
const historyKey='connect-speed-history-v1',historyNode=$('connect-speed-history');
const getHistory=()=>{try{const data=JSON.parse(localStorage.getItem(historyKey)||'[]');return Array.isArray(data)?data.filter(x=>x&&typeof x==='object').slice(0,10):[]}catch{return[]}};
const saveHistory=result=>{try{localStorage.setItem(historyKey,JSON.stringify([result,...getHistory()].slice(0,10)))}catch{}renderHistory()};
function renderHistory(){
 if(!historyNode)return;
 const items=getHistory();historyNode.replaceChildren();
 if(!items.length){historyNode.textContent='No saved tests yet.';return}
 const grid=document.createElement('div');grid.className='cs121-history-grid';
 for(const item of items){
  const row=document.createElement('div');row.className='cs121-history-row';
  const label=document.createElement('strong');label.textContent=new Date(item.date).toLocaleString();
  const metrics=document.createElement('span');
  const fmt=n=>typeof n==='number'&&Number.isFinite(n)?n.toFixed(1):'—';
  metrics.textContent='↓ '+fmt(item.down)+' Mbps · ↑ '+fmt(item.up)+' Mbps · '+fmt(item.latency)+' ms · '+item.mode;
  row.append(label,metrics);grid.append(row);
 }
 historyNode.append(grid);
}
// CSV export uses normalized date/mode and numeric fields only to prevent
// spreadsheet-formula injection from manually modified browser storage.
function speedHistoryCsv(items){
 const cells=[['Timestamp (UTC)','Mode','Download (Mbps)','Upload (Mbps)','Latency (ms)','Jitter (ms)']];
 for(const item of items){
  const timestamp=new Date(item.date);
  const date=Number.isFinite(timestamp.getTime())?timestamp.toISOString():'';
  const mode=item.mode==='full'?'full':'quick';
  const number=value=>typeof value==='number'&&Number.isFinite(value)&&value>=0?String(value):'';
  cells.push([date,mode,number(item.down),number(item.up),number(item.latency),number(item.jitter)]);
 }
 return cells.map(row=>row.join(',')).join('\r\n')+'\r\n';
}
function downloadHistory(data,filename,mime){
 const url=URL.createObjectURL(new Blob([data],{type:mime}));
 const a=document.createElement('a');a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),3000);
}
$('connect-speed-export-csv')?.addEventListener('click',()=>{
 downloadHistory(speedHistoryCsv(getHistory()),'connect-speed-history.csv','text/csv;charset=utf-8');
});
const modeSelect=$('connect-speed-mode');
const quickMeasurements=[{type:'latency',numPackets:12},{type:'download',bytes:100000,count:3,bypassMinDuration:true},{type:'download',bytes:1000000,count:3},{type:'upload',bytes:100000,count:3,bypassMinDuration:true},{type:'upload',bytes:1000000,count:3}];
const fullMeasurements=[{type:'latency',numPackets:20},{type:'download',bytes:100000,count:4,bypassMinDuration:true},{type:'download',bytes:1000000,count:6},{type:'download',bytes:10000000,count:4},{type:'upload',bytes:100000,count:4,bypassMinDuration:true},{type:'upload',bytes:1000000,count:6},{type:'upload',bytes:10000000,count:4}];
$('connect-speed-export')?.addEventListener('click',()=>{
 downloadHistory(JSON.stringify({schema:1,results:getHistory()},null,2),
  'connect-speed-history.json','application/json');
});
$('connect-speed-clear')?.addEventListener('click',()=>{
 if(!getHistory().length)return;
 if(!window.confirm('Delete all saved speed-test results from this browser? This cannot be undone.'))return;
 try{localStorage.removeItem(historyKey)}catch{}
 renderHistory();
});
renderHistory();
const numeric=(fn)=>{try{const v=fn();return Number.isFinite(v)&&v>=0?v:null;}catch{return null;}};
function put(id,value,digits=1){const e=$(id);if(e)e.textContent=value===null?'—':value.toFixed(digits);}
function plot(id,values,color){const canvas=$(id);if(!canvas)return;const ctx=canvas.getContext('2d');if(!ctx)return;const dpr=Math.min(2,window.devicePixelRatio||1),w=canvas.clientWidth||300,h=canvas.clientHeight||150;canvas.width=Math.floor(w*dpr);canvas.height=Math.floor(h*dpr);ctx.scale(dpr,dpr);ctx.clearRect(0,0,w,h);ctx.strokeStyle='#50606a';ctx.lineWidth=1;for(let i=1;i<=3;i++){ctx.beginPath();ctx.moveTo(0,h*i/4);ctx.lineTo(w,h*i/4);ctx.stroke();}if(values.length<2)return;const max=Math.max(1,...values)*1.15;ctx.beginPath();values.forEach((v,i)=>{const x=i/(Math.max(1,values.length-1))*w,y=h-12-v/max*(h-24);if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);});ctx.strokeStyle=color;ctx.lineWidth=3;ctx.stroke();}
function update(results){if(!results)return;const d=numeric(()=>results.getDownloadBandwidth()),u=numeric(()=>results.getUploadBandwidth()),l=numeric(()=>results.getUnloadedLatency()),j=numeric(()=>results.getUnloadedJitter());put('connect-speed-down',d===null?null:d/1e6);put('connect-speed-up',u===null?null:u/1e6);put('connect-speed-latency',l);put('connect-speed-jitter',j);if(d!==null){const value=d/1e6;if(down.length===0||Math.abs(value-down[down.length-1])>.01){down.push(value);if(down.length>55)down.shift();plot('speed45-download-chart',down,'#ff993b');$('speed45-down-count').textContent=String(down.length);$('speed45-down-detail').textContent='Latest: '+value.toFixed(1)+' Mbps';}}if(u!==null){const value=u/1e6;if(up.length===0||Math.abs(value-up[up.length-1])>.01){up.push(value);if(up.length>55)up.shift();plot('speed45-upload-chart',up,'#c8a2ff');$('speed45-up-count').textContent=String(up.length);$('speed45-up-detail').textContent='Latest: '+value.toFixed(1)+' Mbps';}}}
function quality(results){const d=numeric(()=>results.getDownloadBandwidth()),u=numeric(()=>results.getUploadBandwidth()),l=numeric(()=>results.getUnloadedLatency()),j=numeric(()=>results.getUnloadedJitter());const report=(id,value)=>{const el=$(id);if(el)el.textContent=value;};report('speed46-streaming',d===null?'Not assessed':d>=25000000?'Likely good':d>=5000000?'Basic streaming':'May struggle');report('speed46-gaming',l===null||j===null?'Not assessed':l<40&&j<15?'Likely responsive':l<100?'Variable latency':'High latency');report('speed46-calls',u===null||j===null?'Not assessed':u>3000000&&j<30?'Likely good':u>1000000?'Variable quality':'May struggle');}
function end(){current=null;start.disabled=false;stop.disabled=true;if(modeSelect)modeSelect.disabled=false;}
start.addEventListener('click',async()=>{if(current||loading)return;loading=true;const token=++run;down=[];up=[];['speed46-streaming','speed46-gaming','speed46-calls'].forEach(id=>{if($(id))$(id).textContent='Not assessed';});['down','up','latency','jitter'].forEach(k=>put('connect-speed-'+k,null));['speed45-down-count','speed45-up-count'].forEach(id=>$(id).textContent='0');$('speed45-down-detail').textContent='Waiting for samples';$('speed45-up-detail').textContent='Waiting for samples';$('speed45-test-time').textContent='Running…';plot('speed45-download-chart',[],'#ff993b');plot('speed45-upload-chart',[],'#c8a2ff');progress.style.width='10%';start.disabled=true;stop.disabled=false;if(modeSelect)modeSelect.disabled=true;message.textContent='Loading speed test engine…';try{const SpeedTest=await loadSpeedTest();if(token!==run)return;loading=false;const mode=modeSelect?.value==='full'?'full':'quick';message.textContent='Testing latency, download and upload against Cloudflare · '+mode+' mode…';const test=new SpeedTest({autoStart:false,measurements:mode==='full'?fullMeasurements:quickMeasurements});current=test;test.onResultsChange=()=>{if(token!==run)return;update(test.results);progress.style.width='70%';};test.onFinish=results=>{
 if(token!==run)return;
 // Some Cloudflare speedtest builds call onFinish() without an argument.
 // The authoritative result container is the instance's .results property.
 const finalResults=results&&typeof results.getDownloadBandwidth==='function'?results:test.results;
 try{
  if(!finalResults)throw Error('Measurement engine returned no results.');
  update(finalResults);quality(finalResults);
  const bandwidth=metric=>numeric(()=>finalResults[metric]());
  const d=bandwidth('getDownloadBandwidth'),u=bandwidth('getUploadBandwidth');
  saveHistory({date:new Date().toISOString(),mode,down:d===null?null:d/1e6,
   up:u===null?null:u/1e6,latency:bandwidth('getUnloadedLatency'),jitter:bandwidth('getUnloadedJitter')});
  progress.style.width='100%';
  $('speed45-test-time').textContent=new Date().toLocaleString();
  message.textContent='Completed · Results measured against Cloudflare; packet loss not tested.';
 }catch(error){
  message.textContent='Test finished but results could not be read: '+String(error.message||error).slice(0,130);
  progress.style.width='0%';
 }finally{end();}
};test.onError=error=>{if(token!==run)return;message.textContent='Unable to complete test: '+String(error).slice(0,140);progress.style.width='0%';end();};test.play();}catch(e){if(token!==run)return;message.textContent='Speed test engine unavailable: '+String(e.message||e);progress.style.width='0%';end();}finally{if(token===run)loading=false}});
stop.addEventListener('click',()=>{if(!current&&!loading)return;run++;loading=false;try{current?.pause();}catch{}end();message.textContent='Test stopped.';progress.style.width='0%';$('speed45-test-time').textContent='Stopped';});
window.addEventListener('resize',()=>{plot('speed45-download-chart',down,'#ff993b');plot('speed45-upload-chart',up,'#c8a2ff');});
}