import SpeedTest from 'https://cdn.skypack.dev/@cloudflare/speedtest';
const start=document.getElementById('connect-speed-start'),stop=document.getElementById('connect-speed-stop'),message=document.getElementById('connect-speed-message'),bar=document.getElementById('connect-speed-progress');
if(start&&stop){
 let engine=null,run=0;
 const output=(key,value,scale=1)=>{const node=document.getElementById('connect-speed-'+key);if(node)node.textContent=Number.isFinite(value)&&value>=0?(value/scale).toFixed(1):'—';};
 const dial=document.getElementById('connect-speed-dial-value'),arc=document.getElementById('connect-speed-dial-progress'),dialLabel=document.getElementById('connect-speed-dial-label');
 const updateDial=value=>{if(!dial)return;dial.textContent=Number.isFinite(value)&&value>=0?value.toFixed(1):'—';if(arc)arc.style.strokeDasharray=(Number.isFinite(value)?Math.min(100,Math.max(0,value/300*100)):0)+' 100';};
 const display=results=>{
  if(!results)return;
  const read=fn=>{try{return fn();}catch{return undefined;}};
  const down=read(()=>results.getDownloadBandwidth());output('down',down,1e6);updateDial(Number.isFinite(down)?down/1e6:NaN);
  output('up',read(()=>results.getUploadBandwidth()),1e6);
  output('latency',read(()=>results.getUnloadedLatency()));
  output('jitter',read(()=>results.getUnloadedJitter()));
 };
 const clean=()=>{engine=null;start.disabled=false;stop.disabled=true;};
 start.addEventListener('click',()=>{
  if(engine)return;
  const token=++run;
  ['down','up','latency','jitter'].forEach(k=>output(k,NaN));updateDial(NaN);if(dialLabel)dialLabel.textContent='DOWNLOAD SPEED';
  message.textContent='Measuring connection to Cloudflare · please keep this tab open…';
  bar.style.width='8%';start.disabled=true;stop.disabled=false;
  try{
   const test=new SpeedTest({autoStart:false,
    measurements:[
     {type:'latency',numPackets:20},
     {type:'download',bytes:100000,count:4},
     {type:'download',bytes:1000000,count:6},
     {type:'download',bytes:10000000,count:4},
     {type:'upload',bytes:100000,count:4},
     {type:'upload',bytes:1000000,count:6},
     {type:'upload',bytes:10000000,count:4}
    ]
   });
   engine=test;
   test.onResultsChange=()=>{if(token!==run)return;display(test.results);bar.style.width='65%';};
   test.onFinish=results=>{if(token!==run)return;display(results);bar.style.width='100%';message.textContent='Test completed · measured against Cloudflare servers. Results can differ from ISP package speed.';clean();};
   test.onError=error=>{if(token!==run)return;message.textContent='Speed test failed: '+String(error).slice(0,140);bar.style.width='0%';clean();};
   test.play();
  }catch(error){message.textContent='Cannot start measurement: '+String(error.message||error);clean();}
 });
 stop.addEventListener('click',()=>{if(!engine)return;run++;try{engine.pause();}catch{}clean();bar.style.width='0%';message.textContent='Test paused. Start a new test when ready.';});
}
