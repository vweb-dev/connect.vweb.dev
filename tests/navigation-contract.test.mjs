// VWEB.DEV Connect — zero-dependency source and navigation checks.
// Run: node --test tests/navigation-contract.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
const rootPath = new URL('..',import.meta.url).pathname;
const file = name => readFileSync(new URL('../'+name,import.meta.url),'utf8');
const html=file('index.html'),sw=file('sw.js'),app=file('assets/app.js'),mobile=file('assets/mobile-app.js');
const routes=['home','daily','studios','academy','network','pc','apps','dashboard','convert','tools','qr','ai','play','offers','community','account'];
const catalog=JSON.parse(html.match(/<script type="application\/json" id="connect-tool-route-catalog">([\s\S]*?)<\/script>/)[1]);
test('core scripts parse without syntax errors',()=>{
 for(const name of ['sw.js','assets/app.js','assets/mobile-app.js','assets/connect-integrity-v133.js','assets/connect-ui-v137.js','assets/connect-connection-v139.js']){
  assert.doesNotThrow(()=>new vm.Script(file(name),{filename:name}),name);
 }
});
test('all standard routes have mounted page sections',()=>{
 for(const id of routes)assert.ok(html.includes('id="page-'+id+'"'),id);
});
test('routing preserves nested tools and sends mobile route events',()=>{
 assert.match(app,/function navigateTopLevel\(key\)/);
 assert.match(app,/target\.pathname\.match/);
 assert.match(app,/connect:routechange/);
 assert.match(mobile,/addEventListener\('connect:routechange',updateScreen\)/);
});
test('offline fallback applies only to known Connect pages',()=>{
 const match=sw.match(/const knownNavigation=path=>([^;]+);/);
 assert.ok(match,'known navigation predicate exists');
 const known=vm.runInNewContext('path=>'+match[1]);
 for(const id of routes)assert.ok(known('/'+id),'route '+id);
 assert.ok(known('/'));
 assert.ok(known('/index.html'));
 assert.ok(known('/windows/license-diagnostics'));
 assert.ok(known('/tools/password-generator'));
 for(const path of ['/unknown','/missing.pdf','/api/private','/apps/open-typer/runtime.wasm'])assert.equal(known(path),false,path);
 assert.match(sw,/if\(!appRoute\)return Response\.error\(\)/);
});
test('service worker requires a valid cached HTML shell before activation',()=>{
 assert.match(sw,/const OFFLINE_SHELL='\/index.html'/);
 assert.match(sw,/shell\.headers\.get\('content-type'\)/);
 assert.match(sw,/cache\.put\(OFFLINE_SHELL,shell\)/);
 assert.match(sw,/cache\.match\(OFFLINE_SHELL\)/);
 assert.match(sw,/vweb-connect-static-v145/);
});
test('49+ dedicated tool paths are unique and have compatible targets',()=>{
 assert.ok(catalog.tools.length>=49);
 const paths=new Set();
 for(const t of catalog.tools){
  assert.match(t.path,/^\/(?:tools|convert|qr|ai|daily|pc|network|windows)\/[a-z0-9-]+$/,'path '+t.id);
  assert.ok(!paths.has(t.path),'duplicate '+t.path);paths.add(t.path);
  assert.ok(html.includes('id="page-'+t.section+'"'),'section '+t.id);
  if(t.mode==='qr')assert.ok(html.includes('data-qr-type="'+t.target+'"'),'qr '+t.id);
  else if(t.mode!=='quick'&&t.target)assert.ok(html.includes('id="'+t.target+'"'),'target '+t.id);
 }
});
test('essential first-party UI and diagnostics are linked and cached',()=>{
 for(const name of ['connect-ui-v137.js','connect-ui-v137.css','connect-integrity-v133.js']){
  assert.ok(html.includes('/assets/'+name),'HTML '+name);
  assert.ok(sw.includes("'/assets/"+name+"'"),'offline '+name);
 }
});

test('offline status UI is linked and cached without automated reloads',()=>{
 for(const name of ['connect-connection-v139.js','connect-connection-v139.css']){
  assert.ok(html.includes('/assets/'+name),'HTML '+name);
  assert.ok(sw.includes("'/assets/"+name+"'"),'PWA cache '+name);
 }
 const ui=file('assets/connect-connection-v139.js');
 assert.match(ui,/addEventListener\('offline'/);
 assert.match(ui,/addEventListener\('online'/);
 assert.doesNotMatch(ui,/location\.reload\(/);
});

test('all first-party script and stylesheet files linked in HTML exist',()=>{
 const linked=[...html.matchAll(/<(?:script|link)\b[^>]*?\b(?:src|href)="(\/assets\/[^"?#]+\.(?:js|css))(?:\?[^"]*)?"[^>]*>/g)].map(x=>x[1]);
 assert.ok(linked.length>=10,'at least ten first-party modules referenced');
 for(const asset of new Set(linked)){
  assert.ok(existsSync(new URL('..'+asset,import.meta.url)),asset+' missing from repository');
 }
});
test('service worker precache references resolve to repository files',()=>{
 const match=sw.match(/const APP=\[([\s\S]*?)\];/);
 assert.ok(match,'static app precache list exists');
 const entries=[...match[1].matchAll(/'([^']+)'/g)].map(x=>x[1]);
 assert.ok(entries.length>=30,'expected app shell assets');
 for(const path of new Set(entries)){
  if(path==='/')continue;
  assert.ok(existsSync(new URL('..'+path,import.meta.url)),path+' missing from offline cache');
 }
});

test('QR byte feedback updates before deferred rendering',()=>{
 const qr=file('assets/qr-studio.js');
 assert.match(qr,/function updateByteCount\(\)/);
 assert.match(qr,/function scheduleRender\(\)\s*\{[^}]*updateByteCount\(\)/);
 assert.match(html,/\/assets\/qr-studio\.js\?v=143/);
});
test('Academy listens to path-based SPA events',()=>{
 const academy=file('assets/lms.js');
 assert.match(academy,/const onAcademyRoute=/);
 assert.match(academy,/addEventListener\('connect:routechange',syncAcademyRoute\)/);
 assert.match(html,/\/assets\/lms\.js\?v=142/);
});

test('PDF Studio exposes accessible operation selection states',()=>{
 const converter=file('assets/converter.js');
 assert.match(converter,/setAttribute\('aria-pressed',String\(btn\.dataset\.pdfMode===pdfMode\)\)/);
 assert.match(converter,/other\.setAttribute\('aria-pressed',String\(active\)\)/);
 assert.match(html,/\/assets\/converter\.js\?v=145/);
});

test('PDF mode handlers use the multi-element selector without runtime crash',()=>{
 const converter=file('assets/converter.js');
 const valid=String.fromCharCode(36,36)+"('[data-pdf-mode]').forEach";
 assert.equal(converter.split(valid).length-1,2,'PDF button iteration must use querySelectorAll helper');
});

test('every dedicated tool and course deep link renders the right PHP page',()=>{
 const tools=JSON.parse(file('data/tool-routes.json')).tools;
 const courses=JSON.parse(file('data/connect-hub.json')).courses;
 assert.equal(tools.length,49);
 assert.ok(courses.length>=5);
 const checks=[
  ...tools.map(t=>({route:t.path,marker:'data-connect-tool-route="'+t.id+'"'})),
  ...courses.map(c=>({route:'/academy/course/'+c.id,marker:'data-connect-course-route="'+c.id+'"'}))
 ];
 for(const {route,marker} of checks){
  const result=spawnSync('php',['-r','$_SERVER["REQUEST_URI"]=getenv("CONNECT_TEST_ROUTE"); include "seo.php";'],{
   cwd:rootPath,env:{...process.env,CONNECT_TEST_ROUTE:route},encoding:'utf8',maxBuffer:1024*1024
  });
  assert.equal(result.status,0,'PHP failed at '+route+': '+result.stderr);
  assert.ok(result.stdout.includes(marker),'Missing correct route identity at '+route);
  assert.match(result.stdout,/<html[\s>]/i,'Missing HTML shell at '+route);
 }
 const missing=spawnSync('php',['-r','$_SERVER["REQUEST_URI"]="/tools/does-not-exist"; include "seo.php";'],{
  cwd:rootPath,encoding:'utf8'
 });
 assert.equal(missing.status,0);
 assert.equal(missing.stdout,'Page not found','Unknown deep links must not render app shell');
});

test('PDF signature preflight prevents misleading extension-only acceptance',()=>{
 const source=file('assets/converter.js');
 assert.match(source,/async function verifyPdfHeaders\(items\)/);
 assert.match(source,/if\(pdfMode!=='photos'\)await verifyPdfHeaders\(source\)/);
 assert.match(source,/invalid PDF file/);
 assert.match(source,/pdfInput\.setAttribute\('aria-invalid','true'\)/);
 assert.match(source,/pdfInput\.removeAttribute\('aria-invalid'\)/);
});

test('Filee desktop converter is discoverable in Apps > Converters with official download',()=>{
 const embedded=html.match(/<script type="application\/json" id="hub-offline-catalog">([\s\S]*?)<\/script>/);
 assert.ok(embedded,'embedded app directory exists');
 const catalog=JSON.parse(embedded[1]);
 const items=catalog.apps.filter(item=>item.id==='filee');
 assert.equal(items.length,1,'Filee must not be duplicated');
 const app=items[0];
 assert.equal(app.category,'Converters');
 assert.equal(app.kind,'Windows App');
 assert.equal(app.open,'https://filee.sh/#download');
 assert.equal(app.winget,'KnifeLemon.Filee');
 assert.ok(app.tags.includes('offline'));
 assert.ok(app.desc.includes('Linux')&&app.desc.includes('macOS'),'Disclose supported operating systems');
});
