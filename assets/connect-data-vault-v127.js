'use strict';
/* Connect Data Vault — carefully scoped local backup for learner and workspace state. */
(()=>{
const KEY='vweb.connect20.v1';
const WORKSPACE='connect30-favorites';
const SAVED='connect-command-saved-v1';
const MAX_FILE=1024*1024;
const scopedFields=['favorites','pinnedTools','enrolled','bookmarks','assessments','completed','position','notes','recent'];
const $=id=>document.getElementById(id);
const readJSON=key=>{try{return JSON.parse(localStorage.getItem(key)||'null')}catch{return null}};
const isRecord=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const own=(v,k)=>Object.prototype.hasOwnProperty.call(v,k);
const validStrings=(v,max=180)=>Array.isArray(v)&&v.length<=max&&v.every(x=>typeof x==='string'&&x.length<=500);
const validMap=(v,key)=>{
 if(!isRecord(v)||Object.keys(v).length>150)return false;
 return Object.entries(v).every(([id,value])=>{
  if(id.length>100||id==='__proto__'||id==='constructor'||id==='prototype')return false;
  if(key==='notes')return typeof value==='string'&&value.length<=12000;
  if(key==='position')return Number.isInteger(value)&&value>=0&&value<10000;
  if(key==='completed'||key==='bookmarks')return Array.isArray(value)&&value.length<=400&&value.every(n=>Number.isInteger(n)&&n>=0&&n<10000);
  if(key==='assessments')return isRecord(value)&&Object.keys(value).length<=100&&Object.entries(value).every(([module,item])=>
   /^\d{1,3}$/.test(module)&&isRecord(item)&&Number.isInteger(item.score)&&Number.isInteger(item.total)&&item.score>=0&&item.score<=item.total&&item.total>=1&&item.total<=100&&(!own(item,'updated')||(Number.isFinite(item.updated)&&item.updated>=0))
  );
  return false;
 });
};
function validateState(value){
 if(!isRecord(value))throw Error('Invalid learning progress format.');
 const clean={};
 for(const key of scopedFields){
  const v=value[key];
  if(v===undefined)continue;
  const ok=['favorites','pinnedTools','enrolled','recent'].includes(key)?validStrings(v):
   validMap(v,key);
  if(!ok)throw Error('Invalid or oversized learning field: '+key);
  clean[key]=v;
 }
 // Empty learning data is valid for users who only backed up saved tools.
 return clean;
}
function validatePaths(value){
 if(!validStrings(value,100))throw Error('Invalid saved destinations.');
 const valid=value.every(p=>{
  if(p.startsWith('/')&&!p.startsWith('//'))return /^\/[a-z0-9][a-z0-9/_-]{0,180}$/.test(p);
  try{const u=new URL(p);return u.protocol==='https:'&&u.username===''&&u.password===''&&u.hostname.length>0&&p.length<=500}catch{return false}
 });
 if(!valid)throw Error('Backup contains an invalid saved destination.');
 return [...new Set(value)];
}
function currentSnapshot(){
 const progress=readJSON(KEY);
 return {
  format:'vweb-connect-backup',version:1,created:new Date().toISOString(),
  learning:isRecord(progress)?Object.fromEntries(scopedFields.filter(k=>own(progress,k)).map(k=>[k,progress[k]])):{},
  workspace:Array.isArray(readJSON(WORKSPACE))?readJSON(WORKSPACE):[],
  saved:Array.isArray(readJSON(SAVED))?readJSON(SAVED):[]
 };
}
function download(){
 const result=currentSnapshot();
 const url=URL.createObjectURL(new Blob([JSON.stringify(result,null,2)],{type:'application/json;charset=utf-8'}));
 const a=document.createElement('a');a.href=url;a.download='connect-backup-'+new Date().toISOString().slice(0,10)+'.json';
 document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),5000);
 status('Backup exported locally. Keep the file private: it contains your learning notes.');
}
function status(message,error=false){for(const el of [document.getElementById('cv127-status'),...document.querySelectorAll('.cv128-vault-note')]){if(el){el.textContent=message;el.dataset.error=String(error)}}}
async function importBackup(file){
 if(!file)return;
 if(file.size>MAX_FILE){status('Backup exceeds the 1 MB safety limit.',true);return}
 let backup;
 try{
  backup=JSON.parse(await file.text());
  if(!isRecord(backup)||backup.format!=='vweb-connect-backup'||backup.version!==1)throw Error('Unsupported backup version.');
  backup.learning=validateState(backup.learning);
  if(!Array.isArray(backup.workspace)||!Array.isArray(backup.saved))throw Error('Missing saved destinations.');
  backup.workspace=validatePaths(backup.workspace);
  backup.saved=validatePaths(backup.saved);
 }catch(error){status('Import blocked: '+(error.message||'invalid file'),true);return}
 const courseCount=backup.learning.enrolled?.length||0;
 if(!window.confirm('Restore this backup? It will replace local Connect learning progress, notes and saved tools on THIS device. Courses enrolled in backup: '+courseCount+'. Export your current data first.')){status('Restore cancelled; existing data unchanged.');return}
 const existing=readJSON(KEY);
 const learning={...(isRecord(existing)?existing:{})};
 // Restore only fields explicitly included in the backup: partial files must not erase
 // unrelated progress, notes, app favourites or existing assessment records.
 Object.assign(learning,backup.learning);
 try{
  const changes=[[KEY,JSON.stringify(learning)],[WORKSPACE,JSON.stringify(backup.workspace)],[SAVED,JSON.stringify(backup.saved)]];
  const before=changes.map(([key])=>[key,localStorage.getItem(key)]);
  try{for(const [key,value] of changes)localStorage.setItem(key,value)}
  catch(error){for(const [key,value] of before){try{if(value===null)localStorage.removeItem(key);else localStorage.setItem(key,value)}catch{}}throw error}
  status('Backup restored. Reloading to synchronize learning progress…');
  window.location.reload();
 }catch{status('Could not store backup. Check browser storage permissions and capacity.',true)}
}
function mount(){
 if($('connect-data-vault'))return;
 const home=$('page-home');
 const academy=$('page-academy');
 const host=home||academy;if(!host)return;
 const block=document.createElement('section');
 block.id='connect-data-vault';block.className='cv127-vault';
 block.innerHTML='<div class="cv127-copy"><small>MY CONNECT · DATA VAULT</small><h2>Backup your learning &amp; workspace</h2><p>Export progress, completed lessons, notes, bookmarks and saved tools to a private JSON file. No cloud upload or account required.</p></div><div class="cv127-actions"><button type="button" id="cv127-export">Download full backup</button><button type="button" id="cv127-import">Restore backup</button><input id="cv127-file" type="file" accept=".json,application/json" hidden></div><p id="cv127-status" role="status" aria-live="polite">Stored only in this browser unless you export a backup.</p>';
 const anchor=$('connect30-workspace');
 if(anchor&&anchor.parentElement===host)anchor.after(block);else host.append(block);
 $('cv127-export').addEventListener('click',download);
 $('cv127-import').addEventListener('click',()=>$('cv127-file').click());
 $('cv127-file').addEventListener('change',e=>{importBackup(e.target.files?.[0]);e.target.value=''});
 // Classroom and overview screens hide the home panel. Offer the same local vault
 // without duplicating storage logic or adding a network endpoint.
 const classroom=$('lms-view-classroom'),overview=$('lms-view-overview');
 const addAcademyLink=(target)=>{
  if(!target||target.querySelector('.cv128-academy-vault'))return;
  const panel=document.createElement('aside');panel.className='cv128-academy-vault';
  panel.innerHTML='<strong>Learning progress backup</strong><p>Keep a private copy of your lessons, notes and saved tools on your device.</p><div><button type="button" data-vault-export>Download backup</button><button type="button" data-vault-import>Restore backup</button></div><p class="cv128-vault-note" role="status" aria-live="polite"></p>';
  panel.querySelector('[data-vault-export]').addEventListener('click',()=>{download();panel.querySelector('.cv128-vault-note').textContent='Download started. Store this file privately.'});
  panel.querySelector('[data-vault-import]').addEventListener('click',()=>$('cv127-file').click());
  target.append(panel);
 };
 addAcademyLink(overview);
 addAcademyLink(classroom);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();