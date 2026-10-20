import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const html=read('index.html'),js=read('assets/qr-studio.js'),css=read('assets/qr-studio.css'),
 app=read('assets/app.js'),mobile=read('assets/mobile-app.js'),
 hub=read('assets/hub.js'),sw=read('sw.js'),catalog=JSON.parse(read('data/connect-hub.json'));
test('dedicated QR Studio route is discoverable and follows the app navigation',()=>{
 assert.ok(html.includes('id="page-qr"'));
 assert.match(app,/tools','qr','ai'/);
 assert.match(app,/qr:'QR Code Studio'/);
 assert.match(mobile,/qr:'QR Code Studio'/);
 assert.match(mobile,/qr:'studios'/);
 assert.match(html,/href="#qr"/);
 assert.match(hub,/destination:'#qr'/);
 assert.equal(catalog.studios.find(s=>s.id==='qr').page,'qr');
 assert.equal(JSON.parse(html.match(/<script type="application\/json" id="hub-offline-catalog">([\s\S]*?)<\/script>/)[1]).studios.find(s=>s.id==='qr').page,'qr');
});
test('ten payload forms provide meaningful inputs with sensible QR byte limit',()=>{
 for(const type of ['url','text','wifi','whatsapp','contact','email','sms','phone','location','event']){
  assert.ok(html.includes('data-qr-type="'+type+'"'),type);
  assert.ok(html.includes('data-qr-pane="'+type+'"'),type);
  assert.match(js,new RegExp("case '"+type+"'"));
 }
 assert.match(js,/new TextEncoder\(\)\.encode\(text\)\.length/);
 assert.match(js,/n>850/);
 assert.match(js,/only HTTPS or HTTP|Only HTTPS or HTTP/);
 assert.match(js,/WIFI:T:/);
 assert.match(js,/BEGIN:VCARD/);
 assert.match(js,/BEGIN:VCALENDAR/);
 assert.match(js,/SMSTO:/);
});
test('every brand setting connects to rendered QR style options',()=>{
 for(const name of ['qr-dark','qr-dark2','qr-light','qr-gradient','qr-dots','qr-eyes','qr-pupils','qr-eye-color','qr-frame-color','qr-caption-color','qr-logo-file','qr-logo-size','qr-ec','qr-margin']){
  assert.ok(html.includes('id="'+name+'"'),name);
 }
 for(const key of ['dotsOptions','cornersSquareOptions','cornersDotOptions','backgroundOptions','imageOptions','errorCorrectionLevel','colorStops']){
  assert.ok(js.includes(key),key);
 }
 assert.match(js,/imageSize:Number\(val\('qr-logo-size'\)\)\/100/);
 assert.match(js,/logo\?'H':val\('qr-ec'\)/);
});
test('exports and frame text are processed in the browser',()=>{
 for(const type of ['svg','png','webp','jpeg'])assert.ok(html.includes('data-qr-export="'+type+'"'),type);
 assert.match(js,/new DOMParser\(\)/);
 assert.match(js,/new XMLSerializer\(\)/);
 assert.match(js,/document\.createElementNS/);
 assert.match(js,/toBlob\(/);
 assert.match(js,/navigator\.clipboard\.write/);
 assert.match(js,/window\.ClipboardItem/);
 assert.match(js,/URL\.createObjectURL/);
 assert.match(js,/URL\.revokeObjectURL/);
});
test('QR engine is lazy-loaded, static, and never submits sensitive QR data to a server',()=>{
 assert.match(js,/qr-code-styling@1\.9\.2/);
 assert.match(js,/script\.src=src/);
 assert.match(js,/if\(location\.hash==='#qr'\)render\(\)/);
 assert.doesNotMatch(js,/fetch\(|XMLHttpRequest|sendBeacon|\/api\/qr|\/api\/track|WebSocket/);
 assert.match(html,/Static QR only/);
 assert.match(html,/Everything is generated locally/);
 assert.match(js,/image\/png','image\/jpeg','image\/webp/);
 assert.match(js,/file\.size>1024\*1024/);
});
test('mobile QR editor remains responsive and app assets use the current cache',()=>{
 assert.match(css,/#page-qr \.qr-workbench/);
 assert.match(css,/@media\(max-width:800px\)/);
 assert.match(css,/order:-1/);
 assert.match(css,/scroll-snap-type:x proximity/);
 assert.match(sw,/vweb-connect-static-v25/);
 for(const asset of ['qr-studio.css','qr-studio.js']){
  assert.ok(sw.includes('/assets/'+asset),asset);
  assert.ok(html.includes('/assets/'+asset+'?v=qr-studio-20261020a'),asset);
 }
});
