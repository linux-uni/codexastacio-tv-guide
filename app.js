"use strict";
const app=document.getElementById("app");
const CFG={url:"https://dzlkpulknbpxibcvdhom.supabase.co",key:"sb_publishable_v4v_GxlTHZNqSYqO-Ij7bQ_IPPFU7sk",admin:"pecristoastacio@gmail.com"};
const channels=[
{n:"140",name:"ESPN",sat:"119°W",fmt:"HD",sports:["NFL","NBA","MLB","NHL","Fútbol","Tenis"]},
{n:"150",name:"FS1",sat:"110°W",fmt:"HD",sports:["NFL","MLB","Fútbol","UFC/MMA"]},
{n:"152",name:"MLB Network",sat:"119°W",fmt:"HD",sports:["MLB"]},
{n:"154",name:"NFL Network",sat:"119°W",fmt:"HD",sports:["NFL"]},
{n:"156",name:"NBA TV",sat:"110°W",fmt:"HD",sports:["NBA"]},
{n:"400",name:"Tennis Channel",sat:"110°W",fmt:"HD",sports:["Tenis"]},
{n:"404",name:"SEC Network",sat:"119°W",fmt:"HD",sports:["NFL","NCAA"]}
];
const providers=[{name:"DISH",tag:"110°W / 119°W",sports:"NFL NBA MLB NHL Fútbol Tenis NCAA"},{name:"Disney+",tag:"Streaming",sports:"ESPN deportes fútbol hockey tenis"},{name:"DAZN",tag:"Streaming",sports:"Boxeo NFL fútbol MMA"},{name:"Netflix",tag:"Streaming",sports:"Eventos deportivos especiales"},{name:"Paramount+",tag:"Streaming",sports:"Fútbol UEFA deportes CBS"}];
const events=[
{sport:"NFL",title:"NFL • Próximos partidos",network:"NFL Network",channel:"154",status:"PROGRAMACIÓN"},
{sport:"NBA",title:"NBA • Próximos partidos",network:"NBA TV",channel:"156",status:"PROGRAMACIÓN"},
{sport:"MLB",title:"MLB • Próximos partidos",network:"MLB Network",channel:"152",status:"PROGRAMACIÓN"},
{sport:"Fútbol",title:"Fútbol • Agenda deportiva",network:"FS1 / ESPN",channel:"150 / 140",status:"PROGRAMACIÓN"},
{sport:"Tenis",title:"Tenis • Agenda de torneos",network:"Tennis Channel",channel:"400",status:"PROGRAMACIÓN"},
{sport:"UFC/MMA",title:"UFC/MMA • Próximos eventos",network:"FS1 / Sports",channel:"Consultar listing",status:"PROGRAMACIÓN"},
{sport:"NHL",title:"NHL • Próximos partidos",network:"ESPN",channel:"140",status:"PROGRAMACIÓN"}
];
let sb=null,currentUser=null,currentProfile=null,scheduleEvents=[],scheduleRange="today",channelFilter="Todos",sliderTimer=null,sliderEvents=[],slideIndex=0,scheduleRefreshTimer=null,scheduleRefreshBound=false,scheduleRequestId=0,sliderRefreshTimer=null,sliderVisibilityBound=false,sliderLastRefresh=0,sliderLoadedDay="",sliderLoading=false,reminderEventIndex=new Map(),reminderInteractionsBound=false,reminderTicker=null,deferredInstallPrompt=null,state={view:"home",sport:"Todos"};
const OFFICIAL_SCHEDULES={
 UCL:"https://www.uefa.com/uefachampionsleague/fixtures-results/",
 NFL:"https://www.nfl.com/schedules/",
 NHL:"https://www.nhl.com/schedule",
 MLB:"https://www.mlb.com/schedule",
 NBA:"https://www.nba.com/schedule"
};
function officialScheduleLink(e){const k=leagueKey(e);return k?OFFICIAL_SCHEDULES[k]||"":""}
function leagueKey(e){const s=String(e?.strSport||e?.sport||"").toLowerCase(),l=String(e?.strLeague||e?.title||"").toLowerCase();if(isChampionsLeague(e))return "UCL";if(l.includes("nfl")||s.includes("american football"))return "NFL";if(l.includes("nhl")||s.includes("ice hockey"))return "NHL";if(l.includes("mlb")||s.includes("baseball"))return "MLB";if(l.includes("nba")||(l.includes("national basketball association")))return "NBA";if(/ufc|mma|mixed martial/.test(l+" "+s))return "UFC/MMA";if(/formula 1|formula one|\bf1\b/.test(l+" "+s))return "F1";if(/tennis|\batp\b|\bwta\b/.test(l+" "+s))return "TENIS";if(/ncaa|college|division 1/.test(l+" "+s))return "NCAA";if(s.includes("basketball"))return "NBA";return ""}

function teamLogo(e,side){return side==="home"?(e.strHomeTeamBadge||e.strHomeTeamLogo||e.strHomeTeamBanner||""):(e.strAwayTeamBadge||e.strAwayTeamLogo||e.strAwayTeamBanner||"")}
function teamName(e,side){return side==="home"?(e.strHomeTeam||"Local"):(e.strAwayTeam||"Visitante")}
function sportArtInfo(e){
 const value=String([e?.strSport,e?.sport,e?.strLeague,e?.title,e?.strEvent].filter(Boolean).join(" ")).toLowerCase();
 if(/badminton/.test(value))return {key:"badminton",label:"BADMINTON",icon:"🏸"};
 if(/american football|\bnfl\b|football league/.test(value))return {key:"football",label:"FÚTBOL AMERICANO",icon:"🏈"};
 if(/ice hockey|\bnhl\b|hockey/.test(value))return {key:"hockey",label:"HOCKEY",icon:"🏒"};
 if(/baseball|\bmlb\b/.test(value))return {key:"baseball",label:"BÉISBOL",icon:"⚾"};
 if(/basketball|\bnba\b/.test(value))return {key:"basketball",label:"BALONCESTO",icon:"🏀"};
 if(/tennis|tenis|\batp\b|\bwta\b/.test(value))return {key:"tennis",label:"TENIS",icon:"🎾"};
 if(/ufc|mma|mixed martial|boxing|boxeo/.test(value))return {key:"combat",label:/boxing|boxeo/.test(value)?"BOXEO":"UFC · MMA",icon:"🥊"};
 if(/formula 1|formula one|\bf1\b|motor racing|motorsport|racing/.test(value))return {key:"racing",label:"MOTORSPORT",icon:"🏁"};
 if(/soccer|fútbol|\bucl\b|champions league/.test(value))return {key:"soccer",label:"FÚTBOL",icon:"⚽"};
 if(/volleyball|voleibol/.test(value))return {key:"volleyball",label:"VOLEIBOL",icon:"🏐"};
 if(/rugby/.test(value))return {key:"rugby",label:"RUGBY",icon:"🏉"};
 if(/golf/.test(value))return {key:"golf",label:"GOLF",icon:"⛳"};
 if(/cricket/.test(value))return {key:"cricket",label:"CRICKET",icon:"🏏"};
 if(/swimming|natación|aquatics/.test(value))return {key:"aquatics",label:"NATACIÓN",icon:"🏊"};
 if(/cycling|ciclismo/.test(value))return {key:"cycling",label:"CICLISMO",icon:"🚴"};
 if(/athletics|atletismo/.test(value))return {key:"athletics",label:"ATLETISMO",icon:"🏃"};
 return {key:"sports",label:String(e?.strSport||"DEPORTE").toUpperCase(),icon:"🏆"};
}
function sportArtwork(e,variant="card"){
 const art=sportArtInfo(e),league=String(e?.strLeague||"Evento deportivo");
 return '<div class="sport-art sport-art-'+variant+' art-'+art.key+'" role="img" aria-label="Ilustración de '+esc(art.label.toLowerCase())+'"><span class="sport-art-orb"></span><span class="sport-art-lines"></span><span class="sport-art-icon" aria-hidden="true">'+art.icon+'</span><div class="sport-art-copy"><strong>'+esc(art.label)+'</strong><small>'+esc(league)+'</small></div></div>';
}
function matchupVisual(e,compact=false){const home=teamLogo(e,"home"),away=teamLogo(e,"away"),hn=teamName(e,"home"),an=teamName(e,"away"),k=leagueKey(e)||e.strSport||"SPORTS";if(!home&&!away)return compact?sportArtwork(e,"card"):"";const logo=(src,name)=>src?'<img src="'+esc(src)+'" alt="'+esc(name)+'" loading="lazy" referrerpolicy="no-referrer">':'<span class="team-fallback">'+esc(name.slice(0,2).toUpperCase())+'</span>';return '<div class="matchup-visual '+(compact?"compact":"")+'"><div class="team-side">'+logo(home,hn)+'<b>'+esc(hn)+'</b></div><div class="versus"><small>'+esc(k)+'</small><strong>VS</strong></div><div class="team-side">'+logo(away,an)+'<b>'+esc(an)+'</b></div></div>'}
function feedVisual(e){return sportArtwork(e,"card")}

const esc=v=>String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));

function canView(view){
 if(currentProfile?.role==="admin")return true;
 if(view==="schedule")return currentProfile?.can_view_schedule!==false;
 if(view==="channels")return currentProfile?.can_view_channels!==false;
 if(view==="leagues")return currentProfile?.can_view_leagues!==false;
 if(view==="providers")return currentProfile?.can_view_providers!==false;
 return true;
}
function safeDateTime(value){if(!value)return "Sin fecha";const d=new Date(value);return Number.isNaN(d.getTime())?"Sin fecha":d.toLocaleString()}

async function loadManagedContent(){
 if(!sb||!currentUser)return;
 const oldChannels=[...channels],oldProviders=[...providers];
 const [ch,pr,svc]=await Promise.all([
  sb.from("channels").select("id,channel_number,name,satellite,transponder,format,active").eq("active",true).order("channel_number"),
  sb.from("providers").select("id,code,name,is_base,active").eq("active",true).order("name"),
  sb.from("user_services").select("provider_id,enabled").eq("user_id",currentUser.id)
 ]);
 if(!ch.error&&ch.data?.length){channels.splice(0,channels.length,...ch.data.map(x=>{const old=oldChannels.find(o=>String(o.n)===String(x.channel_number)||o.name===x.name);return {id:x.id,n:x.channel_number,name:x.name,sat:x.satellite||"",fmt:x.format||"HD",sports:old?.sports||["Sports"]}}))}
 if(!pr.error&&pr.data?.length){const enabled=new Set((svc.data||[]).filter(x=>x.enabled).map(x=>String(x.provider_id)));const visible=currentProfile?.role==="admin"?pr.data:pr.data.filter(x=>x.is_base||enabled.has(String(x.id)));providers.splice(0,providers.length,...visible.map(x=>{const old=oldProviders.find(o=>o.name===x.name);return {id:x.id,code:x.code,name:x.name,is_base:x.is_base,tag:old?.tag||(x.is_base?"Base":"Streaming"),sports:old?.sports||"Sports"}}))}
}
function passwordRecovery(){
 app.innerHTML='<main class="wrap"><section class="panel login"><div class="login-hero"><div class="cx-emblem">CX</div><div class="cx-login-title">Nueva contraseña</div><div class="cx-login-sub">CODEXASTACIO</div></div><h2>Restablecer acceso</h2><p class="muted">Crea una nueva contraseña para tu cuenta.</p><form id="recoveryForm"><input id="newPassword" class="input" type="password" minlength="8" autocomplete="new-password" placeholder="Nueva contraseña (mínimo 8 caracteres)" required><br><br><input id="confirmPassword" class="input" type="password" minlength="8" autocomplete="new-password" placeholder="Confirmar contraseña" required><br><br><button class="btn primary" style="width:100%">Guardar contraseña</button></form><div id="recoveryMsg" class="small muted" style="margin-top:12px"></div></section></main>';
 document.getElementById("recoveryForm").onsubmit=async e=>{e.preventDefault();const pw=document.getElementById("newPassword").value,cp=document.getElementById("confirmPassword").value,msg=document.getElementById("recoveryMsg");if(pw!==cp){msg.className="danger small";msg.textContent="Las contraseñas no coinciden.";return}const {error}=await sb.auth.updateUser({password:pw});if(error){msg.className="danger small";msg.textContent=error.message;return}history.replaceState({},document.title,location.pathname);msg.className="ok small";msg.textContent="Contraseña actualizada. Abriendo la guía…";setTimeout(async()=>{const {data}=await sb.auth.getUser();if(data?.user)await openSession(data.user);else login()},700)}
}
function nav(){
 const items=[["home","Inicio"],["schedule","Programación"],["channels","Canales"],["leagues","Ligas"],["install","Instalar app"]].filter(([v])=>v==="home"||v==="install"||canView(v));
 return '<nav class="nav desktop-nav">'+items.map(x=>'<button data-view="'+x[0]+'" class="btn '+(state.view===x[0]?"active":"")+'">'+x[1]+'</button>').join("")+'</nav>'
}

function detectInstallDevice(){
 const ua=navigator.userAgent||"",platform=navigator.userAgentData?.platform||navigator.platform||"";
 const ios=/iPhone|iPad|iPod/i.test(ua)||(/MacIntel/i.test(platform)&&navigator.maxTouchPoints>1);
 const android=/Android/i.test(ua),mobile=ios||android||!!navigator.userAgentData?.mobile;
 const browser=/Edg\//i.test(ua)?"Microsoft Edge":/SamsungBrowser/i.test(ua)?"Samsung Internet":/Brave/i.test(ua)?"Brave":/CriOS|Chrome\//i.test(ua)?"Chrome":/FxiOS|Firefox\//i.test(ua)?"Firefox":/Safari/i.test(ua)?"Safari":"Navegador web";
 let installed=false;try{installed=matchMedia("(display-mode: standalone)").matches||matchMedia("(display-mode: fullscreen)").matches||navigator.standalone===true}catch{}
 return {ios,android,mobile,installed,browser,device:ios?(/iPad/i.test(ua)||(/MacIntel/i.test(platform)&&navigator.maxTouchPoints>1)?"iPad":"iPhone"):android?"Android":mobile?"Dispositivo móvil":"Computadora"};
}
function installPanel(){
 const d=detectInstallDevice();
 const status=d.installed?'<div class="install-status installed">✓ TV Listing App ya está instalada en este dispositivo.</div>':deferredInstallPrompt?'<button id="installAppButton" class="btn primary install-cta">⬇ Instalar TV Listing App</button>':'';
 let steps;
 if(d.installed)steps='<p>Abre la app desde el ícono de TV Listing en la pantalla de inicio o en el menú de aplicaciones.</p>';
 else if(d.ios)steps='<ol><li>Abre esta página en <strong>Safari</strong> si todavía estás en otro navegador o dentro de otra app.</li><li>Toca <strong>Compartir</strong> (□↑) en el menú del navegador.</li><li>Selecciona <strong>Añadir a pantalla de inicio</strong> y luego toca <strong>Añadir</strong>.</li></ol>';
 else if(d.android)steps='<ol><li>Si aparece el botón de instalación, tócalo y confirma.</li><li>Si no aparece, abre el menú <strong>⋮</strong> de Chrome y elige <strong>Instalar aplicación</strong> o <strong>Añadir a pantalla de inicio</strong>.</li></ol>';
 else if(!d.mobile)steps='<ol><li>Usa el botón de instalación si está disponible.</li><li>También puedes abrir el menú de Chrome o Edge y elegir <strong>Instalar TV Listing App</strong>.</li></ol>';
 else steps='<ol><li>Abre el menú de tu navegador.</li><li>Selecciona <strong>Instalar aplicación</strong> o <strong>Añadir a pantalla de inicio</strong>.</li></ol>';
 const note=!d.installed&&!deferredInstallPrompt?'<p class="small muted install-note">El navegador todavía no ofrece el botón directo. Usa los pasos indicados; la opción puede aparecer después de abrir la página en el navegador completo.</p>':"";
 return '<div class="install-page"><div class="install-hero"><span class="install-icon">CX</span><div><span class="badge">INSTALACIÓN PARA TU EQUIPO</span><h2>TV Listing App en tu dispositivo</h2><p class="muted">Detectamos: <strong>'+esc(d.device)+' · '+esc(d.browser)+'</strong></p></div></div><article class="card install-card"><h3>'+(d.installed?"App instalada":d.ios?"Añadir al iPhone o iPad":d.android?"Instalar en Android":"Instalar en computadora")+'</h3>'+status+'<div class="install-steps">'+steps+'</div>'+note+'</article><article class="install-benefits"><strong>Acceso directo a tu guía deportiva</strong><p class="small muted">Al instalarla, TV Listing se abre desde tu pantalla de inicio o menú de aplicaciones como una app.</p></article></div>';
}
async function installTvListingApp(){
 if(!deferredInstallPrompt)return;
 const prompt=deferredInstallPrompt;deferredInstallPrompt=null;
 try{await prompt.prompt();const choice=await prompt.userChoice;showReminderToast(choice?.outcome==="accepted"?"Instalación iniciada.":"Puedes instalarla después desde esta pestaña.");if(choice?.outcome==="accepted")setTimeout(()=>{if(state.view==="install")dashboard()},700)}
 catch(e){showReminderToast("No se pudo abrir el instalador. Sigue los pasos de esta pantalla.")}
}
window.addEventListener("beforeinstallprompt",event=>{event.preventDefault();deferredInstallPrompt=event;if(state.view==="install")dashboard()});
window.addEventListener("appinstalled",()=>{deferredInstallPrompt=null;if(state.view==="install")dashboard()});

function chips(){return `<div class="chips">${["Todos","NFL","NBA","MLB","NHL","Champions League","Fútbol","Tenis","UFC/MMA","NCAA","Fórmula 1"].map(x=>`<button data-sport="${x}" class="chip ${state.sport===x?"active":""}">${x}</button>`).join("")}</div>`}
function providerCards(){return `<div id="providerGrid" class="grid provider-grid"><div class="notice">Actualizando próximos eventos por plataforma…</div></div>`}
function netflixUpcomingEvent(){
 const today=dateKey();
 const schedule=[
  {dateEvent:"2026-11-25",strEvent:"Green Bay Packers vs Los Angeles Rams",strHomeTeam:"Los Angeles Rams",strAwayTeam:"Green Bay Packers",strHomeTeamBadge:"https://a.espncdn.com/i/teamlogos/nfl/500/lar.png",strAwayTeamBadge:"https://a.espncdn.com/i/teamlogos/nfl/500/gb.png",strSport:"American Football",strLeague:"NFL • Netflix",strTime:"Hora por confirmar · RD",_netflixSchedule:true},
  {dateEvent:"2026-12-25",strEvent:"Green Bay Packers vs Chicago Bears",strHomeTeam:"Chicago Bears",strAwayTeam:"Green Bay Packers",strHomeTeamBadge:"https://a.espncdn.com/i/teamlogos/nfl/500/chi.png",strAwayTeamBadge:"https://a.espncdn.com/i/teamlogos/nfl/500/gb.png",strSport:"American Football",strLeague:"NFL • Netflix",strTime:"2:00 p. m. RD",_netflixSchedule:true},
  {dateEvent:"2026-12-25",strEvent:"Buffalo Bills vs Denver Broncos",strHomeTeam:"Denver Broncos",strAwayTeam:"Buffalo Bills",strHomeTeamBadge:"https://a.espncdn.com/i/teamlogos/nfl/500/den.png",strAwayTeamBadge:"https://a.espncdn.com/i/teamlogos/nfl/500/buf.png",strSport:"American Football",strLeague:"NFL • Netflix",strTime:"5:30 p. m. RD",_netflixSchedule:true},
  {dateEvent:"2027-01-09",strEvent:"NFL Semana 18 • equipos por confirmar",strSport:"American Football",strLeague:"NFL • Netflix",strTime:"2:00 p. m. RD",_netflixSchedule:true}
 ];
 return schedule.find(e=>e.dateEvent>=today)||null;
}
function providerEventDate(e){
 if(!e?.dateEvent)return "";
 const [y,m,d]=e.dateEvent.split("-").map(Number),date=new Date(Date.UTC(y,m-1,d,12));
 return [date.toLocaleDateString("es-DO",{timeZone:"America/Santo_Domingo",day:"numeric",month:"short"}),e.strTime].filter(Boolean).join(" • ");
}
function providerEventCards(){
 const digital=providers.filter(p=>!p.is_base&&String(p.name).toLowerCase()!=="dish").slice(0,6);
 if(!digital.length)return '<div class="notice">No hay plataformas digitales habilitadas para esta cuenta.</div>';
 return digital.map(p=>{
  const name=p.name,isNetflix=/^netflix$/i.test(name);
  const found=(isNetflix?netflixUpcomingEvent():null)||sliderEvents.find(e=>demoWhereToWatch(e).some(x=>x.name.toLowerCase()===name.toLowerCase()));
  const status=found?(found._netflixSchedule?"EN NETFLIX":"PRÓXIMO"):"SIN EVENTO CONFIRMADO";
  const title=found?.strEvent||(isNetflix?"No hay próximas transmisiones confirmadas":"Próximos eventos");
  const meta=found?providerEventDate(found):"La tarjeta se actualizará cuando haya un evento anunciado.";
  const matchup=found?matchupVisual(found,true):"";
  return '<article class="card provider-event searchable" data-search="'+esc((name+" "+(found?.strEvent||"")).toLowerCase())+'"><div class="provider-logo">'+esc(name)+'</div>'+matchup+'<div class="provider-bottom"><span class="badge">'+status+'</span><h3>'+esc(title)+'</h3><p class="small muted">'+esc(meta)+'</p></div></article>';
 }).join("");
}

function renderProviders(){const x=document.getElementById("providerGrid");if(x)x.innerHTML=providerEventCards()}
function sportMark(s){const x=(s||"SPORT").toUpperCase();return `<span class="sport-mark">${esc(x==="AMERICAN FOOTBALL"?"NFL":x==="BASKETBALL"?"NBA":x==="BASEBALL"?"MLB":x==="ICE HOCKEY"?"NHL":x==="SOCCER"?"FÚTBOL":x.slice(0,6))}</span>`}
function channelFilters(){return `<div class="channel-filterbar">${["Todos","Próximos","NBA","NFL","MLB","Fútbol","Tenis"].map(x=>`<button class="channel-filter ${channelFilter===x?"active":""}" data-channel-filter="${x}">${x}</button>`).join("")}</div>`}
function channelEvent(c){return sliderEvents.find(x=>c.sports.some(s=>{const a=String(x.strSport||"").toLowerCase(),b=s.toLowerCase();return a.includes(b==="fútbol"?"soccer":b==="nfl"?"american football":b==="nba"?"basketball":b==="mlb"?"baseball":b==="nhl"?"ice hockey":b==="tenis"?"tennis":b.split("/")[0])}))}
function channelCards(list){let rows=list.map(c=>({c,e:channelEvent(c)}));if(channelFilter!=="Todos"&&channelFilter!=="Próximos")rows=rows.filter(({c})=>c.sports.includes(channelFilter));return `<div class="channel-showcase">${rows.map(({c,e},i)=>{const sport=e?.strSport||c.sports[0],img=e&&(e.strThumb||e.strPoster||e.strFanart);return `<article class="channel-tile searchable" data-search="${esc((c.name+" "+c.n+" "+c.sports.join(" ")+" "+(e?.strEvent||"")).toLowerCase())}" ${img?`style="--channel-bg:url('${esc(img)}')"`:""}><div class="channel-art"></div><div class="channel-body"><div class="channel-head"><div class="channel-identity"><span class="channel-logo">${esc(c.name)}</span><span class="channel-number">CH ${esc(c.n)}</span></div>${sportMark(sport)}</div><span class="next-badge">PRÓXIMO</span><h3>${esc(e?.strEvent||c.sports.slice(0,2).join(" • "))}</h3><div class="channel-meta">${esc(e?[e.dateEvent,e.strTime,e.strLeague].filter(Boolean).join(" • "):"Programación deportiva")}</div><div class="progress-track"><i style="width:${25+(i%4)*15}%"></i></div><div class="now-next"><span><b>Ahora</b> Guía deportiva</span><span><b>A continuación</b> ${esc(e?.strEvent||"Por actualizar")}</span></div></div></article>`}).join("")}</div>`}
function eventCards(list){return `<div class="grid">${list.map(e=>`<article class="card event searchable" data-search="${esc((e.sport+" "+e.title+" "+e.network+" "+e.channel).toLowerCase())}"><div class="row"><strong>${esc(e.sport)}</strong><span class="badge">${esc(e.status)}</span></div><h3>${esc(e.title)}</h3><div class="small muted">📺 ${esc(e.network)}</div><div class="notice small">DISH: ${esc(e.channel)} • horarios por TV listing</div></article>`).join("")}</div>`}
function dateKey(offset=0){const d=new Date();d.setDate(d.getDate()+offset);const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,"0"),day=String(d.getDate()).padStart(2,"0");return `${y}-${m}-${day}`}
function scheduleControls(){return `<div class="chips schedule-tabs">${[["today","Hoy"],["tomorrow","Mañana"],["week","Próximos 7 días"],["month","Próximos 30 días"]].map(x=>`<button data-range="${x[0]}" class="chip ${scheduleRange===x[0]?"active":""}">${x[1]}</button>`).join("")}</div>`}
function sportMatches(e,s){if(s==="Todos")return true;if(s==="Champions League")return isChampionsLeague(e);const x=String([e.strLeague,e.strSport,e.strEvent].join(" ")).toLowerCase();if(s==="NFL")return /\bnfl\b|national football league/.test(x);if(s==="NBA")return /\bnba\b|national basketball association/.test(x)&&!/ncaa|college/.test(x);if(s==="MLB")return /\bmlb\b|major league baseball/.test(x);if(s==="NHL")return /\bnhl\b|national hockey league/.test(x);if(s==="Fútbol")return /soccer|fútbol|football/.test(x)&&!/american football|college football|national football league/.test(x);if(s==="Tenis")return /tennis|tenis|\batp\b|\bwta\b/.test(x);if(s==="UFC/MMA")return /ufc|mma|mixed martial/.test(x);if(s==="NCAA")return /ncaa|college|division 1/.test(x);if(s==="Fórmula 1")return /formula 1|formula one|\bf1\b/.test(x);return x.includes(s.toLowerCase())}
const ESPN_SPORT_FEEDS={
 NFL:{paths:["football/nfl"],sport:"American Football",league:"NFL"},
 NBA:{paths:["basketball/nba"],sport:"Basketball",league:"NBA"},
 UFC:{paths:["mma/ufc"],sport:"MMA",league:"UFC"},
 NCAA:{paths:["football/college-football","basketball/mens-college-basketball","basketball/womens-college-basketball"],sport:"NCAA",league:"NCAA"},
 TENIS:{paths:["tennis/atp","tennis/wta"],sport:"Tennis",league:"Tennis"},
 F1:{paths:["racing/f1"],sport:"Formula 1",league:"Formula 1"},
 NHL:{paths:["hockey/nhl"],sport:"Ice Hockey",league:"NHL"}
};
function espnNames(event,competition){
 const rows=[...(event?.broadcasts||[]),...(competition?.broadcasts||[]),...(competition?.geoBroadcasts||[])];
 return [...new Set(rows.flatMap(row=>[row?.name,row?.shortName,row?.media?.name,row?.media?.shortName,...(row?.names||[])])
  .filter(Boolean).map(x=>String(x).trim()).filter(Boolean))];
}
function normalizeEspnCompetition(event,competition,feedKey,path){
 const contestants=competition?.competitors||event?.competitors||[];
 const bySide=side=>contestants.find(x=>x.homeAway===side)||contestants.find(x=>Number(x.order)===(side==="home"?1:2));
 const home=bySide("home"),away=bySide("away");
 const participant=x=>x?.athlete?.displayName||x?.athlete?.fullName||x?.team?.displayName||x?.team?.name||x?.displayName||"";
 const homeName=participant(home),awayName=participant(away);
 const stamp=competition?.date||competition?.startDate||event?.date||event?.startDate||"";
 const d=new Date(stamp),valid=Number.isFinite(d.getTime());
 const status=competition?.status||event?.status||{},type=status.type||{};
 const names=espnNames(event,competition);
 const eventName=(homeName&&awayName)?homeName+" vs "+awayName:(event?.name||event?.shortName||feedKey);
 const tournament=feedKey==="TENIS"&&event?.name?event.name:"";
 const league=feedKey==="TENIS"?((path.includes("/atp")?"ATP":"WTA")+(tournament?" • "+tournament:"")):
  feedKey==="NCAA"?String(event?.season?.type?.name||"NCAA")+" • "+(event?.name||path.split("/").pop()):
  feedKey==="UFC"?(event?.name&&event.name!==eventName?"UFC • "+event.name:"UFC"):
  feedKey==="F1"?"Formula 1":feedKey;
 const id="espn-"+feedKey.toLowerCase()+"-"+(event?.id||"event")+"-"+(competition?.id||"game");
 return {idEvent:id,_espn:true,strEvent:eventName,
  strHomeTeam:homeName,strAwayTeam:awayName,
  strHomeTeamBadge:home?.athlete?.headshot?.href||home?.team?.logo||"",
  strAwayTeamBadge:away?.athlete?.headshot?.href||away?.team?.logo||"",
  strLeague:league,strSport:feedKey==="UFC"?"MMA":feedKey==="F1"?"Motor Racing":feedKey==="NCAA"?league:feedKey==="TENIS"?"Tennis":feedKey==="NFL"?"American Football":feedKey==="NHL"?"Ice Hockey":"Basketball",
  strTimestamp:valid?d.toISOString():"",dateEvent:valid?new Intl.DateTimeFormat("en-CA",{timeZone:"America/Santo_Domingo"}).format(d):"",
  strTime:valid?d.toLocaleTimeString("es-DO",{timeZone:"America/Santo_Domingo",hour:"2-digit",minute:"2-digit"})+" RD":"",
  strStatus:type.state==="in"?"LIVE":type.completed?"FINAL":type.detail||type.name||"",
  strProgress:type.state==="in"?(status.displayClock||type.shortDetail||""):"",
  intHomeScore:home?.score??null,intAwayScore:away?.score??null,
  strTVStation:names.join(", "),_watchOptions:names};
}
function normalizeEspnEvent(event,feedKey,path){
 const competitions=[...(event?.competitions||[]),...(event?.groupings||[]).flatMap(g=>g.competitions||[])];
 const rows=competitions.length?competitions:[null];
 return rows.map(c=>normalizeEspnCompetition(event,c,feedKey,path));
}
async function espnGames(offsets,feedKey){
 const feed=ESPN_SPORT_FEEDS[feedKey];if(!feed)return [];
 const first=dateKey(Math.min(...offsets)).replaceAll("-","");
 const last=dateKey(Math.max(...offsets)).replaceAll("-","");
 const dates=first===last?first:first+"-"+last;
 const results=await Promise.all(feed.paths.map(async path=>{
  try{
   const r=await fetch("https://site.api.espn.com/apis/site/v2/sports/"+path+"/scoreboard?dates="+dates+"&limit=1000",{signal:AbortSignal.timeout(12000)});
   if(!r.ok)throw Error("ESPN "+feedKey+" HTTP "+r.status);
   const data=await r.json();if(!Array.isArray(data.events))return [];
   return data.events.flatMap(event=>normalizeEspnEvent(event,feedKey,path)).filter(e=>e.strEvent);
  }catch(e){console.warn("ESPN "+feedKey+" feed",e);return []}
 }));
 return [...new Map(results.flat().map(e=>[e.idEvent,e])).values()];
}
async function mlbGames(offsets){const url="https://statsapi.mlb.com/api/v1/schedule?sportId=1&startDate="+dateKey(offsets[0])+"&endDate="+dateKey(offsets[offsets.length-1]);const res=await fetch(url);if(!res.ok)throw Error("MLB feed HTTP "+res.status);const data=await res.json();return (data.dates||[]).flatMap(d=>(d.games||[]).map(g=>{const h=g.teams?.home?.team,a=g.teams?.away?.team;return {idEvent:"mlb-"+g.gamePk,strEvent:(a?.name||"Visitante")+" vs "+(h?.name||"Local"),strHomeTeam:h?.name||"",strAwayTeam:a?.name||"",strHomeTeamBadge:h?.id?"https://www.mlbstatic.com/team-logos/"+h.id+".svg":"",strAwayTeamBadge:a?.id?"https://www.mlbstatic.com/team-logos/"+a.id+".svg":"",strLeague:"MLB",strSport:"Baseball",strTimestamp:g.gameDate,dateEvent:g.officialDate||d.date,strTime:g.gameDate?new Date(g.gameDate).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}):"",strStatus:g.status?.abstractGameState==="Live"?"LIVE":g.status?.detailedState||"",intHomeScore:g.teams?.home?.score,intAwayScore:g.teams?.away?.score}}))}
const FOOTBALL_COMPETITIONS=["Premier League","La Liga","Serie A","Bundesliga","Ligue 1","Champions League","Europa League","Conference League","Copa Libertadores","Copa Sudamericana","FIFA World Cup","FIFA Club World Cup","Copa América","Euro","CONCACAF Champions Cup","CONCACAF Gold Cup","Liga MX","MLS","Brasileirão","Copa del Rey","FA Cup","EFL Cup","Coppa Italia","DFB-Pokal","Coupe de France","Saudi Pro League","Eredivisie","Primeira Liga","Scottish Premiership","Argentine Primera División"];
let footballLeague="Todas";
function footballCompetition(e){return String(e.strLeague||"Liga sin identificar")}
function footballFilter(e){return sportMatches(e,"Fútbol")&&(footballLeague==="Todas"||footballCompetition(e).toLowerCase().includes(footballLeague.toLowerCase()))}
function footballLeagueSelector(){if(state.sport!=="Fútbol")return "";const found=[...new Set(scheduleEvents.filter(e=>sportMatches(e,"Fútbol")).map(footballCompetition))];const leagues=[...new Set(["Todas",...FOOTBALL_COMPETITIONS,...found])];return '<div class="football-league-picker"><label for="footballLeague">Liga o copa</label><select id="footballLeague">'+leagues.map(x=>'<option value="'+esc(x)+'"'+(footballLeague===x?' selected':'')+'>'+esc(x)+'</option>').join("")+'</select></div>'}
function eventLive(e){const s=String(e.strStatus||"").toUpperCase(),p=String(e.strProgress||"");return /^(1H|2H|HT|ET|PEN|LIVE|IN PLAY|Q[1-4])$/.test(s)||/^\\d{1,3}(\\+\\d+)?['′]?$/.test(p)}
function scoreBadge(e){const h=e.intHomeScore,a=e.intAwayScore,has=h!==null&&h!==undefined&&h!==""&&a!==null&&a!==undefined&&a!=="";return '<div class="scoreline">'+(eventLive(e)?'<span class="live-indicator">● EN VIVO</span>':"")+(has?'<strong class="match-score">'+esc(h)+' - '+esc(a)+'</strong>':"")+(e.strProgress?'<span class="muted small">'+esc(e.strProgress)+'</span>':"")+'</div>'}
async function nhlGames(offsets){
 const dates=offsets.map(n=>dateKey(n)),queue=[...dates],results=[];
 async function worker(){
  while(queue.length){
   const date=queue.shift();
   try{
    const response=await fetch("https://api-web.nhle.com/v1/score/"+date,{signal:AbortSignal.timeout(12000)});
    if(!response.ok)throw Error("NHL HTTP "+response.status);
    results.push(await response.json());
   }catch(e){console.warn("NHL official feed "+date,e)}
  }
 }
 await Promise.all(Array.from({length:Math.min(5,dates.length)},worker));
 const games=results.flatMap(x=>x.games||[]);
 const official=[...new Map(games.map(g=>{
  const h=g.homeTeam||{},a=g.awayTeam||{},state=String(g.gameState||"").toUpperCase(),live=["LIVE","CRIT"].includes(state),done=["OFF","FINAL"].includes(state);
  const name=t=>t.placeName?.default&&t.commonName?.default?t.placeName.default+" "+t.commonName.default:t.name?.default||t.abbrev||"Equipo";
  const ev={idEvent:"nhl-"+g.id,strEvent:name(a)+" vs "+name(h),strHomeTeam:name(h),strAwayTeam:name(a),strHomeTeamBadge:h.logo||"",strAwayTeamBadge:a.logo||"",strLeague:"NHL",strSport:"Ice Hockey",strTimestamp:g.startTimeUTC,dateEvent:g.gameDate||String(g.startTimeUTC||"").slice(0,10),strTime:g.startTimeUTC?new Date(g.startTimeUTC).toLocaleTimeString("es-DO",{timeZone:"America/Santo_Domingo",hour:"2-digit",minute:"2-digit"})+" RD":"",strStatus:live?"LIVE":done?"FINAL":state,strProgress:live&&g.periodDescriptor?.number?"P"+g.periodDescriptor.number:"",intHomeScore:live||done?h.score:null,intAwayScore:live||done?a.score:null,strTVStation:(g.tvBroadcasts||[]).map(t=>t.network).filter(Boolean).join(", "),_nhlOfficial:true};
  return [g.id,ev]
 })).values()];
 let backup=[];
 try{backup=await espnGames(offsets,"NHL")}catch(e){console.warn("NHL ESPN fallback",e)}
 const key=e=>String(e.dateEvent||"")+"|"+[e.strHomeTeam,e.strAwayTeam].filter(Boolean).map(x=>String(x).normalize("NFD").replace(/[\\u0300-\\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]/g,"")).sort().join("|");
 const seen=new Set(official.map(key));
 return [...official,...backup.filter(e=>{const k=key(e);if(seen.has(k))return false;seen.add(k);return true})];
}
const REMINDER_STORAGE_PREFIX="cx-tv-reminders-v1:";
function reminderStorageKey(){return REMINDER_STORAGE_PREFIX+String(currentUser?.id||"guest")}
function readSavedReminders(){
 try{const x=JSON.parse(localStorage.getItem(reminderStorageKey())||"[]");return Array.isArray(x)?x.filter(r=>r&&r.id&&r.startAt):[]}catch{return []}
}
function writeSavedReminders(rows){try{localStorage.setItem(reminderStorageKey(),JSON.stringify(rows))}catch(e){console.warn("No se pudo guardar el recordatorio",e)}}
function eventStartInstant(e){
 const timestamp=String(e?.strTimestamp||e?.starts_at||"");
 if(timestamp&&/[zZ]|[+-]\d{2}:?\d{2}$/.test(timestamp)){
  const d=new Date(timestamp);if(Number.isFinite(d.getTime()))return d;
 }
 const date=String(e?.dateEvent||"").slice(0,10),raw=String(e?.strTime||"");
 const m=raw.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(a\.?\s*m\.?|p\.?\s*m\.?)?/i);
 if(date&&m){
  let h=Number(m[1]);const minute=Number(m[2]),second=Number(m[3]||0),period=String(m[4]||"").toLowerCase().replace(/\s|\./g,"");
  if(period.startsWith("p")&&h<12)h+=12;if(period.startsWith("a")&&h===12)h=0;
  const d=new Date(date+"T"+String(h).padStart(2,"0")+":"+String(minute).padStart(2,"0")+":"+String(second).padStart(2,"0")+"-04:00");
  if(Number.isFinite(d.getTime()))return d;
 }
 if(timestamp){
  const normalized=/^\d{4}-\d{2}-\d{2}T/.test(timestamp)&&!/[zZ]|[+-]\d{2}:?\d{2}$/.test(timestamp)?timestamp+"-04:00":timestamp;
  const d=new Date(normalized);if(Number.isFinite(d.getTime()))return d;
 }
 return null;
}
function reminderEventId(e,start){
 const raw=String(e?.idEvent||e?.id||((e?.strEvent||"partido")+"|"+start.toISOString()));
 return raw.toLowerCase().replace(/[^a-z0-9_-]+/g,"-").slice(0,110);
}
function showReminderToast(message){
 let node=document.getElementById("reminderToast");
 if(!node){node=document.createElement("div");node.id="reminderToast";node.className="reminder-toast";node.setAttribute("role","status");document.body.appendChild(node)}
 node.textContent=message;node.classList.add("show");
 clearTimeout(node._hideTimer);node._hideTimer=setTimeout(()=>node.classList.remove("show"),4200);
}
function reminderActions(e){
 const start=eventStartInstant(e),status=String(e?.strStatus||"").toLowerCase();
 if(!start||start.getTime()<=Date.now()||/live|final|finished|completed/.test(status))return "";
 const id=reminderEventId(e,start);reminderEventIndex.set(id,e);
 const active=readSavedReminders().some(r=>r.id===id);
 return '<div class="reminder-actions"><button type="button" class="reminder-btn '+(active?"active":"")+'" data-reminder-action="toggle" data-reminder-id="'+esc(id)+'" aria-pressed="'+active+'">'+(active?"🔔 Aviso activo":"🔔 Recordarme · 5 min antes")+'</button><button type="button" class="reminder-btn calendar" data-reminder-action="calendar" data-reminder-id="'+esc(id)+'">＋ Calendario</button></div>';
}
function setupReminderInteractions(){
 if(reminderInteractionsBound)return;
 reminderInteractionsBound=true;
 document.addEventListener("click",async event=>{
  const button=event.target.closest("[data-reminder-action]");if(!button)return;
  const id=button.dataset.reminderId,match=reminderEventIndex.get(id),action=button.dataset.reminderAction;
  if(!match){showReminderToast("Actualiza la agenda y vuelve a intentarlo.");return}
  const start=eventStartInstant(match);if(!start){showReminderToast("Este partido no tiene hora de inicio disponible.");return}
  const record={id,title:match.strEvent||match.title||"Partido deportivo",startAt:start.toISOString(),league:match.strLeague||match.strSport||"Deporte",platform:match.strTVStation||match._providerName||""};
  if(action==="calendar"){downloadReminderCalendar(record);return}
  const rows=readSavedReminders(),index=rows.findIndex(r=>r.id===id);
  if(index>=0){rows.splice(index,1);writeSavedReminders(rows);button.classList.remove("active");button.setAttribute("aria-pressed","false");button.textContent="🔔 Recordarme · 5 min antes";showReminderToast("Recordatorio eliminado.");return}
  if(!("Notification" in window)){showReminderToast("Este navegador no permite notificaciones. Usa «Calendario» para recibir el aviso.");return}
  let permission=Notification.permission;
  if(permission==="default"){try{permission=await Notification.requestPermission()}catch{permission="denied"}}
  if(permission!=="granted"){showReminderToast("Activa las notificaciones del navegador o usa «Calendario».");return}
  rows.push(record);writeSavedReminders(rows);button.classList.add("active");button.setAttribute("aria-pressed","true");button.textContent="🔔 Aviso activo";
  checkScheduledReminders();showReminderToast("Te avisaremos 5 minutos antes del partido.");
 });
 document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible")checkScheduledReminders()});
 window.addEventListener("focus",checkScheduledReminders);
 if(!reminderTicker)reminderTicker=setInterval(checkScheduledReminders,15000);
 checkScheduledReminders();
}
function checkScheduledReminders(){
 if(!("Notification" in window)||Notification.permission!=="granted")return;
 const now=Date.now(),rows=readSavedReminders(),keep=[];let changed=false;
 for(const r of rows){
  const start=new Date(r.startAt).getTime();if(!Number.isFinite(start)||now>=start){changed=true;continue}
  if(!r.notified&&now>=start-5*60*1000){
   r.notified=true;changed=true;
   const title="Comienza en 5 minutos: "+r.title,body=[r.league,r.platform].filter(Boolean).join(" • ");
   const options={body,tag:r.id,data:{url:location.href}};
   const deliver=async()=>{
    try{
     if("serviceWorker" in navigator){const reg=await navigator.serviceWorker.ready;if(reg&&typeof reg.showNotification==="function"){await reg.showNotification(title,options);return}}
     new Notification(title,options);
    }catch(err){console.warn("No se pudo mostrar la notificación",err)}
   };
   deliver();
  }
  keep.push(r);
 }
 if(changed)writeSavedReminders(keep);
}
function icsEscape(value){return String(value||"").replace(/\\/g,"\\\\").replace(/;/g,"\\;").replace(/,/g,"\\,").replace(/\r?\n/g,"\\n")}
function icsUtc(date){return date.toISOString().replace(/[-:]/g,"").replace(/\.\d{3}/,"")}
function downloadReminderCalendar(record){
 const start=new Date(record.startAt);if(!Number.isFinite(start.getTime())){showReminderToast("No se pudo leer la hora del partido.");return}
 const end=new Date(start.getTime()+2*60*60*1000),now=new Date();
 const rows=["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//CodeXaStacio//TV Listing App//ES","CALSCALE:GREGORIAN","BEGIN:VEVENT","UID:"+icsEscape(record.id)+"@tv-listing-app","DTSTAMP:"+icsUtc(now),"DTSTART:"+icsUtc(start),"DTEND:"+icsUtc(end),"SUMMARY:"+icsEscape(record.title),"DESCRIPTION:"+icsEscape([record.league,record.platform].filter(Boolean).join(" • ")),"BEGIN:VALARM","TRIGGER:-PT5M","ACTION:DISPLAY","DESCRIPTION:El partido empieza en 5 minutos","END:VALARM","END:VEVENT","END:VCALENDAR"].join("\r\n");
 const blob=new Blob([rows],{type:"text/calendar;charset=utf-8"}),url=URL.createObjectURL(blob),a=document.createElement("a");
 a.href=url;a.download=(record.title||"partido").toLowerCase().replace(/[^a-z0-9]+/g,"-")+".ics";document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
 showReminderToast("Calendario descargado con aviso 5 minutos antes. Ábrelo para guardarlo.");
}
function scheduleCards(){const intro=footballLeagueSelector()+(state.sport==="Champions League"?championsIntro():"");if(!scheduleEvents.some(e=>state.sport==="Fútbol"?footballFilter(e):sportMatches(e,state.sport)))return intro+'<div class="notice">'+(state.sport==="Champions League"&&championsFeedFailed?'Fuente no disponible. Consulta el calendario oficial. ':'No hay partidos de ')+esc(state.sport)+' en este período. Prueba otro período o consulta los próximos 30 días.</div>';return intro+'<div class="schedule-list">'+scheduleEvents.filter(e=>state.sport==="Fútbol"?footballFilter(e):sportMatches(e,state.sport)).map(e=>'<article class="schedule-card searchable" data-search="'+esc(((e.strEvent||"")+" "+(e.strLeague||"")+" "+(e.strSport||"")).toLowerCase())+'">'+matchupVisual(e,true)+'<div class="schedule-info"><div class="row"><span class="badge">'+esc(leagueKey(e)||e.strSport||"DEPORTE")+'</span><span class="small muted">'+esc([e.dateEvent,e.strTime].filter(Boolean).join(" • "))+'</span></div><h3>'+esc(e.strEvent||"Evento deportivo")+'</h3>'+scoreBadge(e)+'<div class="small muted">'+esc(e.strLeague||"")+(e._managed?(e._verified?" • VERIFICADO":" • ADMIN"):"")+'</div>'+watchBadges(e)+reminderActions(e)+'</div></article>').join("")+'</div>'}

function setupScheduleAutoRefresh(){
 if(!scheduleRefreshTimer)scheduleRefreshTimer=setInterval(()=>{
  if(state.view==="schedule"&&document.visibilityState==="visible")loadSchedule(true);
 },300000);
 if(!scheduleRefreshBound){
  scheduleRefreshBound=true;
  document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible"&&state.view==="schedule")loadSchedule(true)});
  window.addEventListener("online",()=>{if(state.view==="schedule")loadSchedule(true)});
 }
}
async function loadSchedule(silent=false){
 const box=document.getElementById("scheduleDynamic");
 if(!box)return;
 const requestId=++scheduleRequestId,selected=state.sport,range=scheduleRange;
 if(!silent&&!box.querySelector(".schedule-card"))box.innerHTML='<div class="notice">Cargando agenda deportiva…</div>';
 const updated=document.getElementById("scheduleUpdated");
 if(updated)updated.textContent="Actualizando feeds…";
 const offsets=range==="today"?[0]:range==="tomorrow"?[1]:Array.from({length:range==="month"?30:7},(_,i)=>i);
 const allSports=selected==="Todos";
 const includeUcl=allSports||selected==="Fútbol"||selected==="Champions League";
 const includeMlb=allSports||selected==="MLB";
 const includeNhl=allSports||selected==="NHL";
 const espnKeys=allSports?Object.keys(ESPN_SPORT_FEEDS).filter(key=>key!=="NHL"):
  selected==="NFL"?["NFL"]:selected==="NBA"?["NBA"]:selected==="UFC/MMA"?["UFC"]:
  selected==="NCAA"?["NCAA"]:selected==="Tenis"?["TENIS"]:selected==="Fórmula 1"?["F1"]:[];
 try{
  const useSportsDb=!["Champions League","MLB","NHL"].includes(selected);
  const externalPromise=useSportsDb
   ?Promise.all(offsets.map(n=>fetch("https://www.thesportsdb.com/api/v1/json/123/eventsday.php?d="+dateKey(n)).then(r=>r.ok?r.json():null).catch(()=>null)))
   :Promise.resolve([]);
  const startDate=new Date();startDate.setHours(0,0,0,0);
  startDate.setDate(startDate.getDate()+(range==="tomorrow"?1:0));
  const endDate=new Date(startDate);endDate.setDate(endDate.getDate()+(range==="month"?30:range==="week"?7:1));
  const dbPromise=sb.from("events").select("id,provider_id,channel_id,title,sport,starts_at,region,rights_scope,verified,status").gte("starts_at",startDate.toISOString()).lt("starts_at",endDate.toISOString()).order("starts_at");
  const [rs,db,mlb,nhl,ucl,espn]=await Promise.all([
   externalPromise,
   dbPromise,
   includeMlb?mlbGames(offsets).catch(e=>{console.warn("MLB feed",e);return []}):Promise.resolve([]),
   includeNhl?nhlGames(offsets).catch(e=>{console.warn("NHL feed",e);return []}):Promise.resolve([]),
   includeUcl?championsGames(offsets):Promise.resolve([]),
   Promise.all(espnKeys.map(key=>espnGames(offsets,key))).then(groups=>groups.flat())
  ]);
  if(requestId!==scheduleRequestId||state.view!=="schedule"||state.sport!==selected||scheduleRange!==range)return;
  const managed=(db.data||[]).map(x=>{
   const d=x.starts_at?new Date(x.starts_at):null;
   return {strEvent:x.title,strSport:x.sport||"Sports",strTimestamp:x.starts_at,dateEvent:d?d.toISOString().slice(0,10):"",strTime:d?d.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}):"",strLeague:x.region||x.rights_scope||"",_managed:true,_verified:!!x.verified,_providerName:providers.find(p=>String(p.id)===String(x.provider_id))?.name||"",_channelName:channels.find(ch=>String(ch.id)===String(x.channel_id))?.name||""};
  });
  const external=rs.flatMap(x=>x?.events||[]).filter(e=>e.strEvent)
   .filter(e=>!sportMatches(e,"MLB")&&!sportMatches(e,"NHL")&&!(ucl.length&&isChampionsLeague(e)));
  const espnMatchKey=e=>{
   const date=String(e.dateEvent||"");
   const sides=[e.strHomeTeam,e.strAwayTeam].filter(Boolean).map(x=>String(x).toLowerCase().replace(/[^a-z0-9]/g,"")).sort();
   return date+"|"+(sides.length===2?sides.join("|"):String(e.strEvent||"").toLowerCase().replace(/[^a-z0-9]/g,""));
  };
  const primaryIds=new Set(espn.map(espnMatchKey));
  const fallback=external.filter(e=>{
   if(!espnKeys.length)return true;
   const label=String(e.strEvent||"").toLowerCase().replace(/[^a-z0-9]/g,"");
   return !primaryIds.has(espnMatchKey(e))&&!primaryIds.has(String(e.dateEvent||"")+"|"+label);
  });
  scheduleEvents=[...managed,...fallback,...mlb,...nhl,...ucl,...espn]
   .sort((a,b)=>String(a.strTimestamp||a.dateEvent||"").localeCompare(String(b.strTimestamp||b.dateEvent||"")))
   .slice(0,600);
  const target=document.getElementById("scheduleDynamic");
  if(target){
   target.innerHTML=scheduleCards();
   const fl=document.getElementById("footballLeague");
   if(fl)fl.onchange=()=>{
    footballLeague=fl.value;
    const node=document.getElementById("scheduleDynamic");
    if(node)node.innerHTML=scheduleCards();
    const next=document.getElementById("footballLeague");
    if(next)next.onchange=fl.onchange;
   };
  }
  if(updated)updated.textContent="Actualizado "+new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"});
 }catch(e){
  if(requestId!==scheduleRequestId)return;
  if(!silent||!scheduleEvents.length)box.innerHTML='<div class="danger">No fue posible cargar la programación en este momento.</div>';
  if(updated)updated.textContent=scheduleEvents.length?"Se muestran los últimos datos disponibles":"Sin conexión al feed";
 }
}

function heroSlider(){return `<section class="sports-slider"><button id="slidePrev" class="slide-btn prev" aria-label="Anterior">‹</button><div id="sportsHero" class="hero-slide"><div class="hero-overlay"><span class="badge">SPORTS</span><h1>Próximos eventos deportivos</h1><p>Cargando programación…</p></div></div><button id="slideNext" class="slide-btn next" aria-label="Siguiente">›</button></section>`}
function content(){
 const filteredChannels=state.sport==="Todos"?channels:channels.filter(c=>c.sports.includes(state.sport));
 const filteredEvents=state.sport==="Todos"?events:events.filter(e=>e.sport===state.sport);
 if(state.view==="schedule"&&!canView("schedule"))return '<div class="access-denied"><h2>Programación restringida</h2><p class="muted">Tu cuenta no tiene acceso a esta sección.</p></div>';
 if(state.view==="channels"&&!canView("channels"))return '<div class="access-denied"><h2>Canales restringidos</h2><p class="muted">Tu cuenta no tiene acceso a esta sección.</p></div>';
 if(state.view==="leagues"&&!canView("leagues"))return '<div class="access-denied"><h2>Ligas restringidas</h2><p class="muted">Tu cuenta no tiene acceso a esta sección.</p></div>';
 if(state.view==="install")return installPanel(); if(state.view==="schedule")return '<div class="top"><div><h2>'+(state.sport==="Todos"?"Programación deportiva":"Programación • "+esc(state.sport))+'</h2><p class="muted">Partidos de la categoría seleccionada. Se actualizan automáticamente cada 5 minutos. <span id="scheduleUpdated" aria-live="polite"></span></p></div><input id="search" class="input" style="max-width:340px" placeholder="Buscar partido, liga o deporte…"></div>'+chips()+scheduleControls()+'<div id="scheduleDynamic"><div class="notice">Cargando agenda deportiva…</div></div>';
 if(state.view==="channels")return '<h2>Canales DISH</h2><p class="muted">Canales deportivos destacados en 110°W / 119°W.</p>'+chips()+channelCards(filteredChannels);
 if(state.view==="leagues")return '<h2>Ligas y deportes</h2><p class="muted">Accesos rápidos a la programación.</p>'+chips()+eventCards(filteredEvents);
 const finder=currentProfile?.can_search===false?'<div class="finder"><div><h2>Encuentra <span>tus deportes</span></h2><p class="muted">La búsqueda está restringida para esta cuenta.</p></div></div>':'<div class="finder"><div><h2>Encuentra <span>tus deportes</span></h2><p class="muted">Busca canales, deportes y plataformas</p></div><div class="finder-search"><input id="search" class="input" placeholder="Buscar partidos, canales, deportes o plataformas…"></div></div>';
 const providerSection=canView("providers")?'<h2>Plataformas digitales</h2>'+providerCards():"";
 const channelSection=canView("channels")?'<div class="section-title"><h2>Canales destacados</h2><span class="small muted">Ahora y próximos deportes</span></div>'+channelFilters()+channelCards(filteredChannels):"";
 return heroSlider()+finder+chips()+providerSection+channelSection
}

function mobileNav(){
 const items=[["home","⌂","Inicio"],["schedule","◷","Agenda"],["channels","▦","Canales"],["leagues","◆","Ligas"],["install","↓","Instalar"],["account","◎","Cuenta"]].filter(([v])=>v==="home"||v==="account"||v==="install"||canView(v));
 return '<nav class="mobile-nav" aria-label="Navegación móvil">'+items.map(x=>'<button data-view="'+x[0]+'" class="'+(state.view===x[0]?"active":"")+'"><i>'+x[1]+'</i><span>'+x[2]+'</span></button>').join("")+'</nav>'
}

function dashboard(){
 if(!currentUser){login();return}
 if(!canView(state.view))state.view="home";
 const accountLabel=currentProfile?.username||"Mi cuenta";
 app.innerHTML='<main class="wrap"><header class="top app-head"><div class="cx-logo"><span class="cx-symbol">CX</span><span class="cx-word"><span>Code<b>X</b>aStacio</span><small>TV GUIDE</small></span></div><div class="head-slogan" aria-label="Todo el deporte. Una sola guía."><strong>Todo el deporte.</strong><span>Una sola guía.</span></div><div class="account-menu-wrap"><button id="account" class="btn primary" aria-haspopup="true" aria-expanded="false">Mi cuenta ▾</button><div id="accountMenu" class="account-menu hidden"><div class="account-menu-user"><strong>'+esc(accountLabel)+'</strong><small>'+esc(currentUser.email||"")+'</small></div><button id="menuProfile">⚙ Mi perfil</button>'+(currentProfile?.role==="admin"?'<button id="menuAdmin">◆ Control Center</button>':"")+'<button id="menuLogout">↪ Cerrar sesión</button></div></div></header>'+nav()+'<section class="panel">'+content()+'</section>'+mobileNav()+'<footer class="footer">TV Listing App • CodeXaStacio • v65 • Sports</footer><a class="whatsapp-float" href="https://wa.me/18097777117?text=Hola%2C%20necesito%20mas%20informacion%21" target="_blank" rel="noopener" aria-label="WhatsApp">WA<span>Hola, necesito más información!</span></a></main>';
 bind();
}

function bind(){
 setupReminderInteractions();
 const accountBtn=document.getElementById("account"),menu=document.getElementById("accountMenu");
 if(accountBtn&&menu){accountBtn.onclick=e=>{e.stopPropagation();menu.classList.toggle("hidden");accountBtn.setAttribute("aria-expanded",String(!menu.classList.contains("hidden")))};menu.onclick=e=>e.stopPropagation();setTimeout(()=>document.addEventListener("click",()=>{menu.classList.add("hidden");accountBtn.setAttribute("aria-expanded","false")},{once:true}),0)}
 const profileBtn=document.getElementById("menuProfile");if(profileBtn)profileBtn.onclick=accountPanel;
 const installBtn=document.getElementById("installAppButton");if(installBtn)installBtn.onclick=installTvListingApp; const logoutBtn=document.getElementById("menuLogout");if(logoutBtn)logoutBtn.onclick=logout;
 const ma=document.getElementById("menuAdmin");if(ma)ma.onclick=adminControlCenter;
 document.querySelectorAll("[data-view]").forEach(b=>b.onclick=()=>{if(b.dataset.view==="account")return accountPanel();if(!canView(b.dataset.view))return;state.view=b.dataset.view;dashboard()});
 document.querySelectorAll("[data-sport]").forEach(b=>b.onclick=()=>{
   const wasSchedule=state.view==="schedule";
   state.sport=b.dataset.sport;
   if(state.sport==="Fútbol")footballLeague="Todas";
   if(canView("schedule")){
    state.view="schedule";
    if(state.sport==="Champions League")scheduleRange="month";
    else if(!wasSchedule)scheduleRange=state.sport==="Todos"?"week":"month";
   }
   dashboard();
  });
 const fl=document.getElementById("footballLeague");if(fl)fl.onchange=()=>{footballLeague=fl.value;const box=document.getElementById("scheduleDynamic");if(box)box.innerHTML=scheduleCards()};
 document.querySelectorAll("[data-channel-filter]").forEach(b=>b.onclick=()=>{channelFilter=b.dataset.channelFilter;dashboard()});
 document.querySelectorAll("[data-range]").forEach(b=>b.onclick=()=>{scheduleRange=b.dataset.range;dashboard()});
  document.querySelectorAll("[data-ucl-open]").forEach(b=>b.onclick=()=>{state.view="schedule";state.sport="Champions League";scheduleRange="month";dashboard()});
 if(state.view==="schedule"&&canView("schedule")){setupScheduleAutoRefresh();loadSchedule();}
 setupSlider();
 const q=document.getElementById("search");if(q)q.oninput=()=>document.querySelectorAll(".searchable").forEach(x=>x.classList.toggle("hidden",!x.dataset.search.includes(q.value.toLowerCase())));
}

function isNetflixNflEvent(e){
 const sport=String([e?.strSport,e?.strLeague].join(" ")).toLowerCase();
 const game=String([e?.strHomeTeam,e?.strAwayTeam,e?.strEvent].join(" ")).toLowerCase();
 const date=String(e?.dateEvent||e?.strTimestamp||"").slice(0,10);
 if(!/nfl|american football/.test(sport))return false;
 if(/netflix/i.test(String(e?.strTVStation||e?.strChannel||"")))return true;
 return (date==="2026-11-25"&&/packers/.test(game)&&/rams/.test(game))||
  (date==="2026-12-25"&&((/packers/.test(game)&&/bears/.test(game))||(/bills/.test(game)&&/broncos/.test(game))));
}
function demoWhereToWatch(e){
 const sport=(e.strSport||"").toLowerCase(),league=(e.strLeague||"").toLowerCase(),name=(e.strEvent||"").toLowerCase();
 if(isNetflixNflEvent(e))return [{name:"Netflix",label:"NFL en vivo"}];
 const out=[];
 const add=(name,label)=>{if(!out.some(x=>x.name===name))out.push({name,label})};
 if(/american football|basketball|baseball|ice hockey|tennis/.test(sport))add("DISH","Canales deportivos");
 if(/american football|basketball|ice hockey|tennis/.test(sport))add("Disney+","ESPN / deportes");
 if(/boxing|fighting|mma|soccer/.test(sport)||/nfl/.test(league))add("DAZN","Deportes");
 if(/soccer/.test(sport)||/uefa|champions|europa|cbs/.test(league+" "+name))add("Paramount+","Fútbol / CBS Sports");
 if(/boxing|wrestling/.test(sport)||/special|exhibition/.test(name))add("Netflix","Eventos especiales");
 if(!out.length)add("DISH","Consultar programación");
 return out.slice(0,3);
}
function streamPlatform(value){
 const name=String(value||"").trim();
 if(!name)return "";
 if(/dazn/i.test(name))return "DAZN";
 if(/netflix/i.test(name))return "Netflix";
 if(/paramount\+?/i.test(name))return "Paramount+";
 if(/disney\s*\+?/i.test(name))return "Disney+ Premium";
 if(/espn/i.test(name))return "Disney+ Premium";
 return "";
}
function watchBadges(e){
 if(isChampionsLeague(e))return championsWatch(e);
 const sourceValues=[...(Array.isArray(e._watchOptions)?e._watchOptions:[]),e._providerName,e.strTVStation,e.strChannel,e.strBroadcast].filter(Boolean).flatMap(x=>String(x).split(/[,;|]/).map(y=>y.trim()).filter(Boolean));
 const platforms=[...new Set(sourceValues.map(streamPlatform).filter(Boolean))];
 const rows=platforms.map(name=>({name,label:name==="Disney+ Premium"?"ESPN en streaming · revisar programación local":"Streaming"}));
 const dishChannel=e._channelName;
 if(dishChannel)rows.push({name:dishChannel,label:"Canal registrado en DISH"});
 const knownNetworks=[...new Set(sourceValues.filter(x=>!streamPlatform(x)))];
 if(!dishChannel)knownNetworks.forEach(name=>rows.push({name,label:e._espn?"Señal ESPN · streaming según disponibilidad local":"Señal indicada por la fuente"}));
 if(e._providerName&&!streamPlatform(e._providerName)&&!/^dish$/i.test(e._providerName))rows.push({name:e._providerName,label:"Plataforma registrada"});
 const list=[...new Map(rows.map(x=>[x.name.toLowerCase(),x])).values()];
 return '<div class="watch-row"><span class="small muted">📺 Dónde verlo / streaming:</span>'+(list.length?list.map(x=>'<span class="watch-pill">'+esc(x.name)+' <small>'+esc(x.label)+'</small></span>').join(""):'<span class="watch-pill watch-unverified">Plataforma de streaming pendiente de confirmar</span>')+'</div>';
}

function setupSlider(){
 const hero=document.getElementById("sportsHero");if(!hero)return;
 const prev=document.getElementById("slidePrev"),next=document.getElementById("slideNext");
 if(prev)prev.onclick=()=>showSlide(-1);if(next)next.onclick=()=>showSlide(1);
 if(!sliderRefreshTimer)sliderRefreshTimer=setInterval(()=>{if(document.visibilityState==="visible"&&document.getElementById("sportsHero"))loadSportsSlider(true)},300000);
 if(!sliderVisibilityBound){
  sliderVisibilityBound=true;
  document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible"&&document.getElementById("sportsHero")&&(sliderLoadedDay!==dateKey(0)||Date.now()-sliderLastRefresh>300000))loadSportsSlider(true)});
  window.addEventListener("online",()=>{if(document.getElementById("sportsHero"))loadSportsSlider(true)});
 }
 loadSportsSlider(false);
}
function showSlide(step=0){
 const hero=document.getElementById("sportsHero");if(!hero)return;
 if(!sliderEvents.length){
  hero.className="hero-slide";hero.style.backgroundImage="";
  hero.innerHTML='<div class="hero-overlay"><span class="badge">HOY • '+esc(dateKey(0))+'</span><h1>Sin eventos deportivos para hoy</h1><p>La agenda se renueva automáticamente con los eventos del día.</p></div>';
  return;
 }
 slideIndex=(slideIndex+step+sliderEvents.length)%sliderEvents.length;
 const e=sliderEvents[slideIndex],img=e.strThumb||e.strPoster||e.strFanart||"",key=leagueKey(e),feed=officialScheduleLink(e);
 hero.className="hero-slide "+(key?"feed-"+key.toLowerCase():"")+(img?"":" hero-fallback");
 hero.style.backgroundImage=img?'linear-gradient(90deg,rgba(2,8,20,.96),rgba(2,8,20,.40) 48%,rgba(2,8,20,.12)),url("'+esc(img)+'")':"";
 hero.innerHTML=(img?"":sportArtwork(e,"hero"))+'<div class="hero-overlay">'+matchupVisual(e)+scoreBadge(e)+'<span class="badge">HOY • '+esc(key||e.strSport||"DEPORTE")+'</span><h1>'+esc(e.strEvent||e.title||"Evento deportivo de hoy")+'</h1><p>'+esc([e.dateEvent,e.strTime,e.strLeague].filter(Boolean).join(" • "))+'</p>'+watchBadges(e)+reminderActions(e)+(feed?'<a class="google-feed-btn" href="'+esc(feed)+'" target="_blank" rel="noopener">Calendario oficial '+esc(key)+' ↗</a>':"")+'</div>';
}
function sliderLocalDate(e){
 if(!e?.strTimestamp)return String(e?.dateEvent||"").slice(0,10);
 const d=new Date(e.strTimestamp);if(!Number.isFinite(d.getTime()))return String(e.dateEvent||"").slice(0,10);
 return new Intl.DateTimeFormat("en-CA",{timeZone:"America/Santo_Domingo"}).format(d);
}
function sliderEventKey(e){
 const clean=x=>String(x||"").normalize("NFD").replace(/[\\u0300-\\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]/g,"");
 const league=leagueKey(e)||String(e.strLeague||e.strSport||"").toLowerCase();
 const teams=[e.strHomeTeam,e.strAwayTeam].filter(Boolean).map(clean).sort();
 return sliderLocalDate(e)+"|"+league+"|"+(teams.length===2?teams.join("|"):clean(e.strEvent));
}
async function loadSportsSlider(force=false){
 const today=dateKey(0);
 if(sliderLoading||(!force&&sliderLoadedDay===today&&Date.now()-sliderLastRefresh<300000))return;
 sliderLoading=true;
 try{
  const keys=Object.keys(ESPN_SPORT_FEEDS).filter(k=>k!=="NHL");
  const [general,mlb,nhl,ucl,espn]=await Promise.all([
   fetch("https://www.thesportsdb.com/api/v1/json/123/eventsday.php?d="+today,{signal:AbortSignal.timeout(12000)}).then(r=>r.ok?r.json():null).then(x=>x?.events||[]).catch(e=>{console.warn("Sports day feed",e);return []}),
   mlbGames([0]).catch(e=>{console.warn("MLB day feed",e);return []}),
   nhlGames([0]).catch(e=>{console.warn("NHL day feed",e);return []}),
   championsGames([0]).catch(e=>{console.warn("UCL day feed",e);return []}),
   Promise.all(keys.map(k=>espnGames([0],k).catch(e=>{console.warn("ESPN day feed "+k,e);return []}))).then(rows=>rows.flat())
  ]);
  const events=[...general,...mlb,...nhl,...ucl,...espn].filter(e=>e?.strEvent&&sliderLocalDate(e)===today);
  const seen=new Set();
  sliderEvents=events.filter(e=>{const k=sliderEventKey(e);if(seen.has(k))return false;seen.add(k);return true})
   .sort((a,b)=>String(a.strTimestamp||a.dateEvent||"").localeCompare(String(b.strTimestamp||b.dateEvent||""))).slice(0,36);
  slideIndex=0;sliderLoadedDay=today;sliderLastRefresh=Date.now();
  showSlide();renderProviders();dashboardChannelRefresh();
  if(!sliderTimer)sliderTimer=setInterval(()=>{if(document.getElementById("sportsHero"))showSlide(1)},6500);
 }catch(e){console.warn("Sports day slider unavailable",e);showSlide()}
 finally{sliderLoading=false}
}
function dashboardChannelRefresh(){const grids=document.querySelectorAll(".channel-showcase");if(!grids.length)return;const filtered=state.sport==="Todos"?channels:channels.filter(c=>c.sports.includes(state.sport));grids.forEach(g=>g.outerHTML=channelCards(filtered))}
function withTimeout(p,ms=12000){return Promise.race([p,new Promise((_,reject)=>setTimeout(()=>reject(new Error("Tiempo de espera agotado. Intenta nuevamente.")),ms))])}
async function openSession(user){currentUser=user;try{const {data:p}=await withTimeout(sb.from("profiles").select("role,status,full_name,username,email,phone,can_search,can_view_schedule,can_view_channels,can_view_leagues,can_view_providers").eq("id",user.id).maybeSingle(),7000);currentProfile=p||null;if(p?.status==="blocked"){await sb.auth.signOut();currentUser=null;currentProfile=null;return login("Tu cuenta está restringida. Contacta al administrador.")}}catch(e){console.warn("Profile lookup:",e)}try{await loadManagedContent()}catch(e){console.warn("Managed content:",e)}dashboard()}

function login(notice=""){
 app.innerHTML='<main class="wrap"><section class="panel login"><div class="login-hero"><div class="cx-emblem">CX</div><div class="cx-login-title">Code<span>X</span>aStacio</div><div class="cx-login-sub">TV GUIDE</div><div class="cx-login-tags">SPORTS • MOVIES • SERIES • LIVE TV</div></div><h2>Bienvenido</h2><p class="muted">Inicia sesión para continuar</p><form id="login"><input id="identity" class="input" placeholder="Usuario o correo" autocomplete="username" required><br><br><input id="pw" class="input" type="password" placeholder="Contraseña" autocomplete="current-password" required><label class="small muted" style="display:flex;align-items:center;gap:8px;margin-top:9px"><input id="showPw" type="checkbox"> Mostrar contraseña</label><br><button id="loginBtn" class="btn primary" style="width:100%">Entrar</button></form><div class="login-actions"><button id="forgot" type="button" class="link-btn">¿Olvidaste tu contraseña?</button></div><div id="msg" class="small muted" style="margin-top:12px"></div></section></main>';
 const msg=document.getElementById("msg");msg.className=notice?"danger small":"small muted";msg.textContent=notice|| (sb?"Servicio de cuenta conectado.":"Conectando servicio de cuenta…");
 document.getElementById("showPw").onchange=e=>{document.getElementById("pw").type=e.target.checked?"text":"password"};
 document.getElementById("forgot").onclick=()=>{const identity=document.getElementById("identity").value.trim()||prompt("Escribe tu usuario o correo electrónico para solicitar ayuda:");if(!identity)return;const message="Hola, Super Admin de CodeXaStacio TV Guide. Solicito restablecer la contraseña de mi cuenta. Usuario o correo: "+identity+". Por favor, verifica mi identidad y ayúdame a recuperar el acceso. No compartiré contraseñas por WhatsApp.";window.open("https://wa.me/18097777117?text="+encodeURIComponent(message),"_blank","noopener,noreferrer");msg.className="small muted";msg.textContent="Se abrió WhatsApp con tu solicitud preparada. Pulsa Enviar para comunicarte con el administrador."};
 document.getElementById("login").onsubmit=async e=>{e.preventDefault();const btn=document.getElementById("loginBtn");if(!sb){msg.className="danger small";msg.textContent="El servicio de cuenta todavía está conectando. Intenta de nuevo en unos segundos.";return}const identity=document.getElementById("identity").value.trim(),password=document.getElementById("pw").value;btn.disabled=true;btn.textContent="Entrando…";msg.className="small muted";msg.textContent="Verificando credenciales…";try{let data=null,error=null;if(identity.includes("@"))({data,error}=await withTimeout(sb.auth.signInWithPassword({email:identity,password})));else{const r=await withTimeout(fetch(CFG.url+"/functions/v1/username-login",{method:"POST",headers:{"Content-Type":"application/json","apikey":CFG.key},body:JSON.stringify({username:identity,password})}));const j=await r.json();if(!r.ok)throw new Error(j.error||"Usuario o contraseña incorrectos");const res=await withTimeout(sb.auth.setSession({access_token:j.access_token,refresh_token:j.refresh_token}));data=res.data;error=res.error}if(error)throw error;const user=data?.user||data?.session?.user||(await withTimeout(sb.auth.getUser(),7000)).data?.user;if(!user)throw new Error("No se pudo validar la sesión.");msg.className="ok small";msg.textContent="Acceso correcto. Abriendo guía…";await openSession(user)}catch(err){msg.className="danger small";msg.textContent=err?.message||"No fue posible iniciar sesión.";btn.disabled=false;btn.textContent="Entrar"}}
}

async function logout(){if(sliderTimer)clearInterval(sliderTimer);if(sb)await sb.auth.signOut();currentUser=null;currentProfile=null;login()}

function accountPanel(){
 const p=currentProfile||{};
 app.innerHTML='<main class="wrap"><header class="top"><div class="cx-logo"><span class="cx-symbol">CX</span><span class="cx-word"><span>Mi cuenta</span><small>CODEXASTACIO</small></span></div><button id="backGuide" class="btn">Volver</button></header><section class="panel account-panel"><h2>Configuración de cuenta</h2><div class="account-grid"><article class="card"><span class="muted small">Usuario</span><h3>'+esc(p.username||currentUser?.email||"Cuenta")+'</h3><p class="muted">'+esc(currentUser?.email||p.email||"")+'</p></article><article class="card"><span class="muted small">Estado</span><h3>'+(p.status==="active"?"Activa":"Restringida")+'</h3><p class="muted">Búsqueda: '+(p.can_search===false?"Restringida":"Permitida")+'</p></article></div><div class="profile-edit"><h3>Datos personales</h3><div class="form-grid"><input id="myName" class="input" placeholder="Nombre" value="'+esc(p.full_name||"")+'"><input id="myUser" class="input" placeholder="Usuario" value="'+esc(p.username||"")+'"><input id="myEmail" class="input" type="email" placeholder="Correo" value="'+esc(currentUser?.email||p.email||"")+'"><input id="myPhone" class="input" placeholder="Teléfono" value="'+esc(p.phone||"")+'"></div><button id="saveProfile" class="btn primary">Guardar cambios</button></div><div class="account-actions"><button id="changePw" class="btn">Cambiar contraseña</button>'+(p.role==="admin"?'<button id="adminUsers" class="btn">◆ Control Center</button>':"")+'<button id="logoutAccount" class="btn">Cerrar sesión</button></div><div id="accountMsg" class="small muted"></div></section></main>';
 document.getElementById("backGuide").onclick=dashboard;document.getElementById("logoutAccount").onclick=logout;
 document.getElementById("saveProfile").onclick=async()=>{const m=document.getElementById("accountMsg"),payload={full_name:document.getElementById("myName").value.trim(),username:document.getElementById("myUser").value.trim(),email:document.getElementById("myEmail").value.trim(),phone:document.getElementById("myPhone").value.trim()};try{m.className="small muted";m.textContent="Guardando…";if(currentProfile?.role==="admin")await adminAction({action:"profile",user_id:currentUser.id,...payload});else{const {data:{session}}=await sb.auth.getSession();const rr=await fetch(CFG.url+"/functions/v1/account-profile",{method:"POST",headers:{"Content-Type":"application/json","apikey":CFG.key,"Authorization":"Bearer "+session.access_token},body:JSON.stringify(payload)});const j=await rr.json();if(!rr.ok)throw new Error(j.error||"No se pudo actualizar el perfil")}const {data:fresh}=await sb.from("profiles").select("role,status,full_name,username,email,phone,can_search,can_view_schedule,can_view_channels,can_view_leagues,can_view_providers").eq("id",currentUser.id).maybeSingle();if(fresh)currentProfile=fresh;m.className="ok small";m.textContent="Datos actualizados correctamente."}catch(e){m.className="danger small";m.textContent=e.message}};
 document.getElementById("changePw").onclick=async()=>{const pw=prompt("Nueva contraseña (mínimo 8 caracteres):");if(!pw||pw.length<8)return;const {error}=await sb.auth.updateUser({password:pw});const m=document.getElementById("accountMsg");m.className=error?"danger small":"ok small";m.textContent=error?error.message:"Contraseña actualizada."};
 const au=document.getElementById("adminUsers");if(au)au.onclick=adminControlCenter
}

function adminControlCenter(){
 app.innerHTML='<main class="wrap admin-shell"><header class="top admin-head"><div><div class="brand">CodeXaStacio Control Center</div><div class="small muted">Administración total de usuarios, contenido y permisos</div></div><button id="adminBack" class="btn">Volver a la guía</button></header><nav class="admin-main-tabs"><button data-admin-tab="users" class="active">Usuarios</button><button data-admin-tab="platforms">Plataformas</button><button data-admin-tab="channels">Canales</button><button data-admin-tab="schedule">Programación</button><button data-admin-tab="logs">Actividad</button></nav><section id="adminWorkspace" class="panel"><div class="notice">Cargando…</div></section><div id="adminModal"></div></main>';
 document.getElementById("adminBack").onclick=dashboard;
 document.querySelectorAll("[data-admin-tab]").forEach(b=>b.onclick=()=>{document.querySelectorAll("[data-admin-tab]").forEach(x=>x.classList.remove("active"));b.classList.add("active");const tab=b.dataset.adminTab;if(tab==="users")adminUsersWorkspace();else if(tab==="platforms")adminPlatformsWorkspace();else if(tab==="channels")adminChannelsWorkspace();else if(tab==="schedule")adminScheduleWorkspace();else adminLogsWorkspace()});
 adminUsersWorkspace()
}

async function adminUsersWorkspace(){
 const w=document.getElementById("adminWorkspace");if(!w)return;
 w.innerHTML='<div class="notice">Cargando usuarios…</div>';
 try{
  const r=await adminAction({action:"list"}),data=r.users||[];
  w.innerHTML='<div class="admin-stats"><article><b>'+data.length+'</b><span>Usuarios</span></article><article><b>'+data.filter(u=>u.status==="active").length+'</b><span>Activos</span></article><article><b>'+data.filter(u=>u.status!=="active").length+'</b><span>Bloqueados</span></article><article><b>'+data.filter(u=>!u.can_search).length+'</b><span>Restringidos</span></article></div><div class="admin-toolbar"><button id="ccNewUser" class="btn primary">+ Nuevo usuario</button><input id="ccSearch" class="input" placeholder="Buscar usuario, nombre o correo…"></div><div id="ccCreate" class="card create-user hidden"><h3>Crear usuario</h3><div class="form-grid"><input id="ccName" class="input" placeholder="Nombre"><input id="ccUser" class="input" placeholder="Usuario"><input id="ccEmail" class="input" type="email" placeholder="Correo"><input id="ccPhone" class="input" placeholder="Teléfono"><input id="ccPw" class="input" type="password" placeholder="Contraseña temporal (8+)"></div><button id="ccCreateBtn" class="btn primary">Crear cuenta</button></div><div class="admin-users">'+(data.map(u=>'<article class="admin-user card" data-admin-search="'+esc(((u.username||"")+" "+(u.full_name||"")+" "+(u.email||"")).toLowerCase())+'"><div class="user-main"><div class="user-avatar">'+esc((u.username||u.email||"U")[0].toUpperCase())+'</div><div><strong>'+esc(u.username||u.full_name||u.email||"Usuario")+'</strong><div class="small muted">'+esc(u.email||"")+' • '+esc(u.role||"user")+'</div><div class="user-meta"><span>'+(u.status==="active"?"● Activo":"● Bloqueado")+'</span><span>'+(u.last_sign_in_at?safeDateTime(u.last_sign_in_at):"Sin acceso")+'</span></div></div></div><div class="user-actions">'+(u.id===currentUser.id?'<span class="badge">SUPER ADMIN</span>':'<button class="btn" data-edit-user="'+u.id+'">Editar</button><button class="btn" data-perms-user="'+u.id+'">Permisos</button><button class="btn" data-services-user="'+u.id+'">Plataformas</button><button class="btn" data-status="'+u.id+'" data-next="'+(u.status==="active"?"blocked":"active")+'">'+(u.status==="active"?"Bloquear":"Activar")+'</button><button class="btn" data-password-user="'+u.id+'">Contraseña</button><button class="btn danger-btn" data-delete-user="'+u.id+'">Eliminar</button>')+'</div></article>').join("")||'<div class="notice">No hay usuarios.</div>')+'</div>';
  document.getElementById("ccNewUser").onclick=()=>document.getElementById("ccCreate").classList.toggle("hidden");
  document.getElementById("ccCreateBtn").onclick=async()=>{try{await adminAction({action:"create",full_name:document.getElementById("ccName").value.trim(),username:document.getElementById("ccUser").value.trim(),email:document.getElementById("ccEmail").value.trim(),phone:document.getElementById("ccPhone").value.trim(),password:document.getElementById("ccPw").value});adminUsersWorkspace()}catch(e){alert(e.message)}};
  document.getElementById("ccSearch").oninput=e=>document.querySelectorAll("[data-admin-search]").forEach(x=>x.classList.toggle("hidden",!x.dataset.adminSearch.includes(e.target.value.toLowerCase())));
  document.querySelectorAll("[data-edit-user]").forEach(b=>b.onclick=()=>adminEditUser(data.find(x=>x.id===b.dataset.editUser)));
  document.querySelectorAll("[data-perms-user]").forEach(b=>b.onclick=()=>adminPermissionsUser(data.find(x=>x.id===b.dataset.permsUser)));
  document.querySelectorAll("[data-services-user]").forEach(b=>b.onclick=()=>adminServicesUser(data.find(x=>x.id===b.dataset.servicesUser)));
  bindAdminUsers()
 }catch(e){w.innerHTML='<div class="danger">'+esc(e.message)+'</div>'}
}


function showAdminModal(html){const host=document.getElementById("adminModal");if(!host)return;host.innerHTML='<div class="modal-backdrop"><div class="admin-modal">'+html+'</div></div>';host.querySelector(".modal-backdrop").onclick=e=>{if(e.target===e.currentTarget)closeAdminModal()}}
function closeAdminModal(){const host=document.getElementById("adminModal");if(host)host.innerHTML=""}
function adminEditUser(u){
 if(!u)return;
 showAdminModal('<div class="modal-head"><h3>Editar usuario</h3><button id="modalClose" class="btn">×</button></div><div class="form-grid"><input id="euName" class="input" placeholder="Nombre" value="'+esc(u.full_name||"")+'"><input id="euUser" class="input" placeholder="Usuario" value="'+esc(u.username||"")+'"><input id="euEmail" class="input" type="email" placeholder="Correo" value="'+esc(u.email||"")+'"><input id="euPhone" class="input" placeholder="Teléfono" value="'+esc(u.phone||"")+'"></div><button id="euSave" class="btn primary">Guardar cambios</button><div id="euMsg" class="small muted"></div>');
 document.getElementById("modalClose").onclick=closeAdminModal;
 document.getElementById("euSave").onclick=async()=>{const m=document.getElementById("euMsg");try{m.textContent="Guardando…";await adminAction({action:"profile",user_id:u.id,full_name:document.getElementById("euName").value.trim(),username:document.getElementById("euUser").value.trim(),email:document.getElementById("euEmail").value.trim(),phone:document.getElementById("euPhone").value.trim()});closeAdminModal();adminUsersWorkspace()}catch(e){m.className="danger small";m.textContent=e.message}}
}
function adminPermissionsUser(u){
 if(!u)return;
 const perms=[["can_search","Buscar"],["can_view_schedule","Programación"],["can_view_channels","Canales"],["can_view_leagues","Ligas"],["can_view_providers","Plataformas"]];
 showAdminModal('<div class="modal-head"><h3>Permisos • '+esc(u.username||u.email)+'</h3><button id="modalClose" class="btn">×</button></div><div class="permission-grid">'+perms.map(([k,label])=>'<label><span>'+label+'</span><input type="checkbox" data-permission="'+k+'" '+(u[k]!==false?"checked":"")+'></label>').join("")+'</div><p class="small muted">Los cambios se aplican al próximo renderizado o inicio de sesión.</p>');
 document.getElementById("modalClose").onclick=closeAdminModal;
 document.querySelectorAll("[data-permission]").forEach(input=>input.onchange=async()=>{try{await adminAction({action:"permissions",user_id:u.id,[input.dataset.permission]:input.checked})}catch(e){input.checked=!input.checked;alert(e.message)}})
}
async function adminServicesUser(u){
 if(!u)return;
 showAdminModal('<div class="notice">Cargando plataformas…</div>');
 try{
  const r=await adminAction({action:"services",user_id:u.id}),map=new Map((r.services||[]).map(x=>[String(x.provider_id),x.enabled]));
  showAdminModal('<div class="modal-head"><h3>Plataformas • '+esc(u.username||u.email)+'</h3><button id="modalClose" class="btn">×</button></div><div class="permission-grid">'+(r.providers||[]).map(p=>'<label><span>'+esc(p.name)+(p.is_base?' <small class="badge">BASE</small>':"")+'</span><input type="checkbox" data-service-provider="'+p.id+'" '+(p.is_base||map.get(String(p.id))?"checked":"")+' '+(p.is_base?"disabled":"")+'></label>').join("")+'</div>');
  document.getElementById("modalClose").onclick=closeAdminModal;
  document.querySelectorAll("[data-service-provider]").forEach(input=>input.onchange=async()=>{try{await adminAction({action:"service",user_id:u.id,provider_id:Number(input.dataset.serviceProvider),enabled:input.checked})}catch(e){input.checked=!input.checked;alert(e.message)}})
 }catch(e){showAdminModal('<div class="danger">'+esc(e.message)+'</div>')}
}
async function adminPlatformsWorkspace(){
 const w=document.getElementById("adminWorkspace");w.innerHTML='<div class="notice">Cargando plataformas…</div>';
 try{const r=await adminAction({action:"content"}),items=r.providers||[];w.innerHTML='<div class="section-title"><div><h2>Plataformas</h2><p class="muted">Controla servicios digitales disponibles.</p></div><button id="addProvider" class="btn primary">+ Plataforma</button></div><div class="admin-content-list">'+items.map(x=>'<article class="card admin-content-row"><div><strong>'+esc(x.name)+'</strong><div class="small muted">'+esc(x.code)+' • '+(x.is_base?"Base • ":"")+(x.active?"Activo":"Inactivo")+'</div></div><div class="user-actions"><button class="btn" data-edit-provider="'+x.id+'">Editar</button><button class="btn" data-toggle-provider="'+x.id+'" data-active="'+(x.active?"0":"1")+'">'+(x.active?"Desactivar":"Activar")+'</button>'+(x.is_base?"":'<button class="btn danger-btn" data-delete-provider="'+x.id+'">Eliminar</button>')+'</div></article>').join("")+'</div>';document.getElementById("addProvider").onclick=()=>adminProviderEditor();document.querySelectorAll("[data-edit-provider]").forEach(b=>b.onclick=()=>adminProviderEditor(items.find(x=>String(x.id)===b.dataset.editProvider)));document.querySelectorAll("[data-toggle-provider]").forEach(b=>b.onclick=async()=>{await adminAction({action:"provider",data:{id:Number(b.dataset.toggleProvider),active:b.dataset.active==="1"}});adminPlatformsWorkspace()});document.querySelectorAll("[data-delete-provider]").forEach(b=>b.onclick=async()=>{if(confirm("¿Eliminar esta plataforma?")){await adminAction({action:"delete_content",type:"provider",id:Number(b.dataset.deleteProvider)});adminPlatformsWorkspace()}})}catch(e){w.innerHTML='<div class="danger">'+esc(e.message)+'</div>'}
}
function adminProviderEditor(x={}){
 showAdminModal('<div class="modal-head"><h3>'+(x.id?"Editar":"Nueva")+' plataforma</h3><button id="modalClose" class="btn">×</button></div><div class="form-grid"><input id="apName" class="input" placeholder="Nombre" value="'+esc(x.name||"")+'"><input id="apCode" class="input" placeholder="Código" value="'+esc(x.code||"")+'"></div><label class="toggle-row"><input id="apActive" type="checkbox" '+(x.active===false?"":"checked")+'> Activa</label><button id="apSave" class="btn primary">Guardar</button>');
 document.getElementById("modalClose").onclick=closeAdminModal;document.getElementById("apSave").onclick=async()=>{await adminAction({action:"provider",data:{...(x.id?{id:x.id}:{}),name:document.getElementById("apName").value.trim(),code:document.getElementById("apCode").value.trim(),is_base:!!x.is_base,active:document.getElementById("apActive").checked}});closeAdminModal();adminPlatformsWorkspace()}
}
async function adminChannelsWorkspace(){
 const w=document.getElementById("adminWorkspace");w.innerHTML='<div class="notice">Cargando canales…</div>';
 try{const r=await adminAction({action:"content"}),items=r.channels||[];w.innerHTML='<div class="section-title"><div><h2>Canales</h2><p class="muted">Administra la guía de canales DISH.</p></div><button id="addChannel" class="btn primary">+ Canal</button></div><div class="admin-content-list">'+items.map(x=>'<article class="card admin-content-row"><div><strong>CH '+esc(x.channel_number)+' • '+esc(x.name)+'</strong><div class="small muted">'+esc(x.satellite||"")+' • '+esc(x.format||"")+' • '+(x.active?"Activo":"Inactivo")+'</div></div><div class="user-actions"><button class="btn" data-edit-channel="'+x.id+'">Editar</button><button class="btn" data-toggle-channel="'+x.id+'" data-active="'+(x.active?"0":"1")+'">'+(x.active?"Desactivar":"Activar")+'</button><button class="btn danger-btn" data-delete-channel="'+x.id+'">Eliminar</button></div></article>').join("")+'</div>';document.getElementById("addChannel").onclick=()=>adminChannelEditor();document.querySelectorAll("[data-edit-channel]").forEach(b=>b.onclick=()=>adminChannelEditor(items.find(x=>String(x.id)===b.dataset.editChannel)));document.querySelectorAll("[data-toggle-channel]").forEach(b=>b.onclick=async()=>{await adminAction({action:"channel",data:{id:Number(b.dataset.toggleChannel),active:b.dataset.active==="1"}});adminChannelsWorkspace()});document.querySelectorAll("[data-delete-channel]").forEach(b=>b.onclick=async()=>{if(confirm("¿Eliminar este canal?")){await adminAction({action:"delete_content",type:"channel",id:Number(b.dataset.deleteChannel)});adminChannelsWorkspace()}})}catch(e){w.innerHTML='<div class="danger">'+esc(e.message)+'</div>'}
}
function adminChannelEditor(x={}){
 showAdminModal('<div class="modal-head"><h3>'+(x.id?"Editar":"Nuevo")+' canal</h3><button id="modalClose" class="btn">×</button></div><div class="form-grid"><input id="acName" class="input" placeholder="Nombre" value="'+esc(x.name||"")+'"><input id="acNum" class="input" placeholder="Número" value="'+esc(x.channel_number||"")+'"><input id="acSat" class="input" placeholder="Satélite" value="'+esc(x.satellite||"119°W")+'"><input id="acTrans" class="input" placeholder="Transponder" value="'+esc(x.transponder||"")+'"><input id="acFmt" class="input" placeholder="Formato" value="'+esc(x.format||"HD")+'"></div><label class="toggle-row"><input id="acActive" type="checkbox" '+(x.active===false?"":"checked")+'> Activo</label><button id="acSave" class="btn primary">Guardar</button>');
 document.getElementById("modalClose").onclick=closeAdminModal;document.getElementById("acSave").onclick=async()=>{await adminAction({action:"channel",data:{...(x.id?{id:x.id}:{}),name:document.getElementById("acName").value.trim(),channel_number:document.getElementById("acNum").value.trim(),satellite:document.getElementById("acSat").value.trim(),transponder:document.getElementById("acTrans").value.trim()||null,format:document.getElementById("acFmt").value.trim()||"HD",active:document.getElementById("acActive").checked}});closeAdminModal();adminChannelsWorkspace()}
}
async function adminScheduleWorkspace(){
 const w=document.getElementById("adminWorkspace");w.innerHTML='<div class="notice">Cargando programación…</div>';
 try{const r=await adminAction({action:"content"}),items=r.events||[];w.innerHTML='<div class="section-title"><div><h2>Programación</h2><p class="muted">Eventos guardados y verificación.</p></div><button id="addEvent" class="btn primary">+ Evento</button></div><div class="admin-events">'+(items.map(x=>'<article class="card admin-event-card"><strong>'+esc(x.title)+'</strong><div class="small muted">'+esc(x.sport||"")+' • '+safeDateTime(x.starts_at)+'</div><div class="small muted">'+esc(x.region||"")+' • '+(x.verified?"Verificado":"No verificado")+' • '+esc(x.status||"")+'</div><div class="user-actions"><button class="btn" data-edit-event="'+x.id+'">Editar</button><button class="btn danger-btn" data-delete-event="'+x.id+'">Eliminar</button></div></article>').join("")||'<div class="notice">Sin eventos guardados.</div>')+'</div>';document.getElementById("addEvent").onclick=()=>adminEventEditor({},r);document.querySelectorAll("[data-edit-event]").forEach(b=>b.onclick=()=>adminEventEditor(items.find(x=>String(x.id)===b.dataset.editEvent),r));document.querySelectorAll("[data-delete-event]").forEach(b=>b.onclick=async()=>{if(confirm("¿Eliminar este evento?")){await adminAction({action:"delete_content",type:"event",id:Number(b.dataset.deleteEvent)});adminScheduleWorkspace()}})}catch(e){w.innerHTML='<div class="danger">'+esc(e.message)+'</div>'}
}
function adminEventEditor(x={},ctx={providers:[],channels:[]}){
 const local=x.starts_at?new Date(new Date(x.starts_at).getTime()-new Date().getTimezoneOffset()*60000).toISOString().slice(0,16):"";
 showAdminModal('<div class="modal-head"><h3>'+(x.id?"Editar":"Nuevo")+' evento</h3><button id="modalClose" class="btn">×</button></div><div class="form-grid"><input id="aeTitle" class="input" placeholder="Evento" value="'+esc(x.title||"")+'"><input id="aeSport" class="input" placeholder="Deporte" value="'+esc(x.sport||"")+'"><input id="aeStart" class="input" type="datetime-local" value="'+local+'"><input id="aeRegion" class="input" placeholder="Región" value="'+esc(x.region||"DO")+'"><select id="aeProvider" class="input"><option value="">Plataforma</option>'+(ctx.providers||[]).map(p=>'<option value="'+p.id+'" '+(String(x.provider_id||"")===String(p.id)?"selected":"")+'>'+esc(p.name)+'</option>').join("")+'</select><select id="aeChannel" class="input"><option value="">Canal</option>'+(ctx.channels||[]).map(ch=>'<option value="'+ch.id+'" '+(String(x.channel_id||"")===String(ch.id)?"selected":"")+'>'+esc(ch.channel_number+" • "+ch.name)+'</option>').join("")+'</select><input id="aeRights" class="input" placeholder="Derechos / alcance" value="'+esc(x.rights_scope||"")+'"><input id="aeStatus" class="input" placeholder="Estado" value="'+esc(x.status||"scheduled")+'"></div><label class="toggle-row"><input id="aeVerified" type="checkbox" '+(x.verified?"checked":"")+'> Programación verificada</label><button id="aeSave" class="btn primary">Guardar evento</button>');
 document.getElementById("modalClose").onclick=closeAdminModal;document.getElementById("aeSave").onclick=async()=>{const dt=document.getElementById("aeStart").value;await adminAction({action:"event",data:{...(x.id?{id:x.id}:{}),title:document.getElementById("aeTitle").value.trim(),sport:document.getElementById("aeSport").value.trim()||null,starts_at:dt?new Date(dt).toISOString():null,region:document.getElementById("aeRegion").value.trim()||null,provider_id:Number(document.getElementById("aeProvider").value)||null,channel_id:Number(document.getElementById("aeChannel").value)||null,rights_scope:document.getElementById("aeRights").value.trim()||null,status:document.getElementById("aeStatus").value.trim()||null,verified:document.getElementById("aeVerified").checked}});closeAdminModal();adminScheduleWorkspace()}
}
async function adminContentWorkspace(){return adminPlatformsWorkspace()}

async function adminLogsWorkspace(){const w=document.getElementById("adminWorkspace");w.innerHTML='<div class="notice">Cargando actividad…</div>';try{const r=await adminAction({action:"logs"});w.innerHTML=`<h2>Registro administrativo</h2><div class="audit-list">${(r.logs||[]).map(x=>`<article class="card audit-row"><strong>${esc(x.action)}</strong><span>${esc(x.target_type)} ${esc(x.target_id||"")}</span><time>${new Date(x.created_at).toLocaleString()}</time></article>`).join("")||'<div class="notice">Aún no hay acciones registradas.</div>'}</div>`}catch(e){w.innerHTML='<div class="danger">'+esc(e.message)+'</div>'}}
async function adminUsersPanel(){return adminControlCenter()}

async function adminAction(payload){const {data:{session}}=await sb.auth.getSession();const r=await fetch(CFG.url+"/functions/v1/admin-users",{method:"POST",headers:{"Content-Type":"application/json","apikey":CFG.key,"Authorization":"Bearer "+session.access_token},body:JSON.stringify(payload)});const j=await r.json();if(!r.ok)throw new Error(j.error||"No se pudo completar la acción");return j}
function bindAdminUsers(){document.querySelectorAll("[data-password-user]").forEach(b=>b.onclick=async()=>{const pw=prompt("Nueva contraseña para este usuario (mínimo 8 caracteres):");if(!pw)return;try{await adminAction({action:"password",user_id:b.dataset.passwordUser,password:pw});alert("Contraseña actualizada.")}catch(e){alert(e.message)}});document.querySelectorAll("[data-status]").forEach(b=>b.onclick=async()=>{try{await adminAction({action:"status",user_id:b.dataset.status,status:b.dataset.next});adminUsersWorkspace()}catch(e){alert(e.message)}});document.querySelectorAll("[data-delete-user]").forEach(b=>b.onclick=async()=>{if(confirm("¿Eliminar definitivamente este usuario?")){try{await adminAction({action:"delete",user_id:b.dataset.deleteUser});adminUsersWorkspace()}catch(e){alert(e.message)}}})}

function adminPanel(){adminControlCenter()}

function loadSupabase(){
 const s=document.createElement("script");
 s.src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.95.0/dist/umd/supabase.min.js";
 s.async=true;
 s.onload=async()=>{try{if(!window.supabase?.createClient)throw new Error("Cliente de cuenta no disponible");sb=window.supabase.createClient(CFG.url,CFG.key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});sb.auth.onAuthStateChange((event)=>{if(event==="PASSWORD_RECOVERY")setTimeout(passwordRecovery,0);if(event==="SIGNED_OUT"){currentUser=null;currentProfile=null}});const {data,error}=await withTimeout(sb.auth.getSession(),8000);if(error)throw error;const user=data?.session?.user||null;if(new URLSearchParams(location.search).get("recovery")==="1"&&user)return passwordRecovery();if(user)await openSession(user);else login()}catch(e){console.error("Auth bootstrap:",e);login("No se pudo conectar el servicio de acceso. Recarga e intenta nuevamente.")}};
 s.onerror=()=>login("No se pudo cargar el servicio de acceso.");
 document.head.appendChild(s);
}
login();loadSupabase();
if("serviceWorker" in navigator){window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js?v=65").catch(e=>console.warn("SW:",e)))}
