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
let sb=null,currentUser=null,scheduleEvents=[],scheduleRange="today",channelFilter="Todos",state={view:"home",sport:"Todos"};
const esc=v=>String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
function nav(){return `<nav class="nav">${[["home","Inicio"],["schedule","Programación"],["channels","Canales"],["leagues","Ligas"]].map(x=>`<button data-view="${x[0]}" class="btn ${state.view===x[0]?"active":""}">${x[1]}</button>`).join("")}</nav>`}
function chips(){return `<div class="chips">${["Todos","NFL","NBA","MLB","NHL","Fútbol","Tenis","UFC/MMA"].map(x=>`<button data-sport="${x}" class="chip ${state.sport===x?"active":""}">${x}</button>`).join("")}</div>`}
function providerCards(){return `<div id="providerGrid" class="grid provider-grid"><div class="notice">Actualizando próximos eventos por plataforma…</div></div>`}
function providerEventCards(){const digital=["Disney+","DAZN","Netflix","Paramount+"];return digital.map(name=>{const found=sliderEvents.find(e=>demoWhereToWatch(e).some(x=>x.name===name));const img=found&&(found.strThumb||found.strPoster||found.strFanart);return `<article class="card provider-event searchable" data-search="${esc((name+" "+(found?.strEvent||"")).toLowerCase())}" ${img?`style="background-image:linear-gradient(180deg,rgba(4,10,24,.25),rgba(4,10,24,.96)),url('${esc(img)}')"`:""}><div class="provider-logo">${esc(name)}</div><div class="provider-bottom"><span class="badge">PRÓXIMO</span><h3>${esc(found?.strEvent||"Próximos eventos")}</h3><p class="small muted">${esc(found?[found.dateEvent,found.strTime].filter(Boolean).join(" • "):"Actualizando programación…")}</p></div></article>`}).join("")}
function renderProviders(){const x=document.getElementById("providerGrid");if(x)x.innerHTML=providerEventCards()}
function sportMark(s){const x=(s||"SPORT").toUpperCase();return `<span class="sport-mark">${esc(x==="AMERICAN FOOTBALL"?"NFL":x==="BASKETBALL"?"NBA":x==="BASEBALL"?"MLB":x==="ICE HOCKEY"?"NHL":x==="SOCCER"?"FÚTBOL":x.slice(0,6))}</span>`}
function channelFilters(){return `<div class="channel-filterbar">${["Todos","Próximos","NBA","NFL","MLB","Fútbol","Tenis"].map(x=>`<button class="channel-filter ${channelFilter===x?"active":""}" data-channel-filter="${x}">${x}</button>`).join("")}</div>`}
function channelEvent(c){return sliderEvents.find(x=>c.sports.some(s=>{const a=String(x.strSport||"").toLowerCase(),b=s.toLowerCase();return a.includes(b==="fútbol"?"soccer":b==="nfl"?"american football":b==="nba"?"basketball":b==="mlb"?"baseball":b==="nhl"?"ice hockey":b==="tenis"?"tennis":b.split("/")[0])}))}
function channelCards(list){let rows=list.map(c=>({c,e:channelEvent(c)}));if(channelFilter!=="Todos"&&channelFilter!=="Próximos")rows=rows.filter(({c})=>c.sports.includes(channelFilter));return `<div class="channel-showcase">${rows.map(({c,e},i)=>{const sport=e?.strSport||c.sports[0],img=e&&(e.strThumb||e.strPoster||e.strFanart);return `<article class="channel-tile searchable" data-search="${esc((c.name+" "+c.n+" "+c.sports.join(" ")+" "+(e?.strEvent||"")).toLowerCase())}" ${img?`style="--channel-bg:url('${esc(img)}')"`:""}><div class="channel-art"></div><div class="channel-body"><div class="channel-head"><div class="channel-identity"><span class="channel-logo">${esc(c.name)}</span><span class="channel-number">CH ${esc(c.n)}</span></div>${sportMark(sport)}</div><span class="next-badge">PRÓXIMO</span><h3>${esc(e?.strEvent||c.sports.slice(0,2).join(" • "))}</h3><div class="channel-meta">${esc(e?[e.dateEvent,e.strTime,e.strLeague].filter(Boolean).join(" • "):"Programación deportiva")}</div><div class="progress-track"><i style="width:${25+(i%4)*15}%"></i></div><div class="now-next"><span><b>Ahora</b> Guía deportiva</span><span><b>A continuación</b> ${esc(e?.strEvent||"Por actualizar")}</span></div></div></article>`}).join("")}</div>`}
function eventCards(list){return `<div class="grid">${list.map(e=>`<article class="card event searchable" data-search="${esc((e.sport+" "+e.title+" "+e.network+" "+e.channel).toLowerCase())}"><div class="row"><strong>${esc(e.sport)}</strong><span class="badge">${esc(e.status)}</span></div><h3>${esc(e.title)}</h3><div class="small muted">📺 ${esc(e.network)}</div><div class="notice small">DISH: ${esc(e.channel)} • horarios por TV listing</div></article>`).join("")}</div>`}
function dateKey(offset=0){const d=new Date();d.setDate(d.getDate()+offset);return d.toISOString().slice(0,10)}
function scheduleControls(){return `<div class="chips schedule-tabs">${[["today","Hoy"],["tomorrow","Mañana"],["week","Próximos 7 días"]].map(x=>`<button data-range="${x[0]}" class="chip ${scheduleRange===x[0]?"active":""}">${x[1]}</button>`).join("")}</div>`}
function scheduleCards(){if(!scheduleEvents.length)return '<div class="notice">Cargando próximos eventos deportivos…</div>';return `<div class="schedule-list">${scheduleEvents.map(e=>{const img=e.strThumb||e.strPoster||e.strFanart||"";return `<article class="schedule-card searchable" data-search="${esc(((e.strEvent||"")+" "+(e.strLeague||"")+" "+(e.strSport||"")).toLowerCase())}">${img?`<img src="${esc(img)}" alt="" loading="lazy">`:"<div class='schedule-img-fallback'>SPORTS</div>"}<div class="schedule-info"><div class="row"><span class="badge">${esc(e.strSport||"DEPORTE")}</span><span class="small muted">${esc([e.dateEvent,e.strTime].filter(Boolean).join(" • "))}</span></div><h3>${esc(e.strEvent||"Evento deportivo")}</h3><div class="small muted">${esc(e.strLeague||"")}</div>${watchBadges(e)}</div></article>`}).join("")}</div>`}
async function loadSchedule(){const box=document.getElementById("scheduleDynamic");if(!box)return;box.innerHTML='<div class="notice">Cargando agenda deportiva…</div>';const offsets=scheduleRange==="today"?[0]:scheduleRange==="tomorrow"?[1]:[0,1,2,3,4,5,6];try{const rs=await Promise.all(offsets.map(n=>fetch("https://www.thesportsdb.com/api/v1/json/123/eventsday.php?d="+dateKey(n)).then(r=>r.ok?r.json():null).catch(()=>null)));scheduleEvents=rs.flatMap(x=>x?.events||[]).filter(e=>e.strEvent).sort((a,b)=>String(a.strTimestamp||a.dateEvent||"").localeCompare(String(b.strTimestamp||b.dateEvent||""))).slice(0,80);if(document.getElementById("scheduleDynamic"))document.getElementById("scheduleDynamic").innerHTML=scheduleCards()}catch(e){box.innerHTML='<div class="danger">No fue posible cargar la programación en este momento.</div>'}}
function heroSlider(){return `<section class="cover-intro"><div class="cover-kicker">SPORTS • STREAMING • TV</div><h1>Todo el deporte.<br><span>Una sola guía.</span></h1><p>Partidos, canales y plataformas en una experiencia deportiva inteligente.</p></section><section class="sports-slider"><button id="slidePrev" class="slide-btn prev" aria-label="Anterior">‹</button><div id="sportsHero" class="hero-slide"><div class="hero-overlay"><span class="badge">SPORTS</span><h1>Próximos eventos deportivos</h1><p>Cargando programación…</p></div></div><button id="slideNext" class="slide-btn next" aria-label="Siguiente">›</button></section>`}
function content(){
 const filteredChannels=state.sport==="Todos"?channels:channels.filter(c=>c.sports.includes(state.sport));
 const filteredEvents=state.sport==="Todos"?events:events.filter(e=>e.sport===state.sport);
 if(state.view==="schedule")return `<div class="top"><div><h2>Programación deportiva</h2><p class="muted">Agenda de partidos y eventos próximos.</p></div><input id="search" class="input" style="max-width:340px" placeholder="Buscar partido, liga o deporte…"></div>${scheduleControls()}<div id="scheduleDynamic"><div class="notice">Cargando agenda deportiva…</div></div>`;
 if(state.view==="channels")return `<h2>Canales DISH</h2><p class="muted">Canales deportivos destacados en 110°W / 119°W.</p>${chips()}${channelCards(filteredChannels)}`;
 if(state.view==="leagues")return `<h2>Ligas y deportes</h2><p class="muted">Accesos rápidos a la programación.</p>${chips()}${eventCards(filteredEvents)}`;
 return `${heroSlider()}<div class="finder"><div><h2>Encuentra <span>tus deportes</span></h2><p class="muted">Busca canales, deportes y plataformas</p></div><div class="finder-search"><input id="search" class="input" placeholder="Buscar partidos, canales, deportes o plataformas…"></div></div>${chips()}<h2>Plataformas digitales</h2>${providerCards()}<div class="section-title"><h2>Canales destacados</h2><span class="small muted">Ahora y próximos deportes</span></div>${channelFilters()}${channelCards(filteredChannels)}`;
}
function dashboard(){
 if(!currentUser){login();return}
 app.innerHTML=`<main class="wrap"><header class="top"><div class="cx-logo"><span class="cx-symbol">CX</span><span class="cx-word"><span>Code<b>X</b>aStacio</span><small>TV GUIDE</small></span></div><button id="account" class="btn primary">${currentUser?"Cerrar sesión":"Mi cuenta"}</button></header>${nav()}<section class="panel">${content()}</section><footer class="footer">CodeXaStacio TV Guide • v28 Hero Fix</footer><a class="whatsapp-float" href="https://wa.me/18097777117?text=Hola%2C%20necesito%20mas%20informacion%21" target="_blank" rel="noopener" aria-label="WhatsApp">WA<span>Hola, necesito más información!</span></a></main>`;
 bind();
}
function bind(){
 document.getElementById("account").onclick=currentUser?logout:login;
 document.querySelectorAll("[data-view]").forEach(b=>b.onclick=()=>{state.view=b.dataset.view;dashboard()});
 document.querySelectorAll("[data-sport]").forEach(b=>b.onclick=()=>{state.sport=b.dataset.sport;if(state.view==="home")state.view="schedule";dashboard()});
 document.querySelectorAll("[data-channel-filter]").forEach(b=>b.onclick=()=>{channelFilter=b.dataset.channelFilter;dashboard()});document.querySelectorAll("[data-range]").forEach(b=>b.onclick=()=>{scheduleRange=b.dataset.range;dashboard()});if(state.view==="schedule")loadSchedule();setupSlider();const q=document.getElementById("search");if(q)q.oninput=()=>document.querySelectorAll(".searchable").forEach(x=>x.classList.toggle("hidden",!x.dataset.search.includes(q.value.toLowerCase())));
}
function demoWhereToWatch(e){
 const sport=(e.strSport||"").toLowerCase(),league=(e.strLeague||"").toLowerCase(),name=(e.strEvent||"").toLowerCase();
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
function watchBadges(e){return `<div class="watch-row"><span class="small muted">Dónde verlo:</span>${demoWhereToWatch(e).map(x=>`<span class="watch-pill">${esc(x.name)} <small>${esc(x.label)}</small></span>`).join("")}</div>`}
let sliderEvents=[],slideIndex=0;
function setupSlider(){const hero=document.getElementById("sportsHero");if(!hero)return;document.getElementById("slidePrev").onclick=()=>showSlide(-1);document.getElementById("slideNext").onclick=()=>showSlide(1);loadSportsSlider()}
function showSlide(step=0){if(!sliderEvents.length)return;slideIndex=(slideIndex+step+sliderEvents.length)%sliderEvents.length;const e=sliderEvents[slideIndex],hero=document.getElementById("sportsHero");if(!hero)return;const img=e.strThumb||e.strPoster||e.strFanart||"";hero.style.backgroundImage=img?`linear-gradient(90deg,rgba(2,8,20,.94),rgba(2,8,20,.25)),url("${img}")`:"";hero.innerHTML=`<div class="hero-overlay"><span class="badge">${esc(e.strSport||"DEPORTE")}</span><h1>${esc(e.strEvent||e.title||"Próximo evento")}</h1><p>${esc([e.dateEvent,e.strTime,e.strLeague].filter(Boolean).join(" • "))}</p>${watchBadges(e)}</div>`}
async function loadSportsSlider(){try{const dates=[0,1,2].map(n=>{const d=new Date();d.setDate(d.getDate()+n);return d.toISOString().slice(0,10)});const results=await Promise.all(dates.map(d=>fetch("https://www.thesportsdb.com/api/v1/json/123/eventsday.php?d="+d).then(r=>r.ok?r.json():null).catch(()=>null)));sliderEvents=results.flatMap(x=>x?.events||[]).filter(e=>e.strEvent).sort((a,b)=>String(a.strTimestamp||a.dateEvent||"").localeCompare(String(b.strTimestamp||b.dateEvent||""))).slice(0,18);if(sliderEvents.length){showSlide();renderProviders();dashboardChannelRefresh();setInterval(()=>{if(document.getElementById("sportsHero"))showSlide(1)},6500)}}catch(e){console.warn("Sports slider unavailable",e)}}
function dashboardChannelRefresh(){const grids=document.querySelectorAll(".channel-grid");if(!grids.length)return;const filtered=state.sport==="Todos"?channels:channels.filter(c=>c.sports.includes(state.sport));grids.forEach(g=>g.outerHTML=channelCards(filtered))}
function withTimeout(p,ms=12000){return Promise.race([p,new Promise((_,reject)=>setTimeout(()=>reject(new Error("Tiempo de espera agotado. Intenta nuevamente.")),ms))])}
async function openSession(user){
 currentUser=user;
 try{
  const {data:p}=await withTimeout(sb.from("profiles").select("role,status,full_name,username").eq("id",user.id).maybeSingle(),7000);
  if(p?.role==="admin"&&p?.status==="active")return adminPanel(p);
 }catch(e){console.warn("Profile lookup:",e)}
 dashboard();
}
function login(){
 app.innerHTML=`<main class="wrap"><section class="panel login"><div class="cx-logo login-logo"><span class="cx-symbol">CX</span><span class="cx-word"><span>Code<b>X</b>aStacio</span><small>TV GUIDE</small></span></div><p class="muted">Acceso privado</p><form id="login"><input id="identity" class="input" placeholder="Usuario o correo" autocomplete="username" required><br><br><input id="pw" class="input" type="password" placeholder="Contraseña" autocomplete="current-password" required><br><br><button id="loginBtn" class="btn primary" style="width:100%">Entrar</button></form><br><button id="signup" class="btn" style="width:100%">Crear cuenta</button><div id="msg" class="small muted" style="margin-top:12px">${sb?"Servicio de cuenta conectado.":"Conectando servicio de cuenta…"}</div></section></main>`;
 document.getElementById("signup").onclick=register;
 document.getElementById("login").onsubmit=async e=>{
  e.preventDefault();const msg=document.getElementById("msg"),btn=document.getElementById("loginBtn");
  if(!sb){msg.className="danger small";msg.textContent="El servicio de cuenta todavía está conectando. Intenta de nuevo en unos segundos.";return}
  const identity=document.getElementById("identity").value.trim(),password=document.getElementById("pw").value;
  btn.disabled=true;btn.textContent="Entrando…";msg.className="small muted";msg.textContent="Verificando credenciales…";
  try{
   let data=null,error=null;
   if(identity.includes("@"))({data,error}=await withTimeout(sb.auth.signInWithPassword({email:identity,password})));
   else{
    const r=await withTimeout(fetch(CFG.url+"/functions/v1/username-login",{method:"POST",headers:{"Content-Type":"application/json","apikey":CFG.key},body:JSON.stringify({username:identity,password})}));
    const j=await r.json();if(!r.ok)throw new Error(j.error||"Usuario o contraseña incorrectos");
    const res=await withTimeout(sb.auth.setSession({access_token:j.access_token,refresh_token:j.refresh_token}));data=res.data;error=res.error;
   }
   if(error)throw error;
   const user=data?.user||data?.session?.user||(await withTimeout(sb.auth.getUser(),7000)).data?.user;
   if(!user)throw new Error("No se pudo validar la sesión.");
   msg.className="ok small";msg.textContent="Acceso correcto. Abriendo guía…";
   await openSession(user);
  }catch(err){
   msg.className="danger small";msg.textContent=err?.message||"No fue posible iniciar sesión.";
   btn.disabled=false;btn.textContent="Entrar";
  }
 };
}
function register(){
 app.innerHTML=`<main class="wrap"><section class="panel login"><div class="brand">Crear cuenta</div><p class="muted">Regístrate en CodeXaStacio TV Guide</p><form id="reg"><input id="name" class="input" placeholder="Nombre completo" required><br><br><input id="username" class="input" placeholder="Usuario" required><br><br><input id="email" class="input" type="email" placeholder="Correo electrónico" required><br><br><input id="phone" class="input" placeholder="Teléfono"><br><br><input id="password" class="input" type="password" minlength="8" placeholder="Contraseña (mínimo 8 caracteres)" required><br><br><button class="btn primary" style="width:100%">Crear cuenta</button></form><br><button id="backLogin" class="btn" style="width:100%">← Volver al login</button><div id="regmsg" class="small muted" style="margin-top:12px"></div></section></main>`;
 document.getElementById("backLogin").onclick=login;
 document.getElementById("reg").onsubmit=async e=>{e.preventDefault();const m=document.getElementById("regmsg");if(!sb){m.className="danger small";m.textContent="El servicio de cuenta todavía no está disponible.";return}m.textContent="Creando cuenta…";const {data,error}=await sb.auth.signUp({email:document.getElementById("email").value.trim(),password:document.getElementById("password").value,options:{data:{full_name:document.getElementById("name").value.trim(),username:document.getElementById("username").value.trim(),phone:document.getElementById("phone").value.trim()}}});m.className=error?"danger small":"ok small";m.textContent=error?error.message:(data.session?"Cuenta creada. Ya puedes continuar.":"Cuenta creada. Revisa tu correo para confirmar el registro.");};
}
async function logout(){if(sb)await sb.auth.signOut();currentUser=null;login()}
function adminPanel(p){
 app.innerHTML=`<main class="wrap"><header class="top"><div><div class="brand">CodeXaStacio Admin</div><div class="small muted">Administrador • ${esc(p.full_name||p.username||"Cuenta")}</div></div><button id="logout" class="btn">Cerrar sesión</button></header><section class="panel"><h2>Panel administrativo</h2><div class="grid"><article class="card"><strong>Usuarios</strong><h3>Administrar accesos</h3><p class="muted small">Control de perfiles y estado.</p></article><article class="card"><strong>Servicios</strong><h3>Proveedores deportivos</h3><p class="muted small">DISH y servicios habilitados.</p></article><article class="card"><strong>Canales</strong><h3>Guía DISH</h3><p class="muted small">Gestión de canales 110°W / 119°W.</p></article><article class="card"><strong>Programación</strong><h3>Eventos</h3><p class="muted small">Gestión de programación deportiva.</p></article></div><br><button id="guide" class="btn primary">Abrir guía pública</button></section><footer class="footer">CodeXaStacio TV Guide • v17 Admin</footer></main>`;
 document.getElementById("guide").onclick=dashboard;document.getElementById("logout").onclick=logout;
}
async function loadSupabase(){
 const s=document.createElement("script");
 s.src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.95.0/dist/umd/supabase.min.js";
 s.async=true;
 s.onload=async()=>{
  try{
   if(!window.supabase?.createClient)throw new Error("Cliente de cuenta no disponible");
   sb=window.supabase.createClient(CFG.url,CFG.key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
   const {data,error}=await withTimeout(sb.auth.getSession(),8000);
   if(error)throw error;
   const user=data?.session?.user||null;
   if(user)await openSession(user);else login();
  }catch(e){
   console.error("Auth bootstrap:",e);
   login();
   const m=document.getElementById("msg");if(m){m.className="danger small";m.textContent="No se pudo conectar el servicio de acceso. Recarga e intenta nuevamente."}
  }
 };
 s.onerror=()=>{login();const m=document.getElementById("msg");if(m){m.className="danger small";m.textContent="No se pudo cargar el servicio de acceso."}};
 document.head.appendChild(s);
}
login();loadSupabase();
