const CACHE='vweb-connect-static-v81';
const APP=['/assets/academy-productivity-v4.css','/assets/academy-productivity-v4.js','/assets/academy-studio-v3.css','/assets/academy-studio-v3.js','/assets/learning-workbench-v2.js','/assets/learning-workbench-v2.css','/assets/learning-upgrades.js','/assets/learning-upgrades.css','/assets/practice-missions.css','/assets/practice-missions.js','/assets/academy-practice-arena.css','/assets/academy-practice-arena.js','/assets/learning-reading.css','/assets/learning-reading.js','/typing-practice.html','/mouse-practice.html','/assets/practice-lab.css','/assets/practice-lab.js','/assets/connect31-features.css','/assets/connect31-features.js','/assets/connect30-experience.css','/assets/connect30-export.js','/assets/connect30-workspace.css','/assets/connect30-workspace.js','/assets/connect21-journey.css','/assets/connect21-journey.js','/assets/connect-release-v80.css','/assets/connect-release-v80.js','/assets/connect-brand-promos-v77.css','/assets/connect-ui-polish-v74.css','/assets/connect-ui-polish-v74.js','/assets/conversion-suite-v72.css','/assets/conversion-suite-v72.js','/assets/connect-tools-professional-v61.css','/assets/search-repair-v61.js','/assets/tool-enhancements-v61.js','/assets/tool-pages-v59.css','/assets/tool-pages-v59.js','/data/tool-routes.json','/assets/lms-menu-thumbnails-v58.css','/assets/desktop-explorer-v57.css','/assets/apps-studio-v56.js','/assets/unified-navigation-v56.js','/assets/unified-navigation-v56.css','/assets/mobile-tools-activation-apps-v54.css','/assets/apps-recovery-v54.js','/assets/tools-explorer-v53.css','/assets/tools-explorer-v53.js','/assets/daily-essentials-v51.css','/assets/daily-essentials-v51.js','/assets/daily-desk-v50.css','/assets/daily-desk-v50.js','/assets/connect-apple-system-v49.css','/','/index.html','/assets/style.css','/assets/mobile-app.css','/assets/app.js','/assets/mobile-app.js','/assets/puter-ai.js','/assets/entertainment.js','/assets/converter.js','/assets/hub.js','/assets/connect-180.png','/assets/connect-192.png','/assets/lms.js','/assets/lms.css','/assets/connect-enhancements.css','/assets/windows-page-polish.css','/assets/windows-command-center.css','/assets/network-center.css','/assets/network-status.js','/assets/connect-speedtest.js','/assets/social-inline.js','/assets/network-intelligence.js','/assets/network-revamp.js','/assets/connect-enhancements.js','/assets/qr-studio.css','/assets/qr-studio.js','/data/connect-hub.json','/assets/connect-icon.svg','/manifest.webmanifest'];
self.addEventListener('install',event=>{event.waitUntil((async()=>{const cache=await caches.open(CACHE);await Promise.all(APP.map(async path=>{try{const response=await fetch(path,{cache:'reload'});if(response.ok)await cache.put(path,response);}catch(error){console.warn('Offline cache skipped',path,error);}}));})());self.skipWaiting();});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim();});
self.addEventListener('fetch',event=>{const request=event.request;if(request.method!=='GET'||new URL(request.url).origin!==self.location.origin)return;
if(request.mode==='navigate'){event.respondWith(fetch(request).catch(()=>caches.match('/index.html')));return;}
const path=new URL(request.url).pathname;
if(path==='/assets/connect-release-v80.js'||path==='/assets/connect-release-v80.css'||path==='/assets/conversion-suite-v72.js'||path==='/assets/conversion-suite-v72.css'||path==='/assets/tool-pages-v59.js'||path==='/assets/unified-navigation-v56.js'||path==='/assets/connect-ui-polish-v74.js'||path==='/assets/connect-brand-promos-v77.css'||path==='/assets/app.js'||path==='/assets/puter-ai.js'||path==='/assets/entertainment.js'||path==='/assets/converter.js'||path==='/assets/hub.js'||path==='/assets/lms.js'||path==='/assets/lms.css'||path==='/assets/connect-enhancements.css'||path==='/assets/windows-page-polish.css'||path==='/assets/windows-command-center.css'||path==='/assets/network-center.css'||path==='/assets/network-status.js'||path==='/assets/connect-speedtest.js'||path==='/assets/social-inline.js'||path==='/assets/network-intelligence.js'||path==='/assets/network-revamp.js'||path==='/assets/connect-enhancements.js'||path==='/assets/qr-studio.js'||path==='/assets/qr-studio.css'||path==='/assets/mobile-app.js'||path==='/assets/style.css'||path==='/assets/mobile-app.css'||
   path==='/data/connect-hub.json'){
 event.respondWith(fetch(request).then(response=>{
   if(response.ok){const clone=response.clone();event.waitUntil(caches.open(CACHE).then(cache=>cache.put(request,clone)));}
   return response;
 }).catch(async()=>await caches.match(request)||await caches.match(path)||Response.error()));return;
}
event.respondWith(caches.match(request).then(hit=>hit||fetch(request).then(response=>{if(response.ok&&APP.includes(path)){const clone=response.clone();event.waitUntil(caches.open(CACHE).then(cache=>cache.put(request,clone)));}return response;})));
});
self.addEventListener('push',event=>{
  if(!event.data)return;
  let payload={};
  try{payload=event.data.json();}catch(e){return;}
  const title=String(payload.title||'VWEB.DEV Connect').slice(0,140);
  const body=String(payload.body||'').slice(0,250);
  let url=String(payload.url||'/');
  if(!url.startsWith('/')||url.startsWith('//'))url='/';
  event.waitUntil(self.registration.showNotification(title,{
    body,icon:'/assets/connect-icon.svg',
    badge:'/assets/connect-icon.svg',tag:'vweb-connect-update',
    data:{url}
  }));
});
self.addEventListener('notificationclick',event=>{
  event.notification.close();
  const url=event.notification.data&&event.notification.data.url||'/';
  const safe=url.startsWith('/')&&!url.startsWith('//')?url:'/';
  event.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(open=>{
    for(const client of open){if(client.url.startsWith(self.location.origin)){
      client.navigate(safe);return client.focus();
    }}
    return clients.openWindow(safe);
  }));
});
