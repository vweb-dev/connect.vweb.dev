import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const html=read('index.html'),app=read('assets/app.js'),hub=read('assets/hub.js'),
 style=read('assets/style.css'),worker=read('sw.js'),catalog=JSON.parse(read('data/connect-hub.json'));
test('all 14 active routes remain navigable with unique DOM IDs',()=>{
 const pages=[...html.matchAll(/\bid="page-([\w-]+)"/g)].map(m=>m[1]);
 assert.equal(new Set(pages).size,14);
 for(const page of pages)assert.ok(app.includes("'"+page+"'"),page+' missing in router');
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
 assert.equal(ids.length,new Set(ids).size,'duplicate DOM IDs');
});
test('contextual navigation retains accessible keyboard route focus',()=>{
 for(const id of ['hub-context','hub-context-label','hub-context-actions'])assert.ok(html.includes('id="'+id+'"'));
 assert.match(app,/function renderContext\(key\)/);
 assert.match(app,/function route\(focusHeading\)/);
 assert.match(app,/heading\.focus\(\{preventScroll:true\}\)/);
 assert.match(style,/\.hub-context-location/);
});
test('home journeys and counters map to verified catalog',()=>{
 for(const id of ['hub-count-studios','hub-count-apps','hub-count-courses','hub-count-tools'])assert.ok(html.includes('id="'+id+'"'));
 assert.ok(catalog.studios.length>=7&&catalog.apps.length>=70&&catalog.courses.length>=5);
 assert.match(hub,/hub-count-apps/);
 assert.match(hub,/quickToolIndex\.length/);
 assert.match(html,/class="hub-journey-grid"/);
 assert.match(html,/href="#convert"/);
});
test('search can open specific local tools from homepage and command palette',()=>{
 assert.match(hub,/const quickToolIndex=\[/);
 for(const id of ['password','text','units','csv','json','encode','hash','uuid','qr','contrast'])
  assert.ok(hub.includes("tool:'"+id+"'"),id);
 assert.match(hub,/function openIndexedResult\(item\)/);
 assert.match(hub,/new CustomEvent\('connect:open-tool'/);
 assert.match(hub,/window\.addEventListener\('connect:open-tool'/);
 assert.match(hub,/openIndexedResult\(item\)/);
});
test('app directory layouts and WinGet selection remain first-party operations',()=>{
 for(const id of ['hub-app-view-grid','hub-app-view-list','hub-winget-selected-list'])
  assert.ok(html.includes('id="'+id+'"'));
 assert.match(hub,/appLayout==='list'/);
 assert.match(hub,/hub-winget-picked-chip/);
 assert.match(hub,/selectedWinget\.delete\(id\)/);
 assert.match(style,/\.hub-app-grid\.is-list/);
 assert.doesNotMatch(hub,/child_process|execSync|spawnSync/);
});
test('site shell and PWA cache use consistent current revision',()=>{
 assert.match(worker,/vweb-connect-static-v28/);
 for(const asset of ['app.js','hub.js'])
  assert.ok(html.includes('/assets/'+asset+'?v=connect-lms-20261020a'),asset);
 assert.ok(html.includes('/assets/converter.js?v=connect-qr-route-20261020b'));
 assert.ok(html.includes('/assets/style.css?v=connect-mas-first-20261020b'));
 assert.match(html,/id="hub-offline-catalog"/);
 assert.match(hub,/restoreStaticCatalog/);
});

test('local workspace supports pinned quick tools without breaking old exports',()=>{
 assert.match(hub,/pinnedTools:Array\.isArray\(p\.pinnedTools\)/);
 assert.match(hub,/state\.pinnedTools=Array\.isArray\(p\.pinnedTools\)/);
 assert.match(hub,/id="hub-data-export"|vweb-connect-workspace/);
 assert.match(hub,/connect:pins-changed/);
 assert.match(hub,/function refreshPins/);
 assert.match(hub,/renderDashboard\(\)/);
 assert.match(html,/id="qt-pin-tool"/);
 assert.match(style,/#qt-pin-tool\[aria-pressed=true\]/);
});

test('removed media pages have no navigation links or broken routes',()=>{
 assert.ok(!html.includes('href="#watch"')&&!html.includes('href="#discover"'));
 assert.ok(!html.includes('id="page-watch"')&&!html.includes('id="page-discover"'));
 assert.match(app,/key='home';history\.replaceState\(null,'','#home'\)/);
});

test('QR studio is an independent route with complete navigation',()=>{
 assert.ok(html.includes('id="page-qr"'));
 assert.ok(html.includes('href="#qr"'));
 assert.ok(read('assets/app.js').includes("'qr'"));
 assert.ok(read('assets/hub.js').includes("destination:'#qr'"));
});
