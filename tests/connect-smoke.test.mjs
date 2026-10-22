import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=file=>readFileSync(new URL('../'+file,import.meta.url),'utf8');
const html=read('index.html'),routes=JSON.parse(read('data/tool-routes.json')).tools;
function parseLayout(source){
 const doc=source.replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi,'').replace(/<style\b[^>]*>[\s\S]*?<\/style\s*>/gi,'').replace(/<!--[\s\S]*?-->/g,'').replace(/<textarea\b[^>]*>[\s\S]*?<\/textarea\s*>/gi,'<textarea></textarea>');
 const re=/<(\/)?([A-Za-z][\w:-]*)\b([^<>]*?)>/g;
 const voids=new Set(['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr']);
 const stack=[],pages=[];let m;while((m=re.exec(doc))){
  const tag=m[2].toLowerCase();
  if(!m[1]){if(voids.has(tag)||m[3].trim().endsWith('/'))continue;
   const id=m[3].match(/\bid="([^"]+)"/)?.[1]||'';
   const node={tag,id,parent:stack.at(-1)?.id||stack.at(-1)?.tag||''};
   if(id.startsWith('page-'))pages.push(node);stack.push(node);
  }else{assert.equal(stack.at(-1)?.tag,tag,'Unbalanced closing tag '+tag+' near position '+m.index);
   stack.pop();
  }
 }
 assert.equal(stack.length,0,'Unclosed HTML elements');
 return pages;
}
test('all 16 application pages are direct siblings under main',()=>{
 const pages=parseLayout(html);
 assert.equal(pages.length,16);
 assert.ok(pages.every(page=>page.parent==='main'),JSON.stringify(pages.filter(page=>page.parent!=='main')));
});
test('49 tools have unique canonical routes and valid existing controls',()=>{
 assert.equal(routes.length,49);
 assert.equal(new Set(routes.map(t=>t.path)).size,routes.length);
 assert.equal(new Set(routes.map(t=>t.id)).size,routes.length);
 const ids=new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]));
 const qrTypes=new Set([...html.matchAll(/data-qr-type="([^"]+)"/g)].map(m=>m[1]));
 const quickToolIds=new Set([...read('assets/tools-explorer-v53.js').matchAll(/\bT\('([^']+)'/g)].map(m=>m[1]));
 for(const tool of routes){
  assert.match(tool.path,/^\/(tools|convert|ai|qr|daily|windows|network)\/[a-z0-9-]+$/,'Invalid URL for '+tool.id);
  if(tool.mode==='quick')assert.ok(quickToolIds.has(tool.id),'Unregistered Quick Action '+tool.id);
  else if(tool.mode==='qr')assert.ok(qrTypes.has(tool.target),'Missing QR type '+tool.id);
  else assert.ok(ids.has(tool.target),'Missing workspace control for '+tool.id+': '+tool.target);
 }
});
test('all tool and course pages occur in sitemap',()=>{
 const xml=read('sitemap.xml');
 const courses=JSON.parse(read('data/connect-hub.json')).courses;
 assert.equal(courses.length,5);
 const expected=[...routes.map(t=>t.path),...courses.map(c=>'/academy/course/'+c.id)];
 for(const path of expected)assert.ok(xml.includes('<loc>https://connect.vweb.dev'+path+'</loc>'),'Missing URL '+path);
 assert.equal((xml.match(/<url>/g)||[]).length,68);
});
test('search and individual routes use the same registry',()=>{
 const hub=read('assets/hub.js'),tool=read('assets/tool-pages-v59.js'),php=read('seo.php'),index=read('index.html');
 assert.ok(hub.includes("connect-tool-route-catalog"));
 assert.ok(tool.includes("connect-tool-route-catalog"));
 assert.ok(php.includes("data/tool-routes.json"));
 assert.ok(index.includes('id="connect-tool-route-catalog"'));
 assert.ok(hub.includes('function searchIndex(query)'));
 assert.ok(tool.includes('function directory(area)'));
});
test('new shell and scripts use v60 assets',()=>{
 const sw=read('sw.js');
 assert.ok(sw.includes("vweb-connect-static-v81"));
 for(const asset of ['app.js','hub.js','tools-explorer-v53.js','tool-pages-v59.js','unified-navigation-v56.js']){
  assert.ok(html.includes('/assets/'+asset+'?v=60'),'Unbusted script '+asset);
 }
});


test('search ranks real matching workspaces and returns canonical tool URLs',()=>{
 const hub=read('assets/hub.js'),start=hub.indexOf('const searchToolRegistry='),end=hub.indexOf('function renderGlobalSearch(){',start);
 assert.ok(start>=0&&end>start,'Search helper source missing');
 const data=JSON.parse(read('data/connect-hub.json'));
 const search=new Function('$','data',hub.slice(start,end)+';return searchIndex;')(
  ()=>({textContent:read('data/tool-routes.json')}),data
 );
 const checks=[['qr wifi','/qr/wifi'],['json formatter','/tools/json-formatter'],['windows activation','/windows/activation'],['pdf','/convert/pdf'],['Power Tools','/apps']];
 for(const [query,destination] of checks){
  const found=search(query);assert.ok(found.length,'No matches for '+query);
  assert.equal(found[0].destination,destination,'Wrong first result for '+query);
 }
});
