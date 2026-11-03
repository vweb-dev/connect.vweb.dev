#!/usr/bin/env node
'use strict';
/* Run: node scripts/test-convert-studio-v130.cjs
 * No production browser, network or paid testing service required.
 */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../assets/converter.js'),'utf8');
const start=source.indexOf('function pdfSelection('),end=source.indexOf('function pdfPick(',start);
assert.ok(start>=0&&end>start,'PDF selection helper exists');
const select=new Function(source.slice(start,end)+'return pdfSelection;')();
const file=(name,type,size=100,lastModified=1)=>({name,type,size,lastModified});
const checks=[
 ['Photos accepts multiple images',()=>assert.equal(select([],[file('a.png','image/png'),file('b.jpg','image/jpeg')],'photos').files.length,2)],
 ['Reject PDF in photo mode',()=>assert.ok(select([],[file('a.pdf','application/pdf')],'photos').error)],
 ['Merge accepts multiple PDFs',()=>assert.equal(select([],[file('a.pdf','application/pdf'),file('b.pdf','application/pdf')],'merge').files.length,2)],
 ['Extract selects one PDF',()=>assert.equal(select([],[file('a.pdf','application/pdf'),file('b.pdf','application/pdf')],'extract').files[0].name,'b.pdf')],
 ['No duplicate files',()=>assert.equal(select([file('a.png','image/png')],[file('a.png','image/png')],'photos').files.length,1)],
 ['Reject input over 100 MB',()=>assert.ok(select([],[file('large.png','image/png',101*1024*1024)],'photos').error)],
 ['Reject combined input over 150 MB',()=>assert.ok(select([],[file('a.png','image/png',80*1024*1024),file('b.png','image/png',80*1024*1024)],'photos').error)],
 ['Invalid new file keeps existing selection',()=>{const value=select([file('a.pdf','application/pdf')],[file('c.txt','text/plain')],'merge');assert.ok(value.error);assert.equal(value.files.length,1)}],
 ['Batch operation allows 2+ photos',()=>assert.match(source,/\(pdfMode==='extract'\|\|pdfMode==='split'\)\&\&source\.length!==1/)],
 ['Image/PDF reorder buttons exist',()=>assert.ok(source.includes('convert-file-actions')&&source.includes('Move '+"'"))]
];
let failures=0;
for(const [name,fn] of checks){try{fn();console.log('PASS '+name)}catch(error){failures++;console.error('FAIL '+name+': '+error.message)}}
console.log((checks.length-failures)+'/'+checks.length+' checks passed');
if(failures)process.exitCode=1;
