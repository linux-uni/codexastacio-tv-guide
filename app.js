"use strict";
const app=document.getElementById("app");
const CFG={url:"https://dzlkpulknbpxibcvdhom.supabase.co",key:"sb_publishable_v4v_GxlTHZNqSYqO-Ij7bQ_IPPFU7sk",admin:"pecristoastacio@gmail.com"};
const channels=[
["140","ESPN","119°W","HD"],["150","FS1","110°W","HD"],["152","MLB Network","119°W","HD"],
["154","NFL Network","119°W","HD"],["156","NBA TV","110°W","HD"],["400","Tennis Channel","110°W","HD"],["404","SEC Network","119°W","HD"]
];
let sb=null;
const esc=v=>String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
function dashboard(){
 app.innerHTML=`<main class="wrap">
 <header class="top"><div><div class="brand">CodeXaStacio TV Guide</div><div class="small muted">DISH 110°W / 119°W • Universal Sports Finder</div></div><button id="account" class="btn primary">Mi cuenta</button></header>
 <nav class="nav"><button class="btn active">Inicio</button><button class="btn">Programación</button><button class="btn">Canales</button><button class="btn">Ligas</button></nav>
 <section class="panel"><div class="top"><div><h2 style="margin:0">Encuentra tus deportes</h2><p class="muted">Busca canales DISH y prepara tu guía deportiva.</p></div><input id="search" class="input" style="max-width:390px" placeholder="Buscar canal, deporte o liga…"></div>
 <div class="chips"><button class="chip active">Todos</button><button class="chip">NFL</button><button class="chip">NBA</button><button class="chip">MLB</button><button class="chip">NHL</button><button class="chip">Fútbol</button><button class="chip">Tenis</button><button class="chip">UFC/MMA</button></div>
 <div class="notice"><strong>Plataforma lista para probar</strong><div class="small muted">La interfaz funciona independientemente del servicio de autenticación. Los eventos en vivo se conectarán sin bloquear la aplicación.</div></div>
 <h2>Canales destacados DISH</h2><div id="channelGrid" class="grid">${channels.map(c=>`<article class="card event" data-search="${esc((c[0]+" "+c[1]+" "+c[2]).toLowerCase())}"><div class="row"><strong>${esc(c[1])}</strong><span class="badge">${esc(c[3])}</span></div><h3>Canal ${esc(c[0])}</h3><div class="small muted">📡 DISH • ${esc(c[2])}</div><div class="notice small">TV Listing</div></article>`).join("")}</div></section>
 <footer class="footer">CodeXaStacio TV Guide • v15 Fresh</footer></main>`;
 document.getElementById("account").onclick=login;
 const q=document.getElementById("search");q.oninput=()=>document.querySelectorAll("[data-search]").forEach(x=>x.classList.toggle("hidden",!x.dataset.search.includes(q.value.toLowerCase())));
}
function login(){
 app.innerHTML=`<main class="wrap"><section class="panel login"><div class="brand">CodeXaStacio TV Guide</div><p class="muted">Acceso a tu cuenta</p><form id="login"><input id="identity" class="input" placeholder="Usuario o correo" required><br><br><input id="pw" class="input" type="password" placeholder="Contraseña" required><br><br><button class="btn primary" style="width:100%">Entrar</button></form><br><button id="back" class="btn" style="width:100%">← Volver a la guía</button><div id="msg" class="small muted" style="margin-top:12px">Conectando servicio de cuenta…</div></section></main>`;
 document.getElementById("back").onclick=dashboard;
 document.getElementById("login").onsubmit=async e=>{e.preventDefault();const msg=document.getElementById("msg");if(!sb){msg.className="danger small";msg.textContent="El servicio de cuenta todavía no está disponible. La guía sí puede usarse.";return}let email=document.getElementById("identity").value.trim();if(email.toLowerCase()==="pecastacio")email=CFG.admin;if(!email.includes("@")){msg.className="danger small";msg.textContent="Usa tu correo electrónico.";return}msg.textContent="Iniciando sesión…";const {error}=await sb.auth.signInWithPassword({email,password:document.getElementById("pw").value});msg.className=error?"danger small":"ok small";msg.textContent=error?error.message:"Sesión iniciada correctamente."};
 if(sb)document.getElementById("msg").textContent="Servicio de cuenta conectado.";
}
function loadSupabase(){
 const s=document.createElement("script");s.src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.49.4/dist/umd/supabase.min.js";s.async=true;
 s.onload=()=>{try{if(window.supabase?.createClient)sb=window.supabase.createClient(CFG.url,CFG.key);else console.warn("Supabase global unavailable")}catch(e){console.warn("Supabase init",e)}};
 s.onerror=()=>console.warn("Supabase CDN unavailable; public guide remains active");
 document.head.appendChild(s);
}
dashboard();
setTimeout(loadSupabase,100);
