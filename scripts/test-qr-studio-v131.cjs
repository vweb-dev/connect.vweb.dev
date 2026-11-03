#!/usr/bin/env node
'use strict';
/* QR download and stale-export regression checks. No dependencies or network.
 * Run: node scripts/test-qr-studio-v131.cjs
 */
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const source=fs.readFileSync(path.join(__dirname,'../assets/qr-studio.js'),'utf8');
const begin=source.indexOf('async function download(format){');
const end=source.indexOf('async function copyText()',begin);
assert.ok(begin>0&&end>begin,'QR download handler exists');
const downloadSource=source.slice(begin,end);
async function scenario(format,changeDuringExport=false){
 const buttons=[{disabled:false},{disabled:false},{disabled:false}];
 const saved=[],statuses=[];
 const factory=new Function('$','$$','saveBlob','setStatus','buttons','change',`
  let payload='sample',pending=false,exporting=false,renderVersion=12;
  const val=()=>1024;
  const setReady=ready=>buttons.forEach(button=>{button.disabled=!ready});
  async function svgBlob(){if(change)renderVersion++;return {type:'image/svg+xml'}}
  async function rasterBlob(svg,mime){return {type:mime}}
  ${downloadSource}
  return async()=>{await download(${JSON.stringify(format)});return {exporting,buttons:buttons.map(b=>b.disabled)}};
 `);
 const run=factory(()=>buttons[0],()=>buttons,(...value)=>saved.push(value),(...value)=>statuses.push(value),buttons,changeDuringExport);
 const state=await run();return {saved,statuses,state};
}
async function main(){
 const cases=[
  ['SVG produces a download',async()=>{const r=await scenario('svg');assert.equal(r.saved[0]?.[1],'vweb-connect-qr.svg');assert.equal(r.state.exporting,false)}],
  ['PNG produces a download',async()=>{const r=await scenario('png');assert.equal(r.saved[0]?.[1],'vweb-connect-qr.png')}],
  ['JPEG produces a download',async()=>{const r=await scenario('jpeg');assert.equal(r.saved[0]?.[1],'vweb-connect-qr.jpg')}],
  ['Changed QR content cancels an outdated export',async()=>{const r=await scenario('png',true);assert.equal(r.saved.length,0);assert.equal(r.statuses.at(-1)?.[1],true)}],
  ['Export controls unlock after completion or cancellation',async()=>{for(const stale of [false,true]){const r=await scenario('svg',stale);assert.deepEqual(r.state.buttons,[false,false,false])}}],
  ['Logo read requests have a cancellation token',async()=>{assert.match(source,/const request=\+\+logoVersion/);assert.match(source,/if\(request!==logoVersion\)return/)}],
  ['Clipboard copy rejects stale QR content',async()=>{assert.match(source,/QR changed during image preparation/)}]
 ];
 let failed=0;
 for(const [name,run] of cases){try{await run();console.log('PASS '+name)}catch(error){failed++;console.error('FAIL '+name+': '+error.message)}}
 console.log((cases.length-failed)+'/'+cases.length+' tests passed');if(failed)process.exitCode=1;
}
main().catch(e=>{console.error(e);process.exitCode=1});
