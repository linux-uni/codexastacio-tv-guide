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
let sb=null,currentUser=null,scheduleEvents=[],scheduleRange="today",state={view:"home",sport:"Todos"};
const esc=v=>String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
function nav(){return `<nav class="nav">${[["home","Inicio"],["schedule","Programación"],["channels","Canales"],["leagues","Ligas"]].map(x=>`<button data-view="${x[0]}" class="btn ${state.view===x[0]?"active":""}">${x[1]}</button>`).join("")}</nav>`}
function chips(){return `<div class="chips">${["Todos","NFL","NBA","MLB","NHL","Fútbol","Tenis","UFC/MMA"].map(x=>`<button data-sport="${x}" class="chip ${state.sport===x?"active":""}">${x}</button>`).join("")}</div>`}
function providerCards(){return `<div class="grid provider-grid">${providers.map(p=>`<article class="card searchable" data-search="${esc((p.name+" "+p.tag+" "+p.sports).toLowerCase())}"><div class="row"><strong>${esc(p.name)}</strong><span class="badge">${esc(p.tag)}</span></div><p class="small muted">${esc(p.sports)}</p></article>`).join("")}</div>`}
function heroSlider(){return `<section class="sports-slider"><button id="slidePrev" class="slide-arrow">‹</button><div id="sportsHero" class="hero-slide"><div class="hero-overlay"><span class="badge">PRÓXIMOS EVENTOS</span><h1>Agenda deportiva</h1><p>Consulta partidos y eventos próximos. Actualizando datos deportivos…</p></div></div><button id="slideNext" class="slide-arrow">›</button></section>`}
function channelCards(list){return `<div class="grid">${list.map(c=>`<article class="card event searchable" data-search="${esc((c.n+" "+c.name+" "+c.sat+" "+c.sports.join(" ")).toLowerCase())}"><div class="row"><strong>${esc(c.name)}</strong><span class="badge">${esc(c.fmt)}</span></div><h3>Canal ${esc(c.n)}</h3><div class="small muted">📡 DISH • ${esc(c.sat)}</div><div class="notice small">${esc(c.sports.join(" • "))}</div></article>`).join("")}</div>`}
function eventCards(list){return `<div class="grid">${list.map(e=>`<article class="card event searchable" data-search="${esc((e.sport+" "+e.title+" "+e.network+" "+e.channel).toLowerCase())}"><div class="row"><strong>${esc(e.sport)}</strong><span class="badge">${esc(e.status)}</span></div><h3>${esc(e.title)}</h3><div class="small muted">📺 ${esc(e.network)}</div><div class="notice small">DISH: ${esc(e.channel)} • horarios por TV listing</div></article>`).join("")}</div>`}
function dateKey(offset=0){const d=new Date();d.setDate(d.getDate()+offset);return d.toISOString().slice(0,10)}
function scheduleControls(){return `<div class="chips schedule-tabs">${[["today","Hoy"],["tomorrow","Mañana"],["week","Próximos 7 días"]].map(x=>`<button data-range="${x[0]}" class="chip ${scheduleRange===x[0]?"active":""}">${x[1]}</button>`).join("")}</div>`}
function scheduleCards(){if(!scheduleEvents.length)return '<div class="notice">Cargando próximos eventos deportivos…</div>';return `<div class="schedule-list">${scheduleEvents.map(e=>{const img=e.strThumb||e.strPoster||e.strFanart||"";return `<article class="schedule-card searchable" data-search="${esc(((e.strEvent||"")+" "+(e.strLeague||"")+" "+(e.strSport||"")).toLowerCase())}">${img?`<img src="${esc(img)}" alt="" loading="lazy">`:"<div class='schedule-img-fallback'>SPORTS</div>"}<div class="schedule-info"><div class="row"><span class="badge">${esc(e.strSport||"DEPORTE")}</span><span class="small muted">${esc([e.dateEvent,e.strTime].filter(Boolean).join(" • "))}</span></div><h3>${esc(e.strEvent||"Evento deportivo")}</h3><div class="small muted">${esc(e.strLeague||"")}</div>${watchBadges(e)}</div></article>`}).join("")}</div>`}
async function loadSchedule(){const box=document.getElementById("scheduleDynamic");if(!box)return;box.innerHTML='<div class="notice">Cargando agenda deportiva…</div>';const offsets=scheduleRange==="today"?[0]:scheduleRange==="tomorrow"?[1]:[0,1,2,3,4,5,6];try{const rs=await Promise.all(offsets.map(n=>fetch("https://www.thesportsdb.com/api/v1/json/123/eventsday.php?d="+dateKey(n)).then(r=>r.ok?r.json():null).catch(()=>null)));scheduleEvents=rs.flatMap(x=>x?.events||[]).filter(e=>e.strEvent).sort((a,b)=>String(a.strTimestamp||a.dateEvent||"").localeCompare(String(b.strTimestamp||b.dateEvent||""))).slice(0,80);if(document.getElementById("scheduleDynamic"))document.getElementById("scheduleDynamic").innerHTML=scheduleCards()}catch(e){box.innerHTML='<div class="danger">No fue posible cargar la programación en este momento.</div>'}}
function content(){
 const filteredChannels=state.sport==="Todos"?channels:channels.filter(c=>c.sports.includes(state.sport));
 const filteredEvents=state.sport==="Todos"?events:events.filter(e=>e.sport===state.sport);
 if(state.view==="schedule")return `<div class="top"><div><h2>Programación deportiva</h2><p class="muted">Agenda de partidos y eventos próximos.</p></div><input id="search" class="input" style="max-width:340px" placeholder="Buscar partido, liga o deporte…"></div>${scheduleControls()}<div id="scheduleDynamic"><div class="notice">Cargando agenda deportiva…</div></div>`;
 if(state.view==="channels")return `<h2>Canales DISH</h2><p class="muted">Canales deportivos destacados en 110°W / 119°W.</p>${chips()}${channelCards(filteredChannels)}`;
 if(state.view==="leagues")return `<h2>Ligas y deportes</h2><p class="muted">Accesos rápidos a la programación.</p>${chips()}${eventCards(filteredEvents)}`;
 return `${heroSlider()}<div class="top"><div><h2 style="margin:0">Encuentra tus deportes</h2><p class="muted">Busca canales, deportes y plataformas.</p></div><input id="search" class="input" style="max-width:390px" placeholder="Buscar DISH, Disney+, DAZN, Netflix, Paramount+…"></div>${chips()}<h2>Plataformas</h2>${providerCards()}<h2>Canales destacados DISH</h2>${channelCards(filteredChannels)}`;
}
function dashboard(){
 app.innerHTML=`<main class="wrap"><header class="top"><div><div class="brand">CodeXaStacio TV Guide</div><div class="small muted">DISH 110°W / 119°W • Universal Sports Finder</div></div><button id="account" class="btn primary">${currentUser?"Cerrar sesión":"Mi cuenta"}</button></header>${nav()}<section class="panel">${content()}</section><footer class="footer">CodeXaStacio TV Guide • v22 Secure Username</footer></main>`;
 bind();
}
function bind(){
 document.getElementById("account").onclick=currentUser?logout:login;
 document.querySelectorAll("[data-view]").forEach(b=>b.onclick=()=>{state.view=b.dataset.view;dashboard()});
 document.querySelectorAll("[data-sport]").forEach(b=>b.onclick=()=>{state.sport=b.dataset.sport;if(state.view==="home")state.view="schedule";dashboard()});
 document.querySelectorAll("[data-range]").forEach(b=>b.onclick=()=>{scheduleRange=b.dataset.range;dashboard()});if(state.view==="schedule")loadSchedule();setupSlider();const q=document.getElementById("search");if(q)q.oninput=()=>document.querySelectorAll(".searchable").forEach(x=>x.classList.toggle("hidden",!x.dataset.search.includes(q.value.toLowerCase())));
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
async function loadSportsSlider(){try{const dates=[0,1,2].map(n=>{const d=new Date();d.setDate(d.getDate()+n);return d.toISOString().slice(0,10)});const results=await Promise.all(dates.map(d=>fetch("https://www.thesportsdb.com/api/v1/json/123/eventsday.php?d="+d).then(r=>r.ok?r.json():null).catch(()=>null)));sliderEvents=results.flatMap(x=>x?.events||[]).filter(e=>e.strEvent).sort((a,b)=>String(a.strTimestamp||a.dateEvent||"").localeCompare(String(b.strTimestamp||b.dateEvent||""))).slice(0,18);if(sliderEvents.length){showSlide();setInterval(()=>{if(document.getElementById("sportsHero"))showSlide(1)},6500)}}catch(e){console.warn("Sports slider unavailable",e)}}
function login(){
 app.innerHTML=`<main class="wrap"><section class="panel login"><div class="brand">CodeXaStacio TV Guide</div><p class="muted">Acceso a tu cuenta</p><form id="login"><input id="identity" class="input" placeholder="Usuario o correo" required><br><br><input id="pw" class="input" type="password" placeholder="Contraseña" required><br><br><button class="btn primary" style="width:100%">Entrar</button></form><br><button id="signup" class="btn" style="width:100%">Crear cuenta</button><div id="msg" class="small muted" style="margin-top:12px">${sb?"Servicio de cuenta conectado.":"Conectando servicio de cuenta…"}</div></section></main>`;
 document.getElementById("signup").onclick=register;
 document.getElementById("login").onsubmit=async e=>{e.preventDefault();const msg=document.getElementById("msg");if(!sb){msg.className="danger small";msg.textContent="El servicio de cuenta todavía no está disponible.";return}let email=document.getElementById("identity").value.trim();const password=document.getElementById("pw").value;msg.textContent="Iniciando sesión…";let error=null;if(email.includes("@")){({error}=await sb.auth.signInWithPassword({email,password}))}else{try{const r=await fetch(CFG.url+"/functions/v1/username-login",{method:"POST",headers:{"Content-Type":"application/json","apikey":CFG.key},body:JSON.stringify({username:email,password})});const j=await r.json();if(!r.ok)throw new Error(j.error||"Usuario o contraseña incorrectos");const s=await sb.auth.setSession({access_token:j.access_token,refresh_token:j.refresh_token});error=s.error}catch(e){error=e}}msg.className=error?"danger small":"ok small";msg.textContent=error?error.message:"Sesión iniciada correctamente.";if(!error){const {data:{user}}=await sb.auth.getUser();currentUser=user;const {data:p}=await sb.from("profiles").select("role,status,full_name,username").single();if(p?.role==="admin"&&p?.status==="active")adminPanel(p);else dashboard()}};
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
function loadSupabase(){const s=document.createElement("script");s.src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.49.4/dist/umd/supabase.min.js";s.async=true;s.onload=async()=>{try{if(window.supabase?.createClient){sb=window.supabase.createClient(CFG.url,CFG.key);const {data}=await sb.auth.getSession();currentUser=data.session?.user||null;if(currentUser)dashboard();else login()}}catch(e){console.warn(e)}};s.onerror=()=>console.warn("Supabase CDN unavailable");document.head.appendChild(s)}
login();setTimeout(loadSupabase,100);
