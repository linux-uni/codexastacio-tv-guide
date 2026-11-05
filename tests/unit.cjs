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
