#!/usr/bin/env node
'use strict';
/* Reproducible Connect local-state regression tests. Node built-ins only.
 * Run from repo root: node scripts/test-connect-state-v129.cjs
 * Does not access any accounts, network or production data.
 */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const ROOT=path.resolve(__dirname,'..');
const checks=[];
const record=(label,fn)=>checks.push(Promise.resolve().then(fn).then(()=>({label,pass:true}),e=>({label,pass:false,error:e.message})));
const store=()=>{const records=new Map();return {
 records,
 getItem:k=>records.has(k)?records.get(k):null,
 setItem:(k,v)=>records.set(k,String(v)),
 removeItem:k=>records.delete(k)
}};
function vaultHarness(){
 const storage=store();let reloads=0,accept=true;
 const win={confirm:()=>accept,location:{reload:()=>{reloads++}}};
 const doc={readyState:'loading',addEventListener(){},getElementById(){return null},querySelectorAll(){return []}};
 let source=fs.readFileSync(path.join(ROOT,'assets/connect-data-vault-v127.js'),'utf8');
 assert.match(source,/\}\)\(\);\s*$/);
 source=source.replace(/\}\)\(\);\s*$/,'exposed={validateState,validatePaths,importBackup};})();');
 const api=new Function('localStorage','document','window','URL', 'let exposed;'+source+';return exposed;')(storage,doc,win,URL);
 return {storage,api,win,get reloads(){return reloads},set accept(v){accept=v}};
}
const file=v=>({size:JSON.stringify(v).length,text:async()=>JSON.stringify(v)});
const backup=learning=>({format:'vweb-connect-backup',version:1,learning,workspace:['/qr/wifi'],saved:['/qr/wifi','/tools']});
record('restores nested assessments while preserving absent fields',async()=>{
 const h=vaultHarness(),key='vweb.connect20.v1';
 h.storage.setItem(key,JSON.stringify({notes:{windows11:'Keep my note'},completed:{windows11:[0]},enrolled:['windows11']}));
 await h.api.importBackup(file(backup({assessments:{windows11:{'0':{score:2,total:2,updated:1730000000000}}}})));
 const result=JSON.parse(h.storage.getItem(key));
 assert.equal(result.assessments.windows11['0'].score,2);
 assert.equal(result.notes.windows11,'Keep my note');
 assert.deepEqual(result.completed.windows11,[0]);
 assert.equal(h.reloads,1);
});
record('rejects invalid assessment without mutating progress',async()=>{
 const h=vaultHarness(),key='vweb.connect20.v1';
 h.storage.setItem(key,JSON.stringify({notes:{windows11:'untouched'}}));
 const before=h.storage.getItem(key);
 await h.api.importBackup(file(backup({assessments:{windows11:{'0':{score:9,total:2}}}})));
 assert.equal(h.storage.getItem(key),before);assert.equal(h.reloads,0);
});
record('cancelled imports do not write storage',async()=>{
 const h=vaultHarness(),key='vweb.connect20.v1';h.accept=false;
 h.storage.setItem(key,JSON.stringify({notes:{windows11:'original'}}));
 const before=h.storage.getItem(key);
 await h.api.importBackup(file(backup({notes:{windows11:'overwrite'}})));
 assert.equal(h.storage.getItem(key),before);assert.equal(h.reloads,0);
});
record('rejects unsafe saved destinations',async()=>{
 const h=vaultHarness(),key='vweb.connect20.v1';h.storage.setItem(key,'{}');
 const before=h.storage.getItem(key);
 await h.api.importBackup(file({...backup({}),saved:['javascript:alert(1)']}));
 assert.equal(h.storage.getItem(key),before);assert.equal(h.reloads,0);
});
record('restores saved-only backup and HTTPS destinations',async()=>{
 const h=vaultHarness();
 await h.api.importBackup(file({...backup({}),saved:['/qr/wifi','https://example.com/tool']}));
 assert.equal(h.reloads,1);
 assert.deepEqual(JSON.parse(h.storage.getItem('connect-command-saved-v1')),['/qr/wifi','https://example.com/tool']);
});
record('My Workspace preserves Command Center root pages and external apps',async()=>{
 const storage=store();
 storage.setItem('connect-command-saved-v1',JSON.stringify(['/tools','/apps','/qr/wifi','https://example.com/tool']));
 storage.setItem('connect30-favorites',JSON.stringify(['/qr/wifi']));
 const doc={readyState:'loading',addEventListener(){},getElementById(){return null}};
 const win={addEventListener(){},dispatchEvent(){}};
 let source=fs.readFileSync(path.join(ROOT,'assets/connect30-workspace.js'),'utf8');
 source=source.replace(/\}\)\(\);\s*$/,'exposed={get,save};})();');
 const api=new Function('localStorage','document','window','Event','let exposed;'+source+'return exposed;')(storage,doc,win,function Event(){});
 api.save(['/qr/wifi','/academy/course/windows11']);
 const saved=JSON.parse(storage.getItem('connect-command-saved-v1'));
 for(const url of ['/tools','/apps','/qr/wifi','/academy/course/windows11','https://example.com/tool'])assert.ok(saved.includes(url),url);
});
(async()=>{
 const results=await Promise.all(checks);
 for(const x of results)console.log((x.pass?'PASS':'FAIL')+' '+x.label+(x.error?': '+x.error:''));
 const fail=results.filter(x=>!x.pass).length;
 console.log((results.length-fail)+'/'+results.length+' regression tests passed.');
 if(fail)process.exitCode=1;
})();
