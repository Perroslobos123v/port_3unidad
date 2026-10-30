(() => {
  "use strict";
  const cfg = window.PORTFOLIO_CONFIG || {};
  const $ = (s) => document.querySelector(s);
  const unitMeta = [
    {name:"Unidad 1", subtitle:"Fundamentos y primeros descubrimientos", icon:"◈", accent:"#79e2e8", glow:"#54dce8"},
    {name:"Unidad 2", subtitle:"Construyendo conocimiento paso a paso", icon:"✧", accent:"#ad9aff", glow:"#9276ff"},
    {name:"Unidad 3", subtitle:"Nuevos retos, prácticas y soluciones", icon:"⌘", accent:"#f0a9ce", glow:"#d879b0"},
    {name:"Unidad 4", subtitle:"Integración y proyecto de aprendizaje", icon:"⬡", accent:"#f2c47c", glow:"#e8a84d"}
  ];
  const weeks = unitMeta.map((u, i) => Array.from({length:4}, (_, j) => (i*4)+j+1));
  const weekTopics = {1:"Actividades iniciales",2:"Manual y práctica SQL",3:"Diagramas y modelos",4:"Scripts SQL con datos",5:"Azure y SQL Server",6:"Guías e infografías",7:"Casos e informes",8:"Guías e infografías"};
  let activeWeek = null;
  let adminToken = sessionStorage.getItem("portfolio_admin_token") || "";
  let currentFiles = [];

  const repoReady = () => cfg.owner && cfg.repo && !cfg.owner.startsWith("TU_") && !cfg.repo.startsWith("TU_");
  const apiBase = () => `https://api.github.com/repos/${encodeURIComponent(cfg.owner)}/${encodeURIComponent(cfg.repo)}`;
  const folderFor = (week) => `${cfg.contentFolder || "contenido"}/unidad-${week.unit}/semana-${week.number}`;
  const headers = (auth=false) => ({ "Accept":"application/vnd.github+json", ...(auth && adminToken ? {"Authorization":`Bearer ${adminToken}`} : {}) });
  const showToast = (msg) => { const el=$("#toast"); el.textContent=msg; el.classList.add("show"); setTimeout(()=>el.classList.remove("show"),2600); };
  const openModal = id => $("#"+id).classList.remove("hidden");
  const closeModal = id => $("#"+id).classList.add("hidden");
  const formatSize = n => n < 1024 ? `${n} B` : n < 1048576 ? `${(n/1024).toFixed(1)} KB` : `${(n/1048576).toFixed(1)} MB`;
  const escapeHtml = s => String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const fileIcon = name => { const ext=name.split(".").pop().toLowerCase(); return ({pdf:"PDF",doc:"DOC",docx:"DOC",xls:"XLS",xlsx:"XLS",ppt:"PPT",pptx:"PPT",png:"IMG",jpg:"IMG",jpeg:"IMG",webp:"IMG",sql:"SQL",zip:"ZIP",mp4:"VID"})[ext] || "FILE"; };

  function renderUnits(){
    $("#unitGrid").innerHTML = unitMeta.map((u,i)=>`
      <article class="unit-card" style="--accent:${u.accent};--glow:${u.glow}">
        <div class="unit-top"><span class="unit-number">CAPÍTULO 0${i+1}</span><span class="unit-symbol">${u.icon}</span></div>
        <h3>${u.name}</h3><p>${u.subtitle}</p>
        <div class="week-list">${weeks[i].map(n=>`<button class="week-button" data-week="${n}"><b>${n}</b><span>Semana ${n}<small>${weekTopics[n]||"Próximamente"}</small></span></button>`).join("")}</div>
      </article>`).join("");
    $("#unitGrid").querySelectorAll("[data-week]").forEach(b=>b.addEventListener("click",()=>openWeek(Number(b.dataset.week))));
  }

  function weekInfo(number){ return {number,unit:Math.ceil(number/4)}; }
  async function listFiles(week){
    if(!repoReady()) return [];
    const path=folderFor(week);
    const url=`${apiBase()}/contents/${path.split("/").map(encodeURIComponent).join("/")}?ref=${encodeURIComponent(cfg.branch||"main")}`;
    const res=await fetch(url,{headers:headers()});
    if(res.status===404) return [];
    if(!res.ok) throw new Error(`No se pudo leer GitHub (${res.status}). Revisa la configuración del repositorio.`);
    const data=await res.json();
    return Array.isArray(data) ? data.filter(x=>x.type==="file").map(x=>({name:x.name,size:x.size,sha:x.sha,url:x.download_url,path:x.path})) : [];
  }
  async function openWeek(number){
    activeWeek=weekInfo(number);
    $("#weekKicker").textContent=`UNIDAD ${activeWeek.unit} · PORTAFOLIO`;
    $("#weekTitle").textContent=`Semana ${number}`;
    $("#fileList").innerHTML='<div class="empty-state">Cargando evidencias…</div>';
    openModal("weekModal");
    await refreshFiles();
  }
  async function refreshFiles(){
    try{
      if(!repoReady()){
        currentFiles=[];
        $("#fileList").innerHTML='<div class="empty-state">Configura primero tu usuario y repositorio en <b>config.js</b>. Luego publica el proyecto en GitHub Pages.</div>';
      } else {
        currentFiles=await listFiles(activeWeek);
        renderFiles();
      }
      $("#fileCount").textContent=`${currentFiles.length} archivo${currentFiles.length===1?"":"s"}`;
    }catch(e){$("#fileList").innerHTML=`<div class="empty-state">${escapeHtml(e.message)}</div>`;}
  }
  const relUrl = p => p.split("/").map(encodeURIComponent).join("/");
  async function openViewer(f){
    if(!f) return;
    const ext=f.name.split(".").pop().toLowerCase(), rel=relUrl(f.path), abs=new URL(rel,location.href).href;
    const body=$("#viewerBody");
    $("#viewerTitle").textContent=f.name;
    $("#viewerNew").href=rel; $("#viewerDownload").href=rel; $("#viewerDownload").setAttribute("download",f.name);
    const msg=t=>{body.innerHTML=`<div class="viewer-msg">${t}</div>`;};
    body.innerHTML='<div class="viewer-msg">Cargando archivo…</div>';
    openModal("viewerModal");
    const frame=src=>{body.innerHTML="";const fr=document.createElement("iframe");fr.src=src;fr.title=f.name;body.appendChild(fr);};
    if(["pdf","html","htm"].includes(ext)) frame(rel);
    else if(["png","jpg","jpeg","webp","gif","svg"].includes(ext)){body.innerHTML="";const im=document.createElement("img");im.src=rel;im.alt=f.name;body.appendChild(im);}
    else if(["sql","txt","md","csv","json"].includes(ext)){
      try{const r=await fetch(rel);if(!r.ok)throw 0;const t=await r.text();body.innerHTML="";const pre=document.createElement("pre");pre.className="viewer-code";pre.textContent=t;body.appendChild(pre);}
      catch(e){msg("No se pudo cargar el contenido. Pulsa <b>Descargar</b> para verlo.");}
    }
    else if(["doc","docx","ppt","pptx","xls","xlsx"].includes(ext)){
      if(/^https?:$/.test(location.protocol)&&!/^(localhost|127\.)/.test(location.hostname)) frame("https://view.officeapps.live.com/op/embed.aspx?src="+encodeURIComponent(abs));
      else msg("Los documentos de Office se muestran cuando el portafolio está publicado en GitHub Pages.");
    }
    else msg("Este tipo de archivo no se puede mostrar aquí. Pulsa <b>Descargar</b>.");
  }
  new MutationObserver(()=>{if($("#viewerModal").classList.contains("hidden"))$("#viewerBody").innerHTML="";}).observe($("#viewerModal"),{attributes:true,attributeFilter:["class"]});
  document.addEventListener("keydown",e=>{if(e.key==="Escape"){const v=$("#viewerModal");if(!v.classList.contains("hidden"))closeModal("viewerModal");}});

  function renderFiles(){
    const admin=!!adminToken;
    $("#fileList").innerHTML=currentFiles.length ? currentFiles.map((f,i)=>`
      <div class="file-item">
        <span class="file-icon">${fileIcon(f.name)}</span>
        <div class="file-info"><b>${escapeHtml(f.name)}</b><small>${formatSize(f.size)}</small></div>
        <div class="file-actions"><button class="view-button" data-view="${i}">Ver aquí</button><a href="${escapeHtml(relUrl(f.path))}" download="${escapeHtml(f.name)}">Descargar</a>${admin?`<button class="delete-button" data-delete="${escapeHtml(f.path)}" data-sha="${escapeHtml(f.sha)}">Eliminar</button>`:""}</div>
      </div>`).join("") : '<div class="empty-state">Aún no hay archivos publicados en esta semana.</div>';
    $("#fileList").querySelectorAll("[data-view]").forEach(b=>b.addEventListener("click",()=>openViewer(currentFiles[Number(b.dataset.view)])));
    $("#fileList").querySelectorAll(".file-info").forEach((el,i)=>{el.style.cursor="pointer";el.addEventListener("click",()=>openViewer(currentFiles[i]));});
    $("#fileList").querySelectorAll("[data-delete]").forEach(b=>b.addEventListener("click",()=>deleteFile(b.dataset.delete,b.dataset.sha)));
  }
  async function uploadFiles(fileList){
    if(!adminToken){showToast("Inicia sesión como administrador.");return;}
    if(!repoReady()){showToast("Configura config.js primero.");return;}
    for(const file of Array.from(fileList)){
      if(file.size>25*1024*1024){showToast(`${file.name}: supera el límite recomendado de 25 MB.`);continue;}
      try{
        const base64=await new Promise((resolve,reject)=>{
          const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).split(",")[1]);reader.onerror=reject;reader.readAsDataURL(file);
        });
        const path=`${folderFor(activeWeek)}/${file.name}`.split("/").map(encodeURIComponent).join("/");
        const url=`${apiBase()}/contents/${path}`;
        let sha;
        const existing=await fetch(`${url}?ref=${encodeURIComponent(cfg.branch||"main")}`,{headers:headers()});
        if(existing.ok){const old=await existing.json();sha=old.sha;}
        const body={message:`Agregar ${file.name} a Semana ${activeWeek.number}`,content:base64,branch:cfg.branch||"main",...(sha?{sha}:{})};
        const res=await fetch(url,{method:"PUT",headers:{...headers(true),"Content-Type":"application/json"},body:JSON.stringify(body)});
        if(!res.ok){const err=await res.json().catch(()=>({}));throw new Error(err.message||`GitHub respondió ${res.status}`);}
        showToast(`Archivo publicado: ${file.name}`);
      }catch(e){showToast(`Error al subir ${file.name}: ${e.message}`);}
    }
    $("#fileInput").value="";
    await refreshFiles();
  }
  async function deleteFile(path,sha){
    if(!confirm("¿Seguro que deseas eliminar este archivo del repositorio?"))return;
    try{
      const url=`${apiBase()}/contents/${path.split("/").map(encodeURIComponent).join("/")}`;
      const res=await fetch(url,{method:"DELETE",headers:{...headers(true),"Content-Type":"application/json"},body:JSON.stringify({message:`Eliminar ${path}`,sha,branch:cfg.branch||"main"})});
      if(!res.ok){const err=await res.json().catch(()=>({}));throw new Error(err.message||`GitHub respondió ${res.status}`);}
      showToast("Archivo eliminado del repositorio.");
      await refreshFiles();
    }catch(e){showToast(`No se pudo eliminar: ${e.message}`);}
  }

  function setAdminUI(){
    const logged=!!adminToken;
    $("#adminLoggedOut").classList.toggle("hidden",logged);
    $("#adminLoggedIn").classList.toggle("hidden",!logged);
    document.querySelectorAll(".admin-only").forEach(el=>el.classList.toggle("hidden",!logged));
    if(activeWeek)renderFiles();
  }
  async function login(){
    const token=$("#tokenInput").value.trim();
    const err=$("#adminError");err.textContent="";
    if(!token){err.textContent="Ingresa tu token de GitHub.";return;}
    if(!repoReady()){err.textContent="Completa owner y repo en config.js antes de iniciar sesión.";return;}
    try{
      const res=await fetch(`${apiBase()}`,{headers:{"Accept":"application/vnd.github+json","Authorization":`Bearer ${token}`}});
      if(!res.ok)throw new Error(res.status===401?"Token inválido o sin permisos.":`No se pudo validar el acceso (${res.status}).`);
      adminToken=token;sessionStorage.setItem("portfolio_admin_token",token);$("#tokenInput").value="";
      setAdminUI();showToast("Acceso de administrador habilitado.");
    }catch(e){err.textContent=e.message;}
  }
  function logout(){adminToken="";sessionStorage.removeItem("portfolio_admin_token");setAdminUI();showToast("Sesión cerrada.");}

  $("#adminButton").addEventListener("click",()=>{setAdminUI();openModal("adminModal");});
  $("#loginButton").addEventListener("click",login);
  $("#logoutButton").addEventListener("click",logout);
  $("#fileInput").addEventListener("change",e=>{if(e.target.files?.length)uploadFiles(e.target.files);});
  document.querySelectorAll("[data-close]").forEach(b=>b.addEventListener("click",()=>closeModal(b.dataset.close)));
  document.querySelectorAll(".modal-backdrop").forEach(back=>back.addEventListener("click",e=>{if(e.target===back)back.classList.add("hidden");}));
  $("#menuToggle").addEventListener("click",()=>$(".main-nav").classList.toggle("open"));
  document.querySelectorAll(".nav-link").forEach(a=>a.addEventListener("click",()=>{$(".main-nav").classList.remove("open");document.querySelectorAll(".nav-link").forEach(x=>x.classList.remove("active"));a.classList.add("active");}));
  /* ===== Gaia: asistente con forma de planeta Tierra ===== */
  let earthN=0;
  const LAND='<path d="M12 22 L30 12 L50 14 L58 26 L52 38 L44 50 L36 44 L24 38 Z"/><path d="M66 8 L84 8 L82 20 L70 20 Z"/><path d="M46 56 L60 58 L66 72 L58 88 L52 90 L48 74 Z"/><path d="M88 22 L110 20 L114 30 L98 34 L88 30 Z"/><path d="M92 40 L112 38 L120 54 L112 74 L102 78 L95 60 Z"/><path d="M118 18 L166 16 L174 34 L160 48 L142 52 L130 42 L118 34 Z"/><path d="M156 68 L176 64 L182 76 L166 82 Z"/><path d="M130 56 L142 58 L140 66 L132 64 Z"/>';
  function earthSVG(size){
    const id="e"+(++earthN);
    return `<svg class="earth" width="${size}" height="${size}" viewBox="0 0 100 100" aria-hidden="true">
      <defs>
        <clipPath id="${id}c"><circle cx="50" cy="50" r="48"/></clipPath>
        <radialGradient id="${id}o" cx="35%" cy="30%" r="80%"><stop offset="0" stop-color="#5cc3ff"/><stop offset=".55" stop-color="#1e6fd1"/><stop offset="1" stop-color="#0a2a66"/></radialGradient>
        <radialGradient id="${id}s" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#fff" stop-opacity=".3"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".5"/></radialGradient>
      </defs>
      <circle cx="50" cy="50" r="49.5" fill="#6ec8ff" opacity=".28"/>
      <g clip-path="url(#${id}c)">
        <rect width="100" height="100" fill="url(#${id}o)"/>
        <g class="earth-map" fill="#52d17d" stroke="#52d17d" stroke-width="1.6" stroke-linejoin="round">${LAND}<g transform="translate(200 0)">${LAND}</g></g>
        <circle cx="50" cy="50" r="48" fill="url(#${id}s)"/>
      </g>
      <g class="earth-eyes" fill="#0a1a3d"><ellipse cx="38" cy="46" rx="4" ry="5.2"/><ellipse cx="62" cy="46" rx="4" ry="5.2"/><circle cx="39.4" cy="44" r="1.4" fill="#fff"/><circle cx="63.4" cy="44" r="1.4" fill="#fff"/></g>
      <path d="M41 60 Q50 67 59 60" fill="none" stroke="#0a1a3d" stroke-width="2.4" stroke-linecap="round"/>
    </svg>`;
  }
  document.querySelectorAll("[data-earth]").forEach(el=>{el.innerHTML=earthSVG(Number(el.dataset.earth)||40);});

  const norm=s=>String(s).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9\s+#.]/g," ").replace(/\s+/g," ").trim();
  const chip=(q,label)=>`<span class="chip" data-ask="${escapeHtml(q)}">${label||q}</span>`;
  const goto=(id,label)=>`<span class="act" data-goto="${id}">${label}</span>`;
  const facts=[
    "La Tierra es el único planeta conocido con vida, y cerca del 71 % de su superficie es agua. 🌍",
    "Una base de datos es como un planeta: tiene su propia gravedad, y los datos giran a su alrededor. 🪐",
    "La Tierra da una vuelta sobre su eje cada 24 horas y una vuelta al Sol cada 365 días. ☀️",
    "SQL nació en los años 70 en IBM, y más de 50 años después sigue siendo el idioma de las bases de datos. 📚",
    "La luz del Sol tarda unos 8 minutos en llegar a la Tierra, ¡más rápido que una consulta mal indexada! ⚡"
  ];
  const intents=[
    {k:["hola","buenas","buenos dias","buenas tardes","buenas noches","saludos","hey","hello","que tal"],a:()=>`¡Hola, explorador! 🌍 Soy <b>Gaia</b>. Puedo contarte qué hay en cada unidad y semana, explicarte conceptos de Azure y SQL Server o guiarte por el portafolio. ¿Qué quieres saber?`},
    {k:["quien eres","que eres","como te llamas","tu nombre","eres un bot","gaia"],a:()=>`Soy <b>Gaia</b>, la guía de este portafolio. Tengo forma de planeta Tierra porque este es el hogar de todo el universo académico de Michael. 🌎 Respondo preguntas sobre las unidades, semanas, archivos y los conceptos del curso.`},
    {k:["que contiene","que hay","contenido","de que trata","de que se trata","que es este","portafolio","unidades","que puedo ver","que encuentro"],a:()=>`El portafolio reúne el trabajo del curso <b>Base de Datos 2</b> en <b>4 unidades</b> y <b>16 semanas</b> correlativas.<ul><li><b>Unidad 1:</b> fundamentos, manual de SQL, diagramas y scripts.</li><li><b>Unidad 2:</b> SQL Server en Azure, guías, infografías y casos.</li><li><b>Unidades 3 y 4:</b> en construcción.</li></ul>${goto("unidades","Ir a Unidades ↗")}`},
    {k:["como veo","ver archivo","ver los archivo","abrir archivo","visor","ver aqui","como abro","como leo","ver documento","ver pdf"],a:()=>`Es muy fácil: entra en <b>Unidades</b>, elige una semana y pulsa <b>Ver aquí</b> junto al archivo. Se abre dentro del portafolio, sin salir de la página. 📄${"<br>"}${goto("unidades","Ir a Unidades ↗")}`},
    {k:["descargar","bajar archivo","download","guardar archivo"],a:()=>`En cada archivo de una semana hay un enlace <b>Descargar</b>. También puedes usar <b>Abrir en pestaña nueva</b> desde el visor. ⬇️`},
    {k:["administr","subir","token","eliminar","borrar archivo","github","admin"],a:()=>`El portafolio es público para los visitantes. El botón <b>Administración</b> es solo para el dueño: con un token de GitHub puede subir o eliminar archivos directamente en el repositorio. 🔐 Los visitantes solo pueden ver y descargar.`},
    {k:["michael","autor","estudiante","quien hizo","creador","dueno","perfil","quien es","ramos","zamora"],a:()=>`Este portafolio es de <b>Ramos Zamora Michael Deyvis</b>, estudiante de <b>Ingeniería de Sistemas</b> en la Universidad Peruana Los Andes (UPLA). ✨${"<br>"}${goto("perfil","Ver su perfil ↗")}`},
    {k:["docente","profesor","ingeniero","fernandez","bejarano","maestro","catedratico"],a:()=>`El docente del curso es el <b>Ing. Raúl Enrique Fernández Bejarano</b>.`},
    {k:["curso","materia","asignatura","base de datos 2","bd2"],a:()=>`El curso es <b>Base de Datos 2</b>, de la carrera de Ingeniería de Sistemas en la UPLA. Se trabaja con SQL Server y Microsoft Azure.`},
    {k:["upla","universidad","los andes","peruana"],a:()=>`<b>UPLA</b> es la Universidad Peruana Los Andes, donde Michael estudia Ingeniería de Sistemas. 🎓`},
    {k:["azure","nube","cloud"],a:()=>`<b>Microsoft Azure</b> es la plataforma de computación en la nube de Microsoft: en vez de comprar servidores, los alquilas por internet y pagas solo lo que usas. En el curso se usa para alojar <b>Azure SQL Database</b>. ☁️${"<br>"}${goto("tecnologias","Ver Azure y SQL ↗")}`},
    {k:["sql server","sqlserver","ssms","gestor"],a:()=>`<b>SQL Server</b> es el sistema gestor de bases de datos relacionales de Microsoft. Guarda la información en tablas relacionadas y se maneja con <b>T-SQL</b>.${"<br>"}${chip("¿Qué es T-SQL?")}${chip("¿Qué es Azure?")}`},
    {k:["t-sql","tsql","ddl","dml","lenguaje sql"],a:()=>`<b>T-SQL</b> es el lenguaje de SQL Server. <b>DDL</b> sirve para crear estructuras (CREATE, ALTER, DROP) y <b>DML</b> para manejar los datos (INSERT, SELECT, UPDATE, DELETE).`},
    {k:["clave primaria","clave foranea","primary key","foreign key","llave primaria","llave foranea","pk","fk"],a:()=>`La <b>clave primaria</b> identifica de forma única cada fila de una tabla. La <b>clave foránea</b> relaciona una tabla con otra apuntando a una clave primaria. 🔑`},
    {k:["entidad relacion","entidad-relacion","modelo er","diagrama","der "],a:()=>`El <b>modelo entidad-relación</b> es un diagrama que muestra las entidades, sus atributos y cómo se relacionan. En la <b>Semana 3</b> están los diagramas de Grados y Títulos, Cadena Editorial y Empresa de Material Informático.${"<br>"}${chip("Semana 3")}`},
    {k:["filegroup","grupo de archivo","mdf","ndf","ldf","archivos logicos"],a:()=>`Un <b>filegroup</b> organiza dónde se guardan físicamente las tablas. Los archivos <b>.mdf</b> y <b>.ndf</b> guardan los datos (principal y secundarios) y el <b>.ldf</b> el registro de transacciones.`},
    {k:["esquema","schema"],a:()=>`Un <b>esquema</b> es un contenedor lógico que agrupa y ordena los objetos de la base de datos (tablas, vistas, procedimientos).`},
    {k:["servidor logico","firewall"],a:()=>`El <b>servidor lógico en Azure</b> es el punto de administración de las bases de datos de Azure SQL, con su firewall, usuarios y accesos.`},
    {k:["base de datos","que es una bd","database"],a:()=>`Una <b>base de datos</b> es un conjunto organizado de información almacenada para consultarla y actualizarla fácilmente. 🗄️${"<br>"}${chip("¿Qué es SQL Server?")}`},
    {k:["grados y titulos","grados titulos","grados"],a:()=>`<b>Grados y Títulos</b> es uno de los casos del curso. Tiene diagrama y script SQL con 10 datos de prueba (Unidad 1, Semanas 3 y 4), y luego se implementa en Azure (Unidad 2).`},
    {k:["cadena editorial","editorial"],a:()=>`<b>Cadena Editorial</b> es un caso de modelado con diagrama y script SQL con 10 datos de prueba (Unidad 1, Semanas 3 y 4).`},
    {k:["material informatico","empresa de material"],a:()=>`<b>Empresa de Material Informático</b> es otro caso de modelado, con su diagrama y script SQL de 10 datos (Unidad 1, Semanas 3 y 4).`},
    {k:["manual","manual sql"],a:()=>`El <b>Manual de SQL</b> está en la <b>Semana 2</b>, con las sentencias básicas para crear y consultar bases de datos.${"<br>"}${chip("Semana 2")}`},
    {k:["script","insert","datos de prueba"],a:()=>`Los <b>scripts SQL</b> (creación de tablas e inserción de 10 datos de prueba en cada caso) están en las <b>Semanas 3 y 4</b>.${"<br>"}${chip("Semana 4")}`},
    {k:["infografia","guia","laboratorio"],a:()=>`Las <b>guías e infografías</b> de la Unidad 2 están en las Semanas 6 y 8, junto con casos e informes en la Semana 7.${"<br>"}${chip("Semana 6")}${chip("Semana 8")}`},
    {k:["gracias","muchas gracias","genial","excelente","perfecto","ok gracias"],a:()=>`¡Con gusto! 🌍 Si necesitas algo más, aquí estaré girando por el portafolio.`},
    {k:["adios","chau","hasta luego","nos vemos","bye"],a:()=>`¡Hasta pronto, explorador! 🚀 Que tengas un buen viaje por el universo académico.`},
    {k:["dato curioso","curiosidad","sabias que","cuentame algo","dato"],a:()=>facts[Math.floor(Math.random()*facts.length)]},
    {k:["planeta","tierra","universo","espacio"],a:()=>`🌍 ${facts[Math.floor(Math.random()*facts.length)]}`},
    {k:["ayuda","que puedes hacer","que sabes","opciones","help"],a:()=>`Puedo ayudarte con:<ul><li>Qué contiene cada <b>unidad</b> o <b>semana</b> (prueba "Semana 5").</li><li>Cómo <b>ver y descargar</b> archivos.</li><li>Conceptos: <b>Azure, SQL Server, T-SQL, claves, filegroups</b>…</li><li>Datos sobre <b>Michael</b> y el curso.</li></ul>`}
  ];
  async function weekAnswer(n){
    if(n<1||n>16) return `El portafolio tiene <b>16 semanas</b>, numeradas del 1 al 16. Prueba con una de ellas. 🙂`;
    const unit=Math.ceil(n/4), topic=weekTopics[n];
    let html=`<b>Semana ${n}</b> · Unidad ${unit}`+(topic?` — ${topic}.`:` — todavía en construcción. 🛠️`);
    try{
      const files=await listFiles(weekInfo(n));
      if(files.length){
        html+=`<br>Tiene <b>${files.length}</b> archivo${files.length===1?"":"s"}:<ul>${files.slice(0,6).map(f=>`<li>${escapeHtml(f.name)}</li>`).join("")}</ul>`+(files.length>6?`y ${files.length-6} más.<br>`:"");
      } else if(topic) html+="<br>Aún no hay archivos publicados aquí.";
    }catch(e){}
    return html+`<br><span class="act" data-open-week="${n}">Abrir semana ${n} ↗</span>`;
  }
  function unitAnswer(u){
    const d={
      1:`<b>Unidad 1 · Fundamentos de bases de datos</b> (Semanas 1-4): actividades iniciales, manual de SQL, diagramas entidad-relación y scripts con datos de prueba.`,
      2:`<b>Unidad 2 · SQL Server en Azure</b> (Semanas 5-8): configuración del servidor y la base de datos, esquemas y filegroups, guías, infografías, casos e informes.`,
      3:`<b>Unidad 3</b> (Semanas 9-12): está en construcción; aquí se sumarán las nuevas prácticas. 🛠️`,
      4:`<b>Unidad 4</b> (Semanas 13-16): está en construcción; aquí irá el proyecto de integración del curso. 🛠️`
    };
    if(!d[u]) return null;
    const first=(u-1)*4+1;
    return d[u]+"<br>"+[0,1,2,3].map(i=>`<span class="act" data-open-week="${first+i}">Semana ${first+i}</span>`).join("");
  }
  async function gaiaReply(text){
    const t=norm(text);
    if(!t) return "Escríbeme tu pregunta y la exploramos juntos. 🌎";
    const w=t.match(/\bsem(?:ana)?\s*(\d{1,2})\b/);
    if(w) return weekAnswer(Number(w[1]));
    const u=t.match(/\bunidad\s*(\d)\b/);
    if(u){const r=unitAnswer(Number(u[1])); if(r) return r;}
    let best=null,score=0;
    for(const it of intents){
      let s=0;
      for(const kw of it.k){ if((" "+t+" ").includes(" "+kw+" ")) s+=kw.length+3; else if(t.includes(kw)) s+=kw.length; }
      if(s>score){score=s;best=it;}
    }
    if(best) return best.a();
    return `Mmm, esa pregunta se me escapó de la órbita. 🛰️ Puedo ayudarte con unidades, semanas, archivos, Azure o SQL Server. Prueba con:<br>${chip("¿Qué contiene?")}${chip("Semana 3")}${chip("¿Qué es Azure?")}`;
  }
  const botLog=$("#botLog");
  function addMsg(html,who){
    const el=document.createElement("div");el.className="msg "+who;
    if(who==="user")el.textContent=html;else el.innerHTML=html;
    botLog.appendChild(el);botLog.scrollTop=botLog.scrollHeight;return el;
  }
  let botBusy=false;
  async function ask(text){
    text=String(text).trim();if(!text||botBusy)return;
    botBusy=true;addMsg(text,"user");
    const typing=document.createElement("div");typing.className="msg bot typing";typing.innerHTML="<i></i><i></i><i></i>";
    botLog.appendChild(typing);botLog.scrollTop=botLog.scrollHeight;
    const [html]=await Promise.all([gaiaReply(text),new Promise(r=>setTimeout(r,450))]);
    typing.remove();addMsg(html,"bot");botBusy=false;
  }
  let greeted=false;
  function toggleBot(open){
    const p=$("#botPanel");
    const show=open===undefined?p.classList.contains("hidden"):open;
    p.classList.toggle("hidden",!show);
    if(show){
      if(!greeted){greeted=true;addMsg(`¡Saludos, explorador! 🌍 Soy <b>Gaia</b>, tu guía por este universo académico. Pregúntame por las unidades, las semanas, los archivos o conceptos como Azure y SQL Server.`,"bot");}
      setTimeout(()=>$("#botInput").focus(),50);
    }
  }
  $("#botQuick").innerHTML=["¿Qué contiene?","¿Cómo veo archivos?","¿Qué es Azure?","Semana 3","Dato curioso"].map(q=>`<button type="button" data-ask="${escapeHtml(q)}">${q}</button>`).join("");
  $("#botLaunch").addEventListener("click",()=>toggleBot());
  $("#botClose").addEventListener("click",()=>toggleBot(false));
  $("#botForm").addEventListener("submit",e=>{e.preventDefault();const i=$("#botInput");const v=i.value;i.value="";ask(v);});
  $("#botPanel").addEventListener("click",e=>{
    const a=e.target.closest("[data-ask]");if(a){ask(a.dataset.ask);return;}
    const g=e.target.closest("[data-goto]");if(g){toggleBot(false);const s=document.getElementById(g.dataset.goto);if(s)s.scrollIntoView({behavior:"smooth"});return;}
    const o=e.target.closest("[data-open-week]");if(o){toggleBot(false);openWeek(Number(o.dataset.openWeek));}
  });
  renderUnits();setAdminUI();
  if(!repoReady()) console.info("Configura config.js para conectar este portafolio con tu repositorio.");
})();