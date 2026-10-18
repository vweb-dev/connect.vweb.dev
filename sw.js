const CACHE='vweb-connect-static-v2';
const APP=['/','/index.html','/assets/style.css','/assets/app.js','/assets/connect-icon.svg','/manifest.webmanifest'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(APP)));self.skipWaiting();});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim();});
self.addEventListener('fetch',event=>{const request=event.request;if(request.method!=='GET'||new URL(request.url).origin!==self.location.origin)return;
if(request.mode==='navigate'){event.respondWith(fetch(request).catch(()=>caches.match('/index.html')));return;}
event.respondWith(caches.match(request).then(hit=>hit||fetch(request).then(response=>{if(response.ok&&APP.includes(new URL(request.url).pathname)){const clone=response.clone();caches.open(CACHE).then(cache=>cache.put(request,clone));}return response;})));
});