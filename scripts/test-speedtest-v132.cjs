#!/usr/bin/env node
'use strict';
/* Browser-free Speed Test callback and history export regression checks.
 * Run: node scripts/test-speedtest-v132.cjs
 */
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const src=fs.readFileSync(path.join(__dirname,'../assets/connect-speedtest.js'),'utf8');
const callbackStart=src.indexOf('test.onFinish=results=>{');
const callbackEnd=src.indexOf('test.onError=',callbackStart);
assert.ok(callbackStart>=0&&callbackEnd>callbackStart,'Speed Test finish callback available');
const callback=src.slice(callbackStart,callbackEnd);
const csvStart=src.indexOf('function speedHistoryCsv(items){');
const csvEnd=src.indexOf('function downloadHistory(',csvStart);
assert.ok(csvStart>=0&&csvEnd>csvStart,'History CSV builder available');
const csv=new Function(src.slice(csvStart,csvEnd)+'return speedHistoryCsv;')();
const measurements=()=>({
 getDownloadBandwidth:()=>72000000,getUploadBandwidth:()=>14000000,
 getUnloadedLatency:()=>19,getUnloadedJitter:()=>4
});
function scenario({argument,instance,stale=false}={}){
 const saved=[],calls=[],elements={};
 const $=id=>elements[id]||(elements[id]={textContent:''});
 const numeric=fn=>{try{const v=fn();return Number.isFinite(v)&&v>=0?v:null}catch{return null}};
 const ctx=new Function('provided','instance','stale','$','numeric','saved','calls',`
   let token=1,run=stale?2:1,mode='quick';
   const test={results:instance};
   const progress={style:{width:'0%'}};
   const message={textContent:''};
   const update=result=>calls.push(['update',result]);
   const quality=result=>calls.push(['quality',result]);
   const saveHistory=result=>saved.push(result);
   const end=()=>calls.push(['end']);
   ${callback}
   test.onFinish(provided);
   return {progress:progress.style.width,message:message.textContent};
 `);
 return {state:ctx(argument,instance,stale,$,numeric,saved,calls),saved,calls};
}
async function main(){
 const tests=[
  ['Callback with explicit results',()=>{const m=measurements(),s=scenario({argument:m,instance:m});assert.equal(s.saved[0].down,72);assert.equal(s.saved[0].up,14);assert.equal(s.state.progress,'100%');assert.equal(s.calls.filter(x=>x[0]==='end').length,1)}],
  ['Callback without args falls back to instance.results',()=>{const s=scenario({instance:measurements()});assert.equal(s.saved[0].latency,19);assert.equal(s.calls.filter(x=>x[0]==='end').length,1)}],
  ['Missing results still re-enables controls',()=>{const s=scenario();assert.equal(s.saved.length,0);assert.equal(s.state.progress,'0%');assert.ok(s.state.message.includes('could not be read'));assert.equal(s.calls.filter(x=>x[0]==='end').length,1)}],
  ['Cancelled/stale run does not save',()=>{const s=scenario({instance:measurements(),stale:true});assert.equal(s.saved.length,0);assert.equal(s.calls.length,0)}],
  ['CSV has CRLF separators and numeric metrics',()=>{const value=csv([{date:'2026-11-03T08:00:00Z',mode:'full',down:72,up:14,latency:19,jitter:4}]);assert.ok(value.includes('\r\n'));assert.ok(value.includes('full,72,14,19,4'))}],
  ['CSV rejects nonnumeric and formula-like fields',()=>{const value=csv([{date:'=1+1',mode:'=SUM()',down:'=1+1',up:-4,latency:0,jitter:null}]);assert.ok(!value.includes('=1+1'));assert.ok(!value.includes('SUM'));assert.ok(value.includes('quick,,,0,'))}]
 ];
 let failures=0;
 for(const [name,run] of tests){try{await run();console.log('PASS '+name)}catch(error){failures++;console.error('FAIL '+name+': '+error.message)}}
 console.log((tests.length-failures)+'/'+tests.length+' tests passed');
 if(failures)process.exitCode=1;
}
main().catch(error=>{console.error(error);process.exitCode=1});
