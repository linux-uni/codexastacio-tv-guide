"use strict";
(function(root){
function sliderLocalDate(e){
 if(!e?.strTimestamp)return String(e?.dateEvent||"").slice(0,10);
 const d=new Date(e.strTimestamp);if(!Number.isFinite(d.getTime()))return String(e.dateEvent||"").slice(0,10);
 return new Intl.DateTimeFormat("en-CA",{timeZone:"America/Santo_Domingo"}).format(d);
}
function canViewProfile(profile,view){
 if(profile?.role==="admin")return true;
 if(view==="schedule")return profile?.can_view_schedule!==false;
 if(view==="channels")return profile?.can_view_channels!==false;
 if(view==="leagues")return profile?.can_view_leagues!==false;
 if(view==="providers")return profile?.can_view_providers!==false;
 return true;
}
Object.defineProperty(root,"CXViewHelpers",{value:Object.freeze({sliderLocalDate,canViewProfile}),writable:false,configurable:false});
})(window);
