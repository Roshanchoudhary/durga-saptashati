(()=> {
 const q=s=>document.querySelector(s), params=new URLSearchParams(location.search);
 const id=params.get("id"), slug=params.get("slug")||decodeURIComponent(location.pathname.replace(/^\/+|\/+$/g,""));
 const head=q("#head"),content=q("#content");let fs=Number(localStorage.getItem("ds-font-size")||22);
 const esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
 const href=(s,u)=>{const a=q(s);if(!a)return;if(u){a.href=u;a.removeAttribute("aria-disabled")}else{a.removeAttribute("href");a.setAttribute("aria-disabled","true")}};
 function size(){if(content)content.style.fontSize=fs+"px"}
 function applyMarkerColors(root){
   // ~ is an admin-only marker. It is never rendered.
   // Walk text nodes so existing HTML formatting is preserved.
   const nodes=[];const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
   let n;while(n=w.nextNode()) if(n.nodeValue && n.nodeValue.includes("~")) nodes.push(n);
   let tone=0;
   nodes.forEach(node=>{
     const parts=node.nodeValue.split("~");
     if(parts.length<2)return;
     const frag=document.createDocumentFragment();
     parts.forEach((part,i)=>{
       if(part){const sp=document.createElement("span");sp.className=tone%2?"marker-part tone-b":"marker-part tone-a";sp.textContent=part;frag.appendChild(sp)}
       if(i<parts.length-1)tone++;
     });
     node.parentNode.replaceChild(frag,node);
   });
 }
 function anushtubh(root){
   root.querySelectorAll('.sanskrit-text[data-chhand="anushtubh"]').forEach(el=>{
     const p=[...el.querySelectorAll("[data-pada]")];
     if(p.length===4)p.forEach((x,i)=>x.classList.add(i===0||i===3?"tone-a":"tone-b"));
   });
 }
 async function load(){
  try{
   const key=id?("id="+encodeURIComponent(id)):("slug="+encodeURIComponent(slug));
   const r=await fetch("/api/chapter?"+key,{cache:"no-store"}),x=await r.json();if(!r.ok)throw 0;
   document.title=(x.title||"दुर्गा सप्तशती")+" | दुर्गा सप्तशती";
   head.innerHTML=`${x.image_url?`<div class="post-cover"><img src="${esc(x.image_url)}" alt="${esc(x.title)}"></div>`:""}<div class="eyebrow">${esc(x.content_type||"देवी उपासना")}</div><h1>${esc(x.title)}</h1>${x.subtitle?`<p class="subtitle">${esc(x.subtitle)}</p>`:""}`;
   content.innerHTML=x.content_html||"<div class='notice'>इस पोस्ट में अभी सामग्री नहीं है।</div>";
   applyMarkerColors(content);anushtubh(content);size();
   const prevUrl=x.prev_slug?"/"+encodeURIComponent(x.prev_slug):(x.prev?"/chapter.html?id="+encodeURIComponent(x.prev):null);
   const nextUrl=x.next_slug?"/"+encodeURIComponent(x.next_slug):(x.next?"/chapter.html?id="+encodeURIComponent(x.next):null);
   ["#prev","#prevBottom"].forEach(sel=>{href(sel,prevUrl);const n=q(sel+" .nav-name");if(n)n.textContent=x.prev_title||"पिछला"});
   ["#next","#nextBottom"].forEach(sel=>{href(sel,nextUrl);const n=q(sel+" .nav-name");if(n)n.textContent=x.next_title||"अगला"});
   const bm="bookmark:"+id;if(localStorage.getItem(bm))q("#bookmark").textContent="🔖 सुरक्षित";
   q("#bookmark")?.addEventListener("click",()=>{localStorage.setItem(bm,"1");q("#bookmark").textContent="🔖 सुरक्षित"});
   q("#copy")?.addEventListener("click",async()=>{await navigator.clipboard?.writeText(content.innerText);q("#copy").textContent="✓ Copied";setTimeout(()=>q("#copy").textContent="📋 Copy",1200)});
   q("#share")?.addEventListener("click",async()=>{if(navigator.share)await navigator.share({title:x.title,url:location.href});else await navigator.clipboard?.writeText(location.href)});
   q("#plus")?.addEventListener("click",()=>{fs=Math.min(36,fs+2);localStorage.setItem("ds-font-size",fs);size()});
   q("#minus")?.addEventListener("click",()=>{fs=Math.max(16,fs-2);localStorage.setItem("ds-font-size",fs);size()});
   q("#speak")?.addEventListener("click",()=>{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(content.innerText);u.lang="hi-IN";u.rate=.82;speechSynthesis.speak(u)});
   q("#stop")?.addEventListener("click",()=>speechSynthesis.cancel());
  }catch(e){content.innerHTML="<div class='notice'>सामग्री लोड नहीं हो सकी।</div>"}
 }
 load();
})();
