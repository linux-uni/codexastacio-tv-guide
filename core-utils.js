"use strict";
// Pure helpers shared by the TV Guide; loaded before app.js.
(function(root){
const esc=v=>String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
function safeDateTime(value){if(!value)return "Sin fecha";const d=new Date(value);return Number.isNaN(d.getTime())?"Sin fecha":d.toLocaleString()}
function dateKey(offset=0){const d=new Date();d.setDate(d.getDate()+offset);const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,"0"),day=String(d.getDate()).padStart(2,"0");return `${y}-${m}-${day}`}
Object.defineProperty(root,"CXUtils",{value:Object.freeze({esc,safeDateTime,dateKey}),writable:false,configurable:false});
})(window);
