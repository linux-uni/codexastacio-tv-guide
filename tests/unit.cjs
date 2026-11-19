"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
function boot(files,overrides={}){
 const ctx=vm.createContext({window:{},console:{warn(){}},setTimeout,clearTimeout,Date,Intl,Promise,AbortSignal,...overrides});
 for(const file of files)vm.runInContext(fs.readFileSync(file,"utf8"),ctx,{filename:file});
 return ctx.window;
}
test("HTML escaping prevents injection and preserves safe text",()=>{
 const {esc}=boot(["core-utils.js"]).CXUtils;
 assert.equal(esc('<img src="x" onerror="alert(1)">'),'&lt;img src=&quot;x&quot; onerror=&quot;alert(1)&quot;&gt;');
 assert.equal(esc(null),"");
 assert.equal(esc("A&B'"),"A&amp;B&#39;");
});
test("invalid and missing timestamps have a safe fallback",()=>{
 const {safeDateTime}=boot(["core-utils.js"]).CXUtils;
 assert.equal(safeDateTime(null),"Sin fecha");
 assert.equal(safeDateTime("not-a-date"),"Sin fecha");
});
test("permissions deny restricted views and allow administrators",()=>{
 const {canViewProfile}=boot(["view-helpers.js"]).CXViewHelpers;
 assert.equal(canViewProfile({role:"user",can_view_schedule:false},"schedule"),false);
 assert.equal(canViewProfile({role:"user",can_view_channels:false},"channels"),false);
 assert.equal(canViewProfile({role:"admin",can_view_schedule:false},"schedule"),true);
 assert.equal(canViewProfile({role:"user"},"schedule"),true);
});
test("sports slider uses Dominican local date",()=>{
 const {sliderLocalDate}=boot(["view-helpers.js"]).CXViewHelpers;
 assert.equal(sliderLocalDate({strTimestamp:"2026-11-06T02:30:00Z"}),"2026-11-05");
 assert.equal(sliderLocalDate({dateEvent:"2026-11-05"}),"2026-11-05");
});
test("deadline returns resolved value, fallback on failure and timeout",async()=>{
 const {scheduleWithDeadline}=boot(["core-utils.js","sports-feeds.js"]).CXSportsFeeds;
 assert.equal(await scheduleWithDeadline(Promise.resolve(7),0,"success",50),7);
 assert.equal(await scheduleWithDeadline(Promise.reject(new Error("offline")),3,"failed",50),3);
 assert.equal(await scheduleWithDeadline(new Promise(()=>{}),4,"timeout",10),4);
});
test("SportsDB loader limits concurrency and isolates failures",async()=>{
 let active=0,peak=0,requests=0;
 const fetch=async url=>{
  const index=requests++;active++;peak=Math.max(peak,active);
  await new Promise(resolve=>setTimeout(resolve,5));
  active--;
  if(index===2)throw Error("offline");
  return {ok:true,json:async()=>({events:[{id:index}]})};
 };
 const {fetchSportsDbDays}=boot(["core-utils.js","sports-feeds.js"],{fetch}).CXSportsFeeds;
 const result=await fetchSportsDbDays([0,1,2,3,4,5]);
 assert.equal(result.length,6);
 assert.equal(result[2],null);
 assert.equal(result.filter(Boolean).length,5);
 assert.ok(peak<=4,"concurrency exceeded four");
 assert.ok(peak>=2,"requests were not concurrent");
});

test("CFL digital platform labels require confirmed broadcast signals",()=>{
 const app=fs.readFileSync("app.js","utf8");
 const start=app.indexOf("function cflBroadcastPlatforms(e){");
 const end=app.indexOf("\nfunction renderProviders()",start);
 assert.ok(start>=0&&end>start,"CFL digital provider helpers missing");
 const official={strLeague:"CFL Grey Cup",strEvent:"Montreal Alouettes vs Edmonton Elks",dateEvent:"2026-11-15",strTVStation:"DAZN, CFL+"};
 const unconfirmed={strLeague:"CFL Regular Season",strEvent:"Other CFL match",dateEvent:"2026-11-15",strTVStation:"TSN"};
 const ctx=vm.createContext({
  BOXING_SCHEDULE:[], sliderEvents:[official,unconfirmed],scheduleEvents:[],providers:[{name:"DAZN"},{name:"Disney+"}],
  dateKey:()=> "2026-11-15",sliderLocalDate:e=>e.dateEvent,
  leagueKey:e=>e.strLeague.startsWith("CFL")?"CFL":"NFL",
  streamPlatform:name=>({dazn:"DAZN","cfl+":"CFL+"})[String(name).toLowerCase()]||"",
  matchupVisual:()=>"",providerEventDate:e=>e.dateEvent,
  demoWhereToWatch:()=>[],netflixUpcomingEvent:()=>null,esc:s=>String(s)
 });
 vm.runInContext(app.slice(start,end),ctx);
 assert.deepEqual(Array.from(ctx.cflBroadcastPlatforms(official)),["DAZN","CFL+"]);
 assert.deepEqual(Array.from(ctx.cflBroadcastPlatforms(unconfirmed)),[]);
 assert.equal(ctx.cflMatchesForPlatform("dazn").length,1);
 assert.equal(ctx.cflMatchesForPlatform("CFL+").length,1);
 assert.equal(ctx.cflMatchesForPlatform("Disney+").length,0);
 const html=ctx.providerEventCards();
 assert.match(html,/provider-logo">DAZN<\/div>/);
 assert.match(html,/provider-logo">CFL\+<\/div>/);
 assert.match(html,/Montreal Alouettes vs Edmonton Elks/);
 assert.doesNotMatch(html,/Other CFL match/);
});

test("Streaming cards rotate independent confirmed events without guessing rights",()=>{
 const app=fs.readFileSync("app.js","utf8");
 const start=app.indexOf("function cflBroadcastPlatforms(e){"),end=app.indexOf("\nfunction sportMark(s)",start);
 assert.ok(start>=0&&end>start,"Provider carousel helpers missing");
 const today={strLeague:"CFL Grey Cup",strEvent:"Montreal vs Edmonton",dateEvent:"2026-11-15",strTVStation:"DAZN, CFL+"};
 const tomorrow={strLeague:"Boxing",strEvent:"World Championship Boxing",dateEvent:"2026-11-16",strTVStation:"DAZN"};
 const disney={strLeague:"Sports",strEvent:"Hockey on Disney",dateEvent:"2026-11-15",strTVStation:"Disney+ Premium"};
 const unverified={strLeague:"Football",strEvent:"Not confirmed",dateEvent:"2026-11-15",_managed:true,_verified:false,_providerName:"DAZN"};
 const noSignal={strLeague:"Football",strEvent:"No rights information",dateEvent:"2026-11-15"};
 const ctx=vm.createContext({
  BOXING_SCHEDULE:[], sliderEvents:[today,noSignal],scheduleEvents:[tomorrow,disney,unverified,today],
  providers:[{name:"DAZN"},{name:"Disney+"}],
  dateKey:offset=>{const d=new Date(Date.UTC(2026,10,15+(offset||0)));return d.toISOString().slice(0,10)},
  sliderLocalDate:e=>e.dateEvent,leagueKey:e=>e.strLeague.startsWith("CFL")?"CFL":"OTHER",
  streamPlatform:name=>({dazn:"DAZN","cfl+":"CFL+","disney+":"Disney+","disney+ premium":"Disney+ Premium"})[String(name).toLowerCase()]||"",
  matchupVisual:()=>"",providerEventDate:e=>e.dateEvent,netflixUpcomingEvent:()=>null,esc:s=>String(s)
 });
 vm.runInContext(app.slice(start,end),ctx);
 assert.equal(ctx.providerEventsForPlatform("DAZN").length,2);
 assert.equal(ctx.providerEventsForPlatform("Disney+").length,1);
 assert.equal(ctx.providerEventsForPlatform("CFL+").length,1);
 assert.deepEqual(Array.from(ctx.eventBroadcastProviders(unverified)),[]);
 assert.deepEqual(Array.from(ctx.eventBroadcastProviders(noSignal)),[]);
 assert.equal(ctx.providerSlideIndex(0,-1,2),1);
 assert.equal(ctx.providerSlideIndex(1,1,2),0);
 const html=ctx.providerEventCards();
 const dazn=html.slice(html.indexOf('data-platform-carousel="DAZN"'),html.indexOf('data-platform-carousel="Disney+"'));
 assert.match(dazn,/data-platform-step="-1"/);
 assert.match(dazn,/data-platform-step="1"/);
 assert.match(dazn,/1 \/ 2/);
 assert.match(dazn,/World Championship Boxing/);
 assert.match(html,/Hockey on Disney/);
 assert.doesNotMatch(html,/Not confirmed/);
 assert.doesNotMatch(html,/No rights information/);
});

test("User login messages are safe and password recovery is user-triggered",()=>{
 const app=fs.readFileSync("app.js","utf8");
 const start=app.indexOf("function loginAccessError(error){"),end=app.indexOf("\nfunction login(notice",start);
 assert.ok(start>=0&&end>start,"Friendly auth error mapping missing");
 const ctx=vm.createContext({});
 vm.runInContext(app.slice(start,end),ctx);
 assert.match(ctx.loginAccessError({code:"invalid_credentials",message:"Invalid login credentials"}),/Recuperar acceso/);
 assert.match(ctx.loginAccessError({message:"Failed to fetch"}),/conexión/);
 assert.doesNotMatch(ctx.loginAccessError({message:"internal secret debug value"}),/secret debug value/);
 assert.ok(app.includes('document.getElementById("sendRecovery").onclick=async()=>'),'Recovery must be user-triggered');
 assert.ok(app.includes('sb.auth.resetPasswordForEmail(email,{redirectTo})'),'Native Supabase reset flow missing');
 assert.ok(app.includes('document.getElementById("recoveryEmail").checkValidity()'),'Reset email validation missing');
 assert.ok(app.includes('recoveryEvent=true;setTimeout(passwordRecovery,0)'),'Recovery callback missing');
 assert.ok(app.includes('const sources=[')&&app.includes("unpkg.com"),'Backup CDN load missing');
});

test("NHL official fixtures use Dominican time, scores and avoid duplicate ESPN entries",async()=>{
 const app=fs.readFileSync("app.js","utf8");
 const first=app.indexOf("function nhlOfficialEvent(game){"),last=app.indexOf("\nconst REMINDER_STORAGE_PREFIX=",first);
 assert.ok(first>=0&&last>first,"NHL official source helpers missing");
 const games=[
  {id:1,gameDate:"2026-11-18",startTimeUTC:"2026-11-19T00:30:00Z",gameState:"PRE",awayTeam:{placeName:{default:"Boston"},commonName:{default:"Bruins"},abbrev:"BOS"},homeTeam:{placeName:{default:"Detroit"},commonName:{default:"Red Wings"},abbrev:"DET"},tvBroadcasts:[{network:"TNT"}]},
  {id:2,gameDate:"2026-11-18",startTimeUTC:"2026-11-19T00:30:00Z",gameState:"LIVE",periodDescriptor:{number:2},awayTeam:{placeName:{default:"Montreal"},commonName:{default:"Canadiens"},score:2},homeTeam:{placeName:{default:"New Jersey"},commonName:{default:"Devils"},score:3}},
  {id:3,gameDate:"2026-11-18",startTimeUTC:"2026-11-19T03:00:00Z",gameState:"OFF",awayTeam:{placeName:{default:"Colorado"},commonName:{default:"Avalanche"},score:4},homeTeam:{placeName:{default:"Utah"},commonName:{default:"Mammoth"},score:5}}
 ];
 const extra={idEvent:"espn-1",strEvent:"Boston Bruins vs Detroit Red Wings",strHomeTeam:"Detroit Red Wings",strAwayTeam:"Boston Bruins",dateEvent:"2026-11-18",strTimestamp:"2026-11-19T00:30:00Z",strLeague:"NHL"};
 const dateKey=n=>new Date(Date.UTC(2026,10,18+(n||0))).toISOString().slice(0,10);
 const rdDateKey=d=>new Intl.DateTimeFormat("en-CA",{timeZone:"America/Santo_Domingo",year:"numeric",month:"2-digit",day:"2-digit"}).format(d);
 const ctx=vm.createContext({Date,Intl,AbortSignal,console:{warn(){}},dateKey,rdDateKey,sliderLocalDate:e=>e.dateEvent,
   espnGames:async()=>[extra],fetch:async()=>({ok:true,json:async()=>({games})})});
 vm.runInContext(app.slice(first,last),ctx);
 const rows=Array.from(await ctx.nhlGames([0]));
 assert.equal(rows.length,3,"The same game cannot appear twice");
 assert.ok(rows.every(x=>x._nhlOfficial));
 const detroit=rows.find(x=>x.idEvent==="nhl-1");
 assert.equal(detroit.dateEvent,"2026-11-18");
 assert.match(detroit.strTime,/08:30|8:30/);
 assert.equal(detroit.strTVStation,"TNT");
 const devils=rows.find(x=>x.idEvent==="nhl-2");
 assert.equal(devils.strStatus,"LIVE");
 assert.equal(devils.intHomeScore,3);
 assert.equal(devils.strProgress,"P2");
 const utah=rows.find(x=>x.idEvent==="nhl-3");
 assert.equal(utah.strStatus,"FINAL");
 assert.equal(utah.intAwayScore,4);
});
test("NHL weekly API handles month calendars and ESPN backup",async()=>{
 const app=fs.readFileSync("app.js","utf8");
 const first=app.indexOf("function nhlOfficialEvent(game){"),last=app.indexOf("\nconst REMINDER_STORAGE_PREFIX=",first);
 const event={idEvent:"espn-fallback",strEvent:"Boston Bruins vs Detroit Red Wings",strHomeTeam:"Detroit Red Wings",strAwayTeam:"Boston Bruins",dateEvent:"2026-11-18",strTimestamp:"2026-11-19T00:30:00Z",strLeague:"NHL"};
 const dateKey=n=>new Date(Date.UTC(2026,10,18+(n||0))).toISOString().slice(0,10);
 const rdDateKey=d=>new Intl.DateTimeFormat("en-CA",{timeZone:"America/Santo_Domingo",year:"numeric",month:"2-digit",day:"2-digit"}).format(d);
 let fetches=[];
 const ctx=vm.createContext({Date,Intl,AbortSignal,console:{warn(){}},dateKey,rdDateKey,sliderLocalDate:e=>e.dateEvent,
  espnGames:async()=>[event],
  fetch:async url=>{fetches.push(url);return {ok:true,json:async()=>({gameWeek:[]})}}});
 vm.runInContext(app.slice(first,last),ctx);
 const dates=Array.from({length:30},(_,i)=>i);
 const rows=Array.from(await ctx.nhlGames(dates));
 assert.equal(rows.length,1,"ESPN must still load when the official feed is empty");
 assert.ok(fetches.some(u=>u.includes("/v1/schedule/")));
 assert.ok(fetches.some(u=>u.includes("/v1/score/2026-11-18")));
 assert.ok(fetches.length<=6,"30 days should require no more than six official NHL requests");
});

test("Combat classification keeps Boxing, UFC, MMA and BKFC/BKB separate",()=>{
 const app=fs.readFileSync("app.js","utf8");
 const start=app.indexOf("function combatCategory(e){"),end=app.indexOf("\nfunction teamLogo(e,side)",start);
 assert.ok(start>=0&&end>start,"Combat classification missing");
 const context=vm.createContext({isChampionsLeague:()=>false,COMBAT_CATEGORY:"Boxeo / UFC-MMA"});
 vm.runInContext(app.slice(start,end),context);
 const as=(league,sport)=>({strLeague:league,strSport:sport,strEvent:"Test fight"});
 assert.equal(context.combatCategory(as("Boxeo profesional","Boxing")),"BOXEO");
 assert.equal(context.combatCategory(as("UFC Fight Night","MMA")),"UFC");
 assert.equal(context.combatCategory(as("PFL Championship","Mixed Martial Arts")),"MMA");
 assert.equal(context.combatCategory(as("BKFC Fight Night","Bare Knuckle Boxing")),"BARE KNUCKLE");
 assert.equal(context.combatCategory(as("BKB 62","Bare Knuckle Boxing")),"BARE KNUCKLE");
 assert.equal(context.leagueKey(as("BKFC Fight Night","Bare Knuckle Boxing")),"BKFC");
 assert.equal(context.leagueKey(as("BKB 62","Bare Knuckle Boxing")),"BKB");
 assert.equal(context.leagueKey(as("UFC 335","MMA")),"UFC");
 assert.equal(context.leagueKey(as("Boxeo profesional","Boxing")),"BOXEO");
 const matcher=app.slice(app.indexOf("function sportMatches(e,s){"),app.indexOf("\nconst ESPN_SPORT_FEEDS="));
 vm.runInContext(matcher,context);
 assert.equal(context.sportMatches(as("BKFC","Bare Knuckle Boxing"),"Boxeo"),false);
 assert.equal(context.sportMatches(as("UFC","MMA"),"Boxeo"),false);
 assert.equal(context.sportMatches(as("BKB","Bare Knuckle Boxing"),"BKFC/BKB"),true);
 assert.equal(context.sportMatches(as("Boxeo","Boxing"),"UFC/MMA"),false);
});
test("Verified bare-knuckle fixtures render without fabricated local time or streaming",()=>{
 const app=fs.readFileSync("app.js","utf8");
 const classification=app.slice(app.indexOf("function combatCategory(e){"),app.indexOf("\nfunction teamLogo(e,side)"));
 const combat=app.slice(app.indexOf("const BARE_KNUCKLE_EVENTS=["),app.indexOf("\nfunction setupScheduleAutoRefresh()"));
 const ctx=vm.createContext({
  isChampionsLeague:()=>false,
  dateKey:n=>new Date(Date.UTC(2026,10,18+(n||0))).toISOString().slice(0,10),
  sliderLocalDate:e=>e.dateEvent,
  BOXING_SCHEDULE:[]
 });
 vm.runInContext(classification+combat,ctx);
 const result=Array.from(ctx.combatEvents(Array.from({length:30},(_,i)=>i),[{events:[]}],[]));
 assert.equal(result.filter(e=>e._combatOfficial).length,4);
 assert.equal(result.filter(e=>ctx.combatCategory(e)==="BARE KNUCKLE").length,4);
 const bkb=result.find(e=>e.strLeague.startsWith("BKB"));
 assert.match(bkb.strEvent,/Hank Lundy.*Jairo Santos/);
 assert.equal(bkb.dateEvent,"2026-11-21");
 assert.equal(bkb.strTVStation,undefined);
 assert.match(bkb.strTime,/por confirmar/);
 const bkfc=result.find(e=>e.dateEvent==="2026-11-20");
 assert.match(bkfc.strEvent,/Richardson.*Oxendine/);
 assert.match(bkfc._sourceUrl,/bkfc\.com/);
});
test("MMA/boxing feed merger de-duplicates repeated fights by date and fighters",()=>{
 const app=fs.readFileSync("app.js","utf8");
 const classification=app.slice(app.indexOf("function combatCategory(e){"),app.indexOf("\nfunction teamLogo(e,side)"));
 const combat=app.slice(app.indexOf("const BARE_KNUCKLE_EVENTS=["),app.indexOf("\nfunction setupScheduleAutoRefresh()"));
 const sample={strSport:"MMA",strLeague:"UFC",strEvent:"Fighter A vs Fighter B",strHomeTeam:"Fighter A",strAwayTeam:"Fighter B",dateEvent:"2026-11-21"};
 const other={strSport:"Boxing",strLeague:"Boxeo",strEvent:"Boxer A vs Boxer B",strHomeTeam:"Boxer A",strAwayTeam:"Boxer B",dateEvent:"2026-11-21"};
 const ctx=vm.createContext({isChampionsLeague:()=>false,
  dateKey:n=>new Date(Date.UTC(2026,10,18+(n||0))).toISOString().slice(0,10),
  sliderLocalDate:e=>e.dateEvent,BOXING_SCHEDULE:[]});
 vm.runInContext(classification+combat,ctx);
 const fights=Array.from(ctx.combatEvents([3],[{events:[sample,other]}],[sample]));
 assert.equal(fights.filter(e=>e.strEvent===sample.strEvent).length,1);
 assert.equal(fights.filter(e=>e.strEvent===other.strEvent).length,1);
});

test("Remembered login stores only identifier and honors opt-out",()=>{
 const app=fs.readFileSync("app.js","utf8");
 const start=app.indexOf('const REMEMBERED_LOGIN_KEY=');
 const end=app.indexOf('\nfunction loginAccessError(error)',start);
 assert.ok(start>=0&&end>start,"Remembered login helpers missing");
 const data=new Map(),calls=[];
 const storage={getItem:k=>data.get(k)||null,setItem:(k,v)=>{data.set(k,v);calls.push([k,v])},removeItem:k=>data.delete(k)};
 const ctx=vm.createContext({localStorage:storage,window:{},navigator:{},console:{warn(){}},Promise});
 vm.runInContext(app.slice(start,end),ctx);
 assert.equal(ctx.readRememberedLogin(),"");
 ctx.rememberLoginIdentifier("user@example.com",true);
 assert.equal(ctx.readRememberedLogin(),"user@example.com");
 assert.deepEqual(calls,[["cx-tv-remembered-username-v1","user@example.com"]]);
 ctx.rememberLoginIdentifier("",false);
 assert.equal(ctx.readRememberedLogin(),"");
 assert.equal(await ctx.offerBrowserPasswordSave("user@example.com","topsecret"),false);
 assert.ok(![...data.values()].includes("topsecret"));
});
test("Browser-managed credential save is opt-in, never stored in localStorage",async()=>{
 const app=fs.readFileSync("app.js","utf8");
 const start=app.indexOf('const REMEMBERED_LOGIN_KEY=');
 const end=app.indexOf('\nfunction loginAccessError(error)',start);
 const saved=[];
 class FakePasswordCredential{constructor(input){this.id=input.id;this.password=input.password;this.name=input.name}}
 const storage={getItem:()=>null,setItem:()=>{throw Error("Credential must not be written to web storage")},removeItem:()=>{}};
 const ctx=vm.createContext({window:{PasswordCredential:FakePasswordCredential},navigator:{credentials:{store:async c=>saved.push(c)}},localStorage:storage,console:{warn(){}},Promise});
 vm.runInContext(app.slice(start,end),ctx);
 assert.equal(await ctx.offerBrowserPasswordSave("test@example.com","secret-example"),true);
 assert.equal(saved.length,1);
 assert.equal(saved[0].id,"test@example.com");
 assert.equal(saved[0].password,"secret-example");
 assert.equal(saved[0].name,"CodeXaStacio TV Guide");
 assert.ok(app.includes('if(remember)void offerBrowserPasswordSave(identity,password)'),"Credential save must require consent");
 assert.ok(app.includes('autocomplete="username"')&&app.includes('autocomplete="current-password"'),"Browser autofill expected");
});
