const CACHE="cx-tv-v43";
const CORE=["./","./index.html","./styles.css?v=34","./app.js?v=34","./manifest.json"];
self.addEventListener("install",event=>{self.skipWaiting();event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)))});
self.addEventListener("activate",event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener("fetch",event=>{
 if(event.request.method!=="GET")return;
 const url=new URL(event.request.url);
 if(url.origin!==location.origin)return;
 if(event.request.mode==="navigate"){
  event.respondWith(fetch(event.request).then(r=>{const copy=r.clone();caches.open(CACHE).then(c=>c.put("./index.html",copy));return r}).catch(()=>caches.match("./index.html")));
  return;
 }
 event.respondWith(caches.match(event.request).then(cached=>{
  const network=fetch(event.request).then(r=>{if(r.ok){const copy=r.clone();caches.open(CACHE).then(c=>c.put(event.request,copy))}return r}).catch(()=>cached);
  return cached||network;
 }));
});
self.addEventListener("message",event=>{if(event.data==="SKIP_WAITING")self.skipWaiting()});
