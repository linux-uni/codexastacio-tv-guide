"use strict";
const assert=require("node:assert/strict");
const today=new Intl.DateTimeFormat("en-CA",{timeZone:"America/Santo_Domingo",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
const compact=today.replaceAll("-","");
const probes=[
 {name:"MLB",url:"https://statsapi.mlb.com/api/v1/schedule?sportId=1&startDate="+today+"&endDate="+today,valid:d=>Array.isArray(d.dates),count:d=>d.dates.reduce((n,x)=>n+(x.games||[]).length,0)},
 {name:"NHL",url:"https://api-web.nhle.com/v1/score/"+today,valid:d=>Array.isArray(d.games),count:d=>d.games.length},
 {name:"ESPN NBA",url:"https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates="+compact+"&limit=1000",valid:d=>Array.isArray(d.events),count:d=>d.events.length},
 {name:"SportsDB",url:"https://www.thesportsdb.com/api/v1/json/123/eventsday.php?d="+today,valid:d=>d&&Object.hasOwn(d,"events")&&(d.events===null||Array.isArray(d.events)),count:d=>d.events?.length||0}
];
(async()=>{
 const results=await Promise.all(probes.map(async p=>{
  const start=Date.now();
  try{
   const response=await fetch(p.url,{signal:AbortSignal.timeout(12000),headers:{"Accept":"application/json"}});
   if(!response.ok)throw Error("HTTP "+response.status);
   const data=await response.json();
   assert.ok(p.valid(data),"JSON schema mismatch");
   const count=p.count(data);
   return {source:p.name,status:"PASS",http:response.status,events:count,ms:Date.now()-start};
  }catch(e){return {source:p.name,status:"FAIL",error:String(e.message||e),ms:Date.now()-start}}
 }));
 console.table(results);
 console.log("Note: zero events can be valid for a day without fixtures.");
 if(results.some(r=>r.status==="FAIL"))process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1});
