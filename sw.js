const CACHE='vweb-connect-static-v3';
const APP=['/','/index.html','/assets/style.css','/assets/app.js','/assets/connect-icon.svg','/manifest.webmanifest'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(APP)));self.skipWaiting();});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim();});
self.addEventListener('fetch',event=>{const request=event.request;if(request.method!=='GET'||new URL(request.url).origin!==self.location.origin)return;
if(request.mode==='navigate'){event.respondWith(fetch(request).catch(()=>caches.match('/index.html')));return;}
event.respondWith(caches.match(request).then(hit=>hit||fetch(request).then(response=>{if(response.ok&&APP.includes(new URL(request.url).pathname)){const clone=response.clone();caches.open(CACHE).then(cache=>cache.put(request,clone));}return response;})));
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
