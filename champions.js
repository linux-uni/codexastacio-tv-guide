"use strict";
let championsFeedFailed=false;
const UCL_STREAM_URLS={"Disney+":"https://www.disneyplus.com/","DAZN":"https://www.dazn.com/","Netflix":"https://www.netflix.com/","Paramount+":"https://www.paramountplus.com/"};
function isChampionsLeague(e){
 const league=String(e?.strLeague||"").toLowerCase();
 return /^(uefa )?champions league$/.test(league)||e?._ucl===true;
}
function championsIntro(){
 return '<section class="panel"><h2>UEFA Champions League</h2><p class="muted">Partidos y marcadores • Horarios de República Dominicana (UTC−4)</p><p class="small">Cada partido muestra la plataforma o el canal disponible en su ficha. Las señales compatibles incluyen ESPN / Disney+, DAZN, Netflix, Paramount+ y canales DISH.</p><a class="watch-pill" href="https://www.uefa.com/uefachampionsleague/fixtures-results/" target="_blank" rel="noopener noreferrer">Calendario oficial UEFA ↗</a></section>';
}
function canonicalChampionsPlatform(value){
 const name=String(value||"").trim();if(!name)return "";
 if(/netflix/i.test(name))return "Netflix";
 if(/paramount|\bcbs\b/i.test(name))return "Paramount+";
 if(/dazn/i.test(name))return "DAZN";
 if(/disney/i.test(name))return "Disney+";
 if(/espn/i.test(name))return "ESPN / Disney+";
 if(/dish/i.test(name))return "DISH • "+name.replace(/dish\s*/i,"").trim();
 return name;
}
function championsBroadcastOptions(g){
 const competitions=Array.isArray(g?.competitions)?g.competitions:[];
 const rows=[...(Array.isArray(g?.broadcasts)?g.broadcasts:[]),...competitions.flatMap(c=>[...(Array.isArray(c.broadcasts)?c.broadcasts:[]),...(Array.isArray(c.geoBroadcasts)?c.geoBroadcasts:[])])];
 const names=rows.flatMap(row=>[row?.name,row?.shortName,row?.media?.name,row?.media?.shortName,...(Array.isArray(row?.names)?row.names:[]),...(Array.isArray(row?.networks)?row.networks.map(n=>n?.name||n?.shortName):[])]).filter(Boolean).map(canonicalChampionsPlatform);
 return [...new Set(names)];
}
function championsWatch(e){
 const raw=[...(Array.isArray(e._watchOptions)?e._watchOptions:[]),e._providerName,e._channelName,e.strTVStation,e.strChannel,e.strBroadcast].filter(Boolean);
 const options=[...new Set(raw.map(canonicalChampionsPlatform))];
 if(options.some(x=>/ESPN/i.test(x))){
  const espn=typeof channels!=="undefined"?channels.find(x=>/ESPN/i.test(x.name||"")):null;
  if(espn)options.push("DISH • ESPN (Canal "+espn.n+")");
 }
 const badges=options.map(name=>{
  const key=["Disney+","DAZN","Netflix","Paramount+"].find(x=>name===x||name.startsWith(x+" / "));
  const href=key?UCL_STREAM_URLS[key]:"";
  return href?'<a class="watch-pill" href="'+href+'" target="_blank" rel="noopener noreferrer">'+esc(name)+' ↗</a>':'<span class="watch-pill">'+esc(name)+'</span>';
 }).join("");
 return '<div class="watch-row"><span class="small muted">📺 Transmisión:</span>'+
 (badges||'<span class="watch-pill watch-unverified">Plataforma o canal pendiente de confirmar</span>')+
 '</div>';
}
function normalizeChampionsEvent(g){
 const c=g.competitions?.[0];if(!c)return null;
 const h=c.competitors?.find(t=>t.homeAway==="home"),a=c.competitors?.find(t=>t.homeAway==="away");
 if(!h||!a)return null;
 const d=new Date(c.date||g.date),valid=Number.isFinite(d.getTime()),status=c.status||g.status||{},type=status.type||{};
 const scored=type.state==="in"||type.completed===true;
 return {idEvent:"ucl-"+g.id,_ucl:true,strLeague:"UEFA Champions League",strSport:"Soccer",
 strEvent:(h.team?.displayName||"Local")+" vs "+(a.team?.displayName||"Visitante"),
 strHomeTeam:h.team?.displayName||"",strAwayTeam:a.team?.displayName||"",
 strHomeTeamBadge:h.team?.logo||"",strAwayTeamBadge:a.team?.logo||"",
 strTimestamp:valid?d.toISOString():"",dateEvent:valid?new Intl.DateTimeFormat("en-CA",{timeZone:"America/Santo_Domingo"}).format(d):"Fecha por confirmar",
 strTime:valid?d.toLocaleTimeString("es-DO",{timeZone:"America/Santo_Domingo",hour:"2-digit",minute:"2-digit"})+" RD":"Hora por confirmar",
 strStatus:type.state==="in"?"LIVE":type.completed?"FINAL":type.name||"",
 strProgress:type.state==="in"?status.displayClock||type.detail||"":type.completed?"FINAL":"",
 intHomeScore:scored?h.score:null,intAwayScore:scored?a.score:null,_watchOptions:championsBroadcastOptions(g)};
}
function championsDateKey(offset){const d=new Date();d.setUTCDate(d.getUTCDate()+offset);return new Intl.DateTimeFormat("en-CA",{timeZone:"America/Santo_Domingo"}).format(d);}
async function championsGames(offsets){
 championsFeedFailed=false;
 const results=[],queue=[...offsets];
 async function worker(){
  while(queue.length){
   const offset=queue.shift(),date=championsDateKey(offset).replaceAll("-","");
   try{
    const r=await fetch("https://site.api.espn.com/apis/site/v2/sports/soccer/uefa.champions/scoreboard?dates="+date+"&limit=100",{signal:AbortSignal.timeout(12000)});
    if(!r.ok)throw Error("UCL HTTP "+r.status);
    const data=await r.json();if(!Array.isArray(data.events))throw Error("UCL inválido");
    results.push(...data.events.map(normalizeChampionsEvent).filter(Boolean));
   }catch(e){championsFeedFailed=true;console.warn("Champions feed",e);}
  }
 }
 await Promise.all(Array.from({length:Math.min(5,offsets.length)},worker));
 return [...new Map(results.map(e=>[e.idEvent,e])).values()];
}
