import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const html=read('index.html'),hub=read('assets/hub.js'),css=read('assets/style.css'),sw=read('sw.js');
const catalog=JSON.parse(read('data/connect-hub.json'));
test('tool studios show static navigable fallbacks without network scripts',()=>{
 const section=html.slice(html.indexOf('id="hub-studios-grid"'),html.indexOf('</div>',html.indexOf('id="hub-studios-grid"'))+6);
 for(const title of catalog.studios.map(x=>x.title))
  assert.ok(html.includes('<h3>'+title.replaceAll('&','&amp;')+'</h3>'),title);
 assert.ok(section.includes('hub-studio-card'));
 assert.match(html,/id="hub-home-studios" class="hub-studio-grid"><article/);
 assert.match(html,/id="hub-home-apps" class="hub-app-grid"><article/);
});
test('entire static curated catalog is embedded and parseable',()=>{
 const found=html.match(/<script type="application\/json" id="hub-offline-catalog">([\s\S]*?)<\/script>/);
 assert.ok(found,'missing embedded JSON catalog');
 const parsed=JSON.parse(found[1]);
 assert.equal(parsed.studios.length,catalog.studios.length);
 assert.equal(parsed.apps.length,catalog.apps.length);
 assert.equal(parsed.courses.length,catalog.courses.length);
 assert.ok(parsed.help.length>0);
});
test('catalog renders immediately, revalidates and handles offline failure',()=>{
 assert.match(hub,/applyCatalog\(JSON\.parse\(fallback\.textContent/);
 assert.match(hub,/restoreStaticCatalog\(\)/);
 assert.match(hub,/void refreshCatalog\(\)/);
 assert.match(hub,/AbortController\(\)/);
 assert.match(hub,/hub-catalog-retry/);
 assert.match(hub,/if\(catalogReady\)catalogStatus/);
 assert.match(hub,/for\(const fn of \[renderHome,renderStudios,renderApps/);
});
test('independent local tools and stable routes are preserved',()=>{
 assert.match(hub,/for\(const init of \[addQR,addDeveloperUtilities\]\)/);
 for(const page of ['studios','tools','apps','convert'])
  assert.match(html,new RegExp('id="page-'+page+'"'));
 assert.match(hub,/qrcode@1\.5\.4/);
});
test('PWA cache bust and visible fallback status',()=>{
 assert.match(sw,/vweb-connect-static-v18/);
 assert.match(html,/hub\.js\?v=tools-(?:recovery|fix)-/);
 assert.match(css,/hub-catalog-status/);
 assert.match(html,/id="hub-catalog-retry"/);
});

// Search shortcut controls are NodeList collections, not single elements.
// Querying one element and calling .forEach crashes before the catalog boots.
test('search shortcuts cannot abort tools catalog initialization',()=>{
 assert.match(hub,/\$\$\('\[data-hub-search\]'\)\.forEach\(/);
 assert.doesNotMatch(hub,/(^|\n)\s*\$\([^\n]*\)\.forEach\(/);
 assert.match(hub,/\bboot\(\);\s*\}\)\(\);/);
});

test('quick utility categories, keyboard tabs and local developer tools',()=>{
 for(const key of ['all','everyday','developer','creative']){
  assert.match(html,new RegExp('id="hub-tools-tab-'+key+'"'));
  assert.match(html,new RegExp('id="hub-tools-panel-'+key+'"'));
 }
 for(const id of ['hub-tools-search','hub-tools-summary','hub-tools-no-results','hub-tools-source'])
  assert.ok(html.includes('id="'+id+'"'),id);
 assert.match(hub,/function initToolsTabs/);
 assert.match(hub,/function addExtraUtilities/);
 assert.match(hub,/for\(const init of \[addQR,addDeveloperUtilities,addExtraUtilities,initToolsTabs\]\)/);
 assert.match(hub,/event\.key==='ArrowRight'/);
 assert.match(hub,/crypto\.subtle\.digest\('SHA-256'/);
 assert.match(hub,/crypto\.randomUUID/);
 assert.match(hub,/new TextDecoder\('utf-8'/);
 assert.match(css,/hub-tools-tabs button\[aria-selected=true\]/);
});
