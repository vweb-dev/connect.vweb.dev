import SpeedTest from 'https://cdn.skypack.dev/@cloudflare/speedtest';
const start=document.getElementById('connect-speed-start'),stop=document.getElementById('connect-speed-stop'),message=document.getElementById('connect-speed-message'),bar=document.getElementById('connect-speed-progress');
if(start&&stop){let engine=null;
const write=(key,value,unit)=>{const el=document.getElementById('connect-speed-'+key);if(el&&Number.isFinite(value))el.textContent=(value/unit).toFixed(1);};
const show=summary=>{if(!summary)return;write('down',summary.download,1000000);write('up',summary.upload,1000000);write('latency',summary.latency,1);write('jitter',summary.jitter,1);};
const reset=()=>{start.disabled=false;stop.disabled=true;bar.style.width='0%';engine=null;};
start.addEventListener('click',()=>{if(engine)return;['down','up','latency','jitter'].forEach(key=>document.getElementById('connect-speed-'+key).textContent='—');start.disabled=true;stop.disabled=false;message.textContent='Running measurement against Cloudflare…';bar.style.width='14%';
try{engine=new SpeedTest({autoStart:false,measurements:[{type:'latency',numPackets:12},{type:'download',bytes:1e5,count:6},{type:'download',bytes:1e6,count:5},{type:'upload',bytes:1e5,count:6},{type:'upload',bytes:1e6,count:5}]});
engine.onResultsChange=()=>{if(!engine)return;try{show(engine.results.getSummary());bar.style.width='65%';}catch{}};
engine.onFinish=results=>{show(results.getSummary());bar.style.width='100%';message.textContent='Completed · Measurements reflect performance to Cloudflare.';start.disabled=false;stop.disabled=true;engine=null;};
engine.onError=error=>{message.textContent='Measurement failed: '+String(error).slice(0,140);reset();};
engine.play();}catch(error){message.textContent='Speed engine unavailable: '+error.message;reset();}
});
stop.addEventListener('click',()=>{if(engine){try{engine.pause();}catch{}reset();message.textContent='Test stopped.';}});
}