import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const html=read('index.html'),mobile=read('assets/mobile-app.js'),mobileCss=read('assets/mobile-app.css'),
 lms=read('assets/lms.js'),hub=read('assets/hub.js'),lmsCss=read('assets/lms.css'),
 manifest=JSON.parse(read('manifest.webmanifest')),sw=read('sw.js');
test('iPhone install metadata uses PNG Apple touch icons and standalone web app mode',()=>{
 assert.match(html,/name="apple-mobile-web-app-capable" content="yes"/);
 assert.match(html,/name="apple-mobile-web-app-status-bar-style" content="black-translucent"/);
 assert.match(html,/name="apple-mobile-web-app-title" content="VWEB Connect"/);
 assert.match(html,/rel="apple-touch-icon" href="\/assets\/connect-180\.png"/);
 assert.match(html,/rel="apple-touch-icon" sizes="180x180" href="https:\/\/vweb\.dev\/Favicon\/apple-touch-icon\.png"/);
 assert.equal(manifest.display,'standalone');
 assert.equal(manifest.scope,'/');
});
test('bundled local fallback icons are correctly encoded PNGs with matching dimensions',()=>{
 for(const size of [180,192]){
  const bytes=readFileSync(new URL('../assets/connect-'+size+'.png',import.meta.url));
  assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
  assert.equal(bytes.readUInt32BE(16),size);
  assert.equal(bytes.readUInt32BE(20),size);
 }
 assert.ok(manifest.icons.some(x=>x.sizes==='192x192'&&x.src==='/assets/connect-192.png'));
 assert.ok(manifest.icons.some(x=>x.sizes==='512x512'&&x.src.includes('/Favicon/')));
 for(const asset of ['connect-180.png','connect-192.png'])assert.ok(sw.includes('/assets/'+asset));
});
test('iOS install help is shown from the existing stacked mobile menu',()=>{
 assert.match(html,/data-stack-screen="install"/);
 assert.match(html,/Open Connect in Safari/);
 assert.match(html,/Add to Home Screen/);
 assert.match(html,/Open as Web App/);
 assert.match(mobile,/appleDevice=\(\)=>/);
 assert.match(mobile,/navigator\.standalone===true/);
 assert.match(mobile,/sheetTrail\.push\('install'\)/);
 assert.match(mobile,/syncInstall\(\)/);
 assert.match(mobileCss,/\.mobile-ios-steps/);
});
test('selected course view contains only the active curriculum and an exit to catalog',()=>{
 assert.match(html,/id="lms-course-switcher-legacy" hidden aria-hidden="true"/);
 assert.match(html,/id="lms-back-to-courses"/);
 assert.match(html,/id="lms-syllabus-course"/);
 assert.match(lms,/lms-syllabus-course/);
 assert.match(lms,/lms-back-to-courses/);
 assert.match(lmsCss,/lms-course-switcher-legacy\[hidden\]/);
 assert.match(hub,/el\('details','hub-module lms-module-accordion'\)/);
 assert.match(hub,/el\('summary','hub-module-heading'\)/);
});
test('classroom player is paused when returning to the course catalog',()=>{
 assert.match(lms,/if\(view==='classroom'&&next!=='classroom'\)/);
 assert.match(lms,/player\.replaceChildren\(paused\)/);
});
test('all iOS and LMS release assets use current cache identifiers',()=>{
 assert.match(sw,/vweb-connect-static-v81/);
 for(const asset of ['mobile-app.js','lms.js','lms.css'])
  assert.ok(html.includes('/assets/'+asset+'?v=connect-ios-focus-20261020a'),asset);
});
