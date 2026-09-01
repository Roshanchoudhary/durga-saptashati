(()=> {
 const t=document.getElementById("theme");if(localStorage.durgatheme==="dark")document.body.classList.add("dark");
 t?.addEventListener("click",()=>{document.body.classList.toggle("dark");localStorage.durgatheme=document.body.classList.contains("dark")?"dark":"light"});
 const list=document.getElementById("chapterList");if(!list)return;
 fetch("/api/chapters",{cache:"no-store"}).then(r=>r.json()).then(a=>{
  if(!Array.isArray(a))throw 0;
  list.innerHTML=a.length?a.map((x,i)=>`<a class="card content-card" href="/chapter.html?id=${encodeURIComponent(x.id)}">
   ${x.image_url?`<div class="card-image"><img src="${String(x.image_url).replace(/"/g,"&quot;")}" alt="${String(x.title||"").replace(/"/g,"&quot;")}" loading="lazy"></div>`:`<div class="card-image placeholder">ॐ</div>`}
   <div class="card-body"><span class="card-number">${String(x.chapter_number||i+1).padStart(2,"0")}</span><b>${x.title||""}</b><small>${x.subtitle||x.content_type||""}</small></div></a>`).join(""):`<div class="skeleton">Admin से सामग्री जोड़ें।</div>`;
 }).catch(()=>list.innerHTML='<div class="skeleton">विषय सूची अभी उपलब्ध नहीं है।</div>');
})();
