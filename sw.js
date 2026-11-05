"use strict";
const CACHE="cx-tv-v111-neon1";
const CORE=["./index.html","./styles.css?v=111","./responsive.css?v=111","./mobile-hotfix.css?v=1","./v109-modern.css?v=1","./mobile-polish.css?v=1","./neon-sports.css?v=1","./app.js?v=111","./core-utils.js?v=111","./sports-feeds.js?v=111","./view-helpers.js?v=111","./manifest.json?v=102","./champions.js?v=102","./icons/icon-192.png","./icons/icon-512.png"];
const SCOPE=new URL(self.registration.scope);
const INDEX=new URL("./index.html",SCOPE).href;
const APP_ASSETS=new Set(CORE.map(path=>new URL(path,SCOPE).href));
const CACHEABLE_PATHS=new Set(CORE.map(path=>new URL(path,SCOPE).pathname));
function insideScope(url){return url.origin===SCOPE.origin&&url.pathname.startsWith(SCOPE.pathname)}
function isAppAsset(url){return APP_ASSETS.has(url.href)}
function isOldAppCache(key){return key.startsWith("cx-tv-v")&&key!==CACHE}
self.addEventListener("install",event=>{
 event.waitUntil(caches.open(CACHE).then(async cache=>{
  // Required shell must be available before this worker takes control.
  await cache.addAll(CORE);
  await self.skipWaiting();
 }));
});
self.addEventListener("activate",event=>{
 event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(isOldAppCache).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});
self.addEventListener("fetch",event=>{
 const request=event.request;
 if(request.method!=="GET")return;
 const url=new URL(request.url);
 if(!insideScope(url))return;
 if(request.mode==="navigate"){
  event.respondWith(fetch(request).then(response=>{
   if(response.ok){const copy=response.clone();event.waitUntil(caches.open(CACHE).then(cache=>cache.put(INDEX,copy)))}
   return response;
  }).catch(async()=>await caches.match(INDEX)||Response.error()));
  return;
 }
 // Only cache exact versioned app files. Never cache auth/API requests or user data.
 if(!isAppAsset(url))return;
 event.respondWith(fetch(request).then(response=>{
  if(response.ok){const copy=response.clone();event.waitUntil(caches.open(CACHE).then(cache=>cache.put(request,copy)))}
  return response;
 }).catch(async()=>await caches.match(request)||Response.error()));
});
self.addEventListener("message",event=>{if(event.data==="SKIP_WAITING")self.skipWaiting()});
