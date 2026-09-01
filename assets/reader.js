(()=> {
 const q=s=>document.querySelector(s), params=new URLSearchParams(location.search);
 const id=params.get("id"), slug=params.get("slug")||decodeURIComponent(location.pathname.replace(/^\/+|\/+$/g,""));
 const head=q("#head"),content=q("#content");let fs=Number(localStorage.getItem("ds-font-size")||22);
 let speech=null, wordSpans=[], speechText="", speechSegments=[], activeWord=null, voices=[];
 const esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
 const href=(s,u)=>{const a=q(s);if(!a)return;if(u){a.href=u;a.removeAttribute("aria-disabled")}else{a.removeAttribute("href");a.setAttribute("aria-disabled","true")}};
 function size(){if(content)content.style.fontSize=fs+"px"}
 function applyMarkerColors(root){
   const nodes=[];const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let n;
   while(n=w.nextNode())if(n.nodeValue&&n.nodeValue.includes("~"))nodes.push(n);
   let tone=0;nodes.forEach(node=>{const parts=node.nodeValue.split("~");if(parts.length<2)return;const frag=document.createDocumentFragment();parts.forEach((part,i)=>{if(part){const sp=document.createElement("span");sp.className=tone%2?"marker-part tone-b":"marker-part tone-a";sp.textContent=part;frag.appendChild(sp)}if(i<parts.length-1)tone++});node.parentNode.replaceChild(frag,node)});
 }
 function anushtubh(root){root.querySelectorAll('.sanskrit-text[data-chhand="anushtubh"]').forEach(el=>{const p=[...el.querySelectorAll("[data-pada]")];if(p.length===4)p.forEach((x,i)=>x.classList.add(i===0||i===3?"tone-a":"tone-b"))})}
 function makeSpeakableWords(root){
   wordSpans=[];speechText="";speechSegments=[];
   const targets=[...root.querySelectorAll(".sanskrit-text,.hindi-text")];let global=0;
   targets.forEach(block=>{
     const words=[];const walker=document.createTreeWalker(block,NodeFilter.SHOW_TEXT);const nodes=[];let n;
     while(n=walker.nextNode())if(n.nodeValue?.trim())nodes.push(n);
     nodes.forEach(node=>{
       const raw=node.nodeValue||"";const re=/[^\s]+/g;let m,last=0;const frag=document.createDocumentFragment();
       while((m=re.exec(raw))){
         if(m.index>last)frag.appendChild(document.createTextNode(raw.slice(last,m.index)));
         const sp=document.createElement("span");sp.className="tts-word";sp.textContent=m[0];frag.appendChild(sp);words.push(sp);wordSpans.push(sp);last=m.index+m[0].length;
       }
       if(last<raw.length)frag.appendChild(document.createTextNode(raw.slice(last)));
       node.parentNode.replaceChild(frag,node);
     });
     if(words.length){
       const text=words.map(x=>x.textContent).join(" ");
       const offset=global;
       words.forEach((sp,i)=>{sp.dataset.start=offset+globalWordPos(words,i);sp.dataset.end=offset+globalWordEnd(words,i)});
       speechSegments.push({text,offset,words,lang:block.classList.contains("sanskrit-text")?"sa-IN":"hi-IN"});
       speechText+= (speechText?" ":"")+text;global+=text.length+1;
     }
   });
   function globalWordPos(words,i){let p=0;for(let j=0;j<i;j++)p+=words[j].textContent.length+1;return p}
   function globalWordEnd(words,i){return globalWordPos(words,i)+words[i].textContent.length}
 }
 function clearWord(){if(activeWord){activeWord.classList.remove("tts-current-word");activeWord=null}}
 function highlightAt(charIndex){
   if(!wordSpans.length)return;
   let lo=0,hi=wordSpans.length-1,found=-1;
   while(lo<=hi){const mid=(lo+hi)>>1,start=Number(wordSpans[mid].dataset.start),end=Number(wordSpans[mid].dataset.end);if(charIndex<start)hi=mid-1;else if(charIndex>=end)lo=mid+1;else{found=mid;break}}
   if(found<0){for(let i=wordSpans.length-1;i>=0;i--){if(Number(wordSpans[i].dataset.start)<=charIndex){found=i;break}}}
   if(found<0)return;const sp=wordSpans[found];if(sp===activeWord)return;clearWord();activeWord=sp;sp.classList.add("tts-current-word");
   const r=sp.getBoundingClientRect();const vh=window.innerHeight||document.documentElement.clientHeight;
   if(r.top<vh*.25||r.bottom>vh*.75)sp.scrollIntoView({behavior:"smooth",block:"center",inline:"nearest"});
 }
 function getVoice(lang){
   voices=speechSynthesis.getVoices();
   if(/^sa/i.test(lang))return voices.find(v=>/^sa(?:-|$)/i.test(v.lang)||/sanskrit/i.test(v.name))||voices.find(v=>/^hi(?:-|$)/i.test(v.lang))||voices[0];
   return voices.find(v=>/^hi(?:-|$)/i.test(v.lang))||voices[0];
 }
 function speak(){
   if(!window.speechSynthesis||!speechSegments.length)return;
   speechSynthesis.cancel();clearWord();
   let i=0;
   const status=q("#speakStatus");
   const next=()=>{
     if(i>=speechSegments.length){clearWord();if(status)status.textContent="पाठ पूरा हुआ";return}
     const seg=speechSegments[i++];const u=new SpeechSynthesisUtterance(seg.text);speech=u;u.lang=seg.lang;u.voice=getVoice(seg.lang);u.rate=.78;u.pitch=1;
     if(status)status.textContent=seg.lang.startsWith("sa")?"संस्कृत पाठ चल रहा है…":"हिन्दी अर्थ चल रहा है…";
     u.onboundary=e=>{if(typeof e.charIndex==="number")highlightAt(seg.offset+e.charIndex)};
     u.onend=next;u.onerror=()=>{clearWord();if(status)status.textContent="पाठ चलाया नहीं जा सका"};speechSynthesis.speak(u);
   };
   next();
 }
 async function load(){
  try{
   const key=id?("id="+encodeURIComponent(id)):("slug="+encodeURIComponent(slug));
   const r=await fetch("/api/chapter?"+key,{cache:"no-store"}),x=await r.json();if(!r.ok)throw 0;
   document.title=(x.title||"दुर्गा सप्तशती")+" | दुर्गा सप्तशती";
   head.innerHTML=(x.image_url?`<div class="post-cover"><img src="${esc(x.image_url)}" alt="${esc(x.title)}"></div>`:"")+`<div class="eyebrow">${esc(x.content_type||"देवी उपासना")}</div><h1>${esc(x.title)}</h1>${x.subtitle?`<p class="subtitle">${esc(x.subtitle)}</p>`:""}`;
   content.innerHTML=x.content_html||"<div class='notice'>इस पोस्ट में अभी सामग्री नहीं है।</div>";
   applyMarkerColors(content);anushtubh(content);size();makeSpeakableWords(content);
   const prevUrl=x.prev_slug?"/"+encodeURIComponent(x.prev_slug):(x.prev?"/chapter.html?id="+encodeURIComponent(x.prev):null);
   const nextUrl=x.next_slug?"/"+encodeURIComponent(x.next_slug):(x.next?"/chapter.html?id="+encodeURIComponent(x.next):null);
   ["#prev","#prevBottom"].forEach(sel=>{href(sel,prevUrl);const n=q(sel+" .nav-name");if(n)n.textContent=x.prev_title||"पिछला"});
   ["#next","#nextBottom"].forEach(sel=>{href(sel,nextUrl);const n=q(sel+" .nav-name");if(n)n.textContent=x.next_title||"अगला"});
   const bm="bookmark:"+(x.id||id||slug);if(localStorage.getItem(bm))q("#bookmark").textContent="🔖 सुरक्षित";
   q("#bookmark")?.addEventListener("click",()=>{localStorage.setItem(bm,"1");q("#bookmark").textContent="🔖 सुरक्षित"});
   q("#copy")?.addEventListener("click",async()=>{await navigator.clipboard?.writeText(content.innerText);q("#copy").textContent="✓ Copied";setTimeout(()=>q("#copy").textContent="📋 Copy",1200)});
   q("#share")?.addEventListener("click",async()=>{if(navigator.share)await navigator.share({title:x.title,url:location.href});else await navigator.clipboard?.writeText(location.href)});
   q("#plus")?.addEventListener("click",()=>{fs=Math.min(36,fs+2);localStorage.setItem("ds-font-size",fs);size()});
   q("#minus")?.addEventListener("click",()=>{fs=Math.max(16,fs-2);localStorage.setItem("ds-font-size",fs);size()});
   q("#speak")?.addEventListener("click",speak);q("#stop")?.addEventListener("click",()=>{speechSynthesis.cancel();clearWord();const st=q("#speakStatus");if(st)st.textContent="पाठ रोका गया"});
   voices=speechSynthesis.getVoices();speechSynthesis.onvoiceschanged=()=>{voices=speechSynthesis.getVoices()};
  }catch(e){content.innerHTML="<div class='notice'>सामग्री लोड नहीं हो सकी।</div>"}
 }
 load();
})();
