import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const html=read('index.html'),routes=JSON.parse(read('data/tool-routes.json')).tools,sw=read('sw.js');
test('all route identifiers and canonical destinations are unique',()=> {
 assert.equal(new Set(routes.map(x=>x.id)).size,routes.length);
 assert.equal(new Set(routes.map(x=>x.path)).size,routes.length);
 for(const x of routes){assert.match(x.path,/^\/[a-z0-9-]+\/[a-z0-9-]+$/);assert.ok(x.title&&x.target&&x.section,x.id)}
});
test('conversion suite and QR workspace are installed',()=>{
 for(const id of ['convert72-suite','c72-unit-category','c72-data-mode','c72-encoding-mode','c72-base-from','c72-text-mode','qr-design','qr-reset'])assert.ok(html.includes('id="'+id+'"'),id);
 for(const p of ['assets/conversion-suite-v72.js','assets/qr-studio.js','assets/connect-release-v80.js'])assert.ok(existsSync(new URL('../'+p,import.meta.url)),p);
});
test('speed test uses the confirmed FAST widget and a comparison to Ookla',()=>{
 assert.match(html,/src="https:\/\/fast\.com\/"/);
 assert.match(html,/href="https:\/\/www\.speedtest\.net\/"/);
 assert.doesNotMatch(html,/src="https:\/\/speed\.speedtestcustom\.com\//);
});
test('service advertisements have inline illustrations and brand attribution',()=>{
 assert.equal((html.match(/class="connect-ad-card"/g)||[]).length,4);
 assert.equal((html.match(/class="connect-ad-illustration"/g)||[]).length,4);
 assert.match(html,/Powered by/);
 assert.match(html,/https:\/\/i\.ibb\.co\/k2HZ7KWh\/logo\.png/);
});
test('PWA precache only references committed assets',()=>{
 const items=sw.match(/const APP=\[([\s\S]*?)\];/)?.[1];
 assert.ok(items);
 for(const match of items.matchAll(/'([^']+)'/g)){const url=match[1];if(url==='/'||url==='/index.html')continue;assert.ok(existsSync(new URL('..'+url,import.meta.url)),url)}
 assert.doesNotMatch(items,/librespeed/);
});

test('advertisement illustrations do not share SVG gradient identifiers',()=>{
 const ids=[...html.matchAll(/id="connect-ad-gradient-(\d+)"/g)].map(x=>x[1]);
 assert.deepEqual(ids,['1','2','3','4']);
});
test('release scripts do not inject duplicate discovery searches into unrelated pages',()=>{
 const release=read('assets/connect-release-v80.js');
 assert.doesNotMatch(release,/createElement\('input'\).*type='search'/);
 assert.ok(!release.includes('root.querySelectorAll(\'a[href],article\')'));
});
test('PWA install survives an individual optional cache fetch failure',()=>{
 assert.match(sw,/Promise\.all\(APP\.map/);
 assert.match(sw,/Offline cache skipped/);
 assert.match(sw,/vweb-connect-static-v81/);
});
