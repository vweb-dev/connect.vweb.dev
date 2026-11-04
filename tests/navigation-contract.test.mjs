// VWEB.DEV Connect — zero-dependency source and navigation checks.
// Run: node --test tests/navigation-contract.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const file = name => readFileSync(new URL('../'+name,import.meta.url),'utf8');
const html=file('index.html'),sw=file('sw.js'),app=file('assets/app.js'),mobile=file('assets/mobile-app.js');
const routes=['home','daily','studios','academy','network','pc','apps','dashboard','convert','tools','qr','ai','play','offers','community','account'];
const catalog=JSON.parse(html.match(/<script type="application\/json" id="connect-tool-route-catalog">([\s\S]*?)<\/script>/)[1]);
test('core scripts parse without syntax errors',()=>{
 for(const name of ['sw.js','assets/app.js','assets/mobile-app.js','assets/connect-integrity-v133.js','assets/connect-ui-v137.js']){
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
 assert.match(sw,/vweb-connect-static-v139/);
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
