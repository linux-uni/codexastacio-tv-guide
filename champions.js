"use strict";
let championsFeedFailed=false;
const UCL_WATCH_SOURCE="https://www.uefa.com/uefachampionsleague/news/0253-0d82037aaedd-f371c464f919-1000--where-to-watch-the-champions-league-tv-broadcast-partners-live-streams/";
function isChampionsLeague(e){
 const league=String(e?.strLeague||"").toLowerCase();
 return /^(uefa )?champions league$/.test(league)||e?._ucl===true;
}
function championsIntro(){
 return '<section class="panel"><h2>UEFA Champions League</h2><p class="muted">Partidos y marcadores • Horarios de República Dominicana (UTC−4)</p><p class="small">RD: ESPN / Disney+, Televideo, CPSL y S&T. La disponibilidad depende del operador y del partido.</p><a class="watch-pill" href="https://www.uefa.com/uefachampionsleague/fixtures-results/" target="_blank" rel="noopener noreferrer">Calendario oficial UEFA ↗</a> <a class="watch-pill" href="'+UCL_WATCH_SOURCE+'" target="_blank" rel="noopener noreferrer">Dónde ver en tu país ↗</a></section>';
}
function championsWatch(e){
 const channel=e._channelName||"",platform=e._providerName||"";
 const registered=[channel,platform].filter(Boolean);
 return '<div class="watch-row"><span class="small muted">📺 Dónde verlo:</span>'+
 (registered.length?'<span class="watch-pill">'+esc(registered.join(" / "))+' <small>Asignado por administración</small></span>':'<span class="watch-pill watch-unverified">Canal específico por confirmar</span>')+
 '<a class="watch-pill" href="https://www.disneyplus.com/" target="_blank" rel="noopener noreferrer">RD: ESPN / Disney+ ↗</a>'+
 '<a class="watch-pill" href="'+UCL_WATCH_SOURCE+'" target="_blank" rel="noopener noreferrer">Operadores oficiales por país ↗</a>'+
 '<span class="small muted">Consulta la programación del operador. Suscripción y disponibilidad territorial aplican.</span></div>';
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
 intHomeScore:scored?h.score:null,intAwayScore:scored?a.score:null};
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
