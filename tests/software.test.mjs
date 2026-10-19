import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=(p)=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const html=read('index.html'),app=read('assets/app.js'),hub=read('assets/hub.js'),
 catalog=JSON.parse(read('data/connect-hub.json')),endpoint=read('api/media.php');
test('software directory expanded without duplicate apps or packages',()=>{
 assert.ok(catalog.apps.length>=70);
 const ids=catalog.apps.map(a=>a.id),winget=catalog.apps.filter(a=>a.winget).map(a=>a.winget);
 assert.equal(ids.length,new Set(ids).size);
 assert.equal(winget.length,new Set(winget).size);
 assert.ok(winget.length>=30);
 assert.ok(winget.every(id=>/^[-.\w+]+$/.test(id)));
 assert.ok(catalog.apps.every(a=>a.open.startsWith('https://')));
});
test('WinGet builder supports search, categories, presets and CMD/PS1 downloads',()=>{
 for(const id of ['hub-winget-search','hub-winget-category','hub-winget-options','hub-winget-cmd-download','hub-winget-json']){
  assert.ok(html.includes('id="'+id+'"'));
 }
 for(const pack of ['essential','creator','developer','creative','privacy','media'])
  assert.match(html,new RegExp('data-pack="'+pack+'"'));
 for(const token of ['selectedWinget','wingetCategory','winget install --id','vweb-software-pack.cmd','vweb-software-pack.ps1','wingetLines'])
  assert.ok(hub.includes(token));
});
test('genuine CMD diagnostic and externally labeled GitHub source',()=>{
 assert.match(html,/massgravel\/Microsoft-Activation-Scripts/);
 assert.match(html,/THIRD-PARTY GITHUB PROJECT/);
 assert.match(html,/id="hub-act-cmd-copy"/);
 assert.match(html,/id="hub-act-check-download"/);
 assert.match(hub,/windows-activation-status\.cmd/);
 assert.match(hub,/slmgr \/xpr/);
 assert.match(html,/data-act-cmd="slmgr \/ato"/);
 assert.doesNotMatch(hub,/get\.activated\.win|irm .* \| iex/);
 assert.match(html,/Connect does not host or auto-run these scripts/);
});
test('TV and radio are retired on frontend and API',()=>{
 assert.ok(!html.includes('page-tv'));
 assert.ok(!html.includes('page-listen'));
 assert.ok(!app.includes("'listen','play'"));
 assert.match(endpoint,/http_response_code\(410\)/);
 assert.doesNotMatch(endpoint,/connect_db\(/);
});
