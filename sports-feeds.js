"use strict";
// Sports feed scheduling: timeout fallback and bounded SportsDB concurrency.
(function(root){
const {dateKey}=root.CXUtils;
function scheduleWithDeadline(promise,fallback,label,ms=14000){
 let timeoutId;
 const deadline=new Promise(resolve=>{timeoutId=setTimeout(()=>{console.warn("Schedule source timed out:",label);resolve(fallback)},ms)});
 return Promise.race([Promise.resolve(promise).catch(error=>{console.warn("Schedule source failed:",label,error);return fallback}),deadline]).finally(()=>clearTimeout(timeoutId));
}
async function fetchSportsDbDays(offsets){
 const queue=offsets.map(dateKey),results=new Array(queue.length);
 let cursor=0;
 async function worker(){
  while(cursor<queue.length){
   const index=cursor++,day=queue[index];
   try{
    const response=await fetch("https://www.thesportsdb.com/api/v1/json/123/eventsday.php?d="+day,{signal:AbortSignal.timeout(9000)});
    if(!response.ok)throw Error("SportsDB HTTP "+response.status);
    const data=await response.json();
    results[index]=data&&Array.isArray(data.events)?data:null;
   }catch(error){console.warn("SportsDB feed "+day,error);results[index]=null}
  }
 }
 await Promise.all(Array.from({length:Math.min(4,queue.length)},()=>worker()));
 return results;
}
Object.defineProperty(root,"CXSportsFeeds",{value:Object.freeze({scheduleWithDeadline,fetchSportsDbDays}),writable:false,configurable:false});
})(window);
