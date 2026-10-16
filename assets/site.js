(()=> {
 const t=document.getElementById("theme");if(localStorage.durgatheme==="dark")document.body.classList.add("dark");
 t?.addEventListener("click",()=>{document.body.classList.toggle("dark");localStorage.durgatheme=document.body.classList.contains("dark")?"dark":"light"});
 const nav=document.getElementById("mainNav");
 const menuToggle=document.getElementById("menuToggle");
 menuToggle?.addEventListener("click",()=>{const open=nav.classList.toggle("menu-open");menuToggle.setAttribute("aria-expanded",String(open));menuToggle.textContent=open?"✕":"☰"});
 fetch("/api/site-settings",{cache:"no-store"}).then(r=>r.ok?r.json():null).then(s=>{if(!s)return;
  if(s.homepage_title){const h=document.getElementById("homeTitle");if(h)h.textContent=s.homepage_title}
  if(s.homepage_description){const p=document.getElementById("homeDescription");if(p)p.textContent=s.homepage_description}
  if(s.seo_title)document.title=s.seo_title;
  if(s.search_console_verification){let m=document.querySelector('meta[name="google-site-verification"]');if(!m){m=document.createElement("meta");m.name="google-site-verification";document.head.appendChild(m)}m.content=s.search_console_verification}
  if(s.ga4_measurement_id && /^G-[A-Z0-9]{4,20}$/.test(s.ga4_measurement_id) && !document.querySelector('[data-ga4-loaded]')){const id=s.ga4_measurement_id;const g=document.createElement("script");g.async=true;g.src="https://www.googletagmanager.com/gtag/js?id="+encodeURIComponent(id);g.dataset.ga4Loaded="true";document.head.appendChild(g);window.dataLayer=window.dataLayer||[];window.gtag=function(){window.dataLayer.push(arguments)};window.gtag("js",new Date());window.gtag("config",id)}
  if(s.adsense_publisher_id && /^ca-pub-\d{8,30}$/.test(s.adsense_publisher_id) && !document.querySelector('[data-adsense-loaded]')){const a=document.createElement("script");a.async=true;a.src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client="+encodeURIComponent(s.adsense_publisher_id);a.crossOrigin="anonymous";a.dataset.adsenseLoaded="true";document.head.appendChild(a)}
  if(s.seo_description){let m=document.querySelector('meta[name="description"]');if(m)m.content=s.seo_description;let og=document.querySelector('meta[property="og:description"]');if(og)og.content=s.seo_description}
  if(Array.isArray(s.menu_items)&&nav){const theme=document.getElementById("theme"),toggle=document.getElementById("menuToggle");nav.querySelectorAll("a").forEach(a=>a.remove());for(const item of s.menu_items){const a=document.createElement("a");a.href=item.url;a.textContent=item.label;a.setAttribute("data-site-menu","");nav.insertBefore(a,theme||toggle||null)}}
 }).catch(()=>{});
 const list=document.getElementById("chapterList");if(!list)return;
 fetch("/api/chapters",{cache:"no-store"}).then(r=>r.json()).then(a=>{
  if(!Array.isArray(a))throw 0;
  list.innerHTML=a.length?a.map((x,i)=>`<a class="card content-card" href="/chapter.html?id=${encodeURIComponent(x.id)}">
   ${x.image_url?`<div class="card-image"><img src="${String(x.image_url).replace(/"/g,"&quot;")}" alt="${String(x.title||"").replace(/"/g,"&quot;")}" loading="lazy"></div>`:`<div class="card-image placeholder">ॐ</div>`}
   <div class="card-body"><span class="card-number">${String(x.chapter_number||i+1).padStart(2,"0")}</span><b>${x.title||""}</b><small>${x.subtitle||x.content_type||""}</small></div></a>`).join(""):`<div class="skeleton">Admin से सामग्री जोड़ें।</div>`;
 }).catch(()=>list.innerHTML='<div class="skeleton">विषय सूची अभी उपलब्ध नहीं है।</div>');
})();
