(()=> {
 const q=s=>document.querySelector(s), params=new URLSearchParams(location.search);
 const id=params.get("id"), slug=params.get("slug")||decodeURIComponent(location.pathname.replace(/^\/+|\/+$/g,""));
 const head=q("#head"),content=q("#content");let fs=Number(localStorage.getItem("ds-font-size")||22);
 let speech=null, wordSpans=[], speechText="", speechSegments=[], activeWord=null, voices=[];
 const esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
 const href=(s,u)=>{const a=q(s);if(!a)return;if(u){a.href=u;a.removeAttribute("aria-disabled")}else{a.removeAttribute("href");a.setAttribute("aria-disabled","true")}};
 function size(){if(content)content.style.fontSize=fs+"px";scheduleTonePaint()}
 const VIRAMA="\u094D",ZWJ="\u200D",ZWNJ="\u200C",MARK=/\p{M}/u;
 const isJoining=c=>c===VIRAMA||c===ZWJ||c===ZWNJ||MARK.test(c);
 // Virama/ZWJ/ZWNJ bind to whatever follows them, so a cut may not be placed
 // right after one; a matra or nukta already binds to its own base on the left.
 const bindsRight=c=>c===VIRAMA||c===ZWJ||c===ZWNJ;
 function isSafeCut(text,i){
   if(i<=0||i>=text.length)return false;
   if(isJoining(text[i])||bindsRight(text[i-1]))return false;
   if(i>1&&(text[i-2]===ZWJ||text[i-2]===ZWNJ))return false;
   return true;
 }
 // Fallback path only (no background-clip:text support): snap every "~" back to
 // a cluster boundary so a split can never break a conjunct.
 function planSegments(raw,startTone){
   const marks=[];let clean="";
   for(let i=0;i<raw.length;i++){if(raw[i]==="~")marks.push(clean.length);else clean+=raw[i]}
   const cuts=marks.map(m=>{
     if(m>=clean.length)return clean.length;
     if(isSafeCut(clean,m))return m;
     for(let i=m;i>0;i--)if(isSafeCut(clean,i))return i;
     return 0;
   }).sort((a,b)=>a-b).filter((c,i,a)=>i===0||c!==a[i-1]);
   const segs=[];let tone=startTone,prev=0;
   cuts.forEach(cut=>{if(cut>prev)segs.push({text:clean.slice(prev,cut),tone:tone});tone=1-tone;prev=cut});
   if(prev<clean.length)segs.push({text:clean.slice(prev),tone:tone});
   return segs;
 }
 const TONE_HEX=["#9b1c1c","#246b32"];
 const toneInks=new Map();
 function gradientTextOK(){try{return CSS.supports("-webkit-background-clip","text")||CSS.supports("background-clip","text")}catch(e){return false}}
 const toneBlock=node=>node.parentElement?node.parentElement.closest(".sanskrit-text,.hindi-text"):null;
 // Character offset -> a live Range, re-resolved on every repaint because the TTS
 // pass re-wraps the same text in .tts-word spans.
 function rangeAt(ink,offset){
   const r=document.createRange(),w=document.createTreeWalker(ink,NodeFilter.SHOW_TEXT);
   let seen=0,last=null,n;
   while(n=w.nextNode()){last=n;const len=n.nodeValue.length;if(seen+len>offset){r.setStart(n,offset-seen);r.setEnd(n,Math.min(len,offset-seen+1));return r}seen+=len}
   if(last){r.setStart(last,Math.max(0,last.nodeValue.length-1));r.setEnd(last,last.nodeValue.length);return r}
   return null;
 }
 // Pure: one gradient layer per line box, with a hard stop at each "~" pixel on
 // that line, so a wrapped verse still changes tone at the exact marker.
 function buildToneLayers(lines){
   let tone=lines.length&&lines[0].marks.length?lines[0].marks[0].before:0;
   return {layers:lines.map(line=>{
     const ms=[...line.marks].sort((a,b)=>a.x-b.x),stops=[];let t=tone,prev=0;
     if(!ms.length)stops.push(`${TONE_HEX[t]} 0px`,`${TONE_HEX[t]} 100%`);
     else{
       ms.forEach(m=>{const x=Math.max(prev,Math.round(m.x));stops.push(`${TONE_HEX[t]} ${prev}px`,`${TONE_HEX[t]} ${x}px`);prev=x;t=m.after});
       stops.push(`${TONE_HEX[t]} ${prev}px`,`${TONE_HEX[t]} 100%`);
     }
     if(ms.length)tone=ms[ms.length-1].after;
     return {image:`linear-gradient(to right,${stops.join(",")})`,size:`100% ${Math.round(line.height)}px`,pos:`0px ${Math.round(line.top)}px`};
   }),lastTone:tone};
 }
 function paintInk(ink,markers){
   const clear=()=>{ink.style.backgroundImage="";ink.style.backgroundSize="";ink.style.backgroundPosition="";ink.style.backgroundClip="";ink.style.webkitBackgroundClip="";ink.style.color="";ink.style.webkitTextFillColor=""};
   const r=document.createRange();
   r.selectNodeContents(ink);
   const lines=[];
   [...r.getClientRects()].forEach(rect=>{
     if(rect.width<=0&&rect.height<=0)return;
     let line=lines.find(l=>Math.abs(l.top-rect.top)<=2);
     if(!line)lines.push({top:rect.top,height:rect.height,marks:[]});
     else line.height=Math.max(line.height,rect.height);
   });
   lines.sort((a,b)=>a.top-b.top);
   if(!lines.length){clear();return}
   const box=ink.getBoundingClientRect(),cs=getComputedStyle(ink);
   const ox=box.left+(parseFloat(cs.borderLeftWidth)||0),oy=box.top+(parseFloat(cs.borderTopWidth)||0);
   markers.forEach(m=>{
     const mr=rangeAt(ink,m.offset);
     if(!mr)return;
     let rects=[...mr.getClientRects()].filter(x=>x.width>0),x,top;
     if(rects.length){x=rects[0].left-ox;top=rects[0].top}
     else{
       // zero-width glyph (a space swallowed by a line wrap, for example)
       const br=rangeAt(ink,Math.max(0,m.offset-1));
       rects=br?[...br.getClientRects()].filter(x=>x.width>0):[];
       if(!rects.length)return;
       x=rects[0].right-ox;top=rects[0].top;
     }
     m.x=x;
     const line=lines.find(l=>top>=l.top-3&&top<l.top+l.height)||lines[lines.length-1];
     line.marks.push(m);
   });
   // 4px overlap per band keeps tall matras and descenders coloured; the first
   // background layer is painted on top, so a glyph keeps its own line's tone.
   const pad=4;
   const built=buildToneLayers(lines.map(l=>({top:l.top-oy-pad,height:l.height+2*pad,marks:l.marks})));
   ink.style.backgroundImage=built.layers.map(l=>l.image).join(",");
   ink.style.backgroundSize=built.layers.map(l=>l.size).join(",");
   ink.style.backgroundPosition=built.layers.map(l=>l.pos).join(",");
   ink.style.backgroundRepeat="no-repeat";
   ink.style.backgroundClip="text";
   ink.style.webkitBackgroundClip="text";
   ink.style.color="transparent";
   ink.style.webkitTextFillColor="transparent";
 }
 let toneTimer=0;
 function scheduleTonePaint(){
   if(!toneInks.size)return;
   clearTimeout(toneTimer);
   toneTimer=setTimeout(()=>toneInks.forEach((markers,ink)=>paintInk(ink,markers)),60);
 }
 // Pure: deletes "~" from one text node and reports where each marker sits in
 // the cleaned text, so the colour change can be painted at that exact offset.
 function stripMarkers(raw,base,tone){
   let clean="",seen=0;const marks=[];
   for(let i=0;i<raw.length;i++){
     if(raw[i]==="~"){marks.push({offset:base+seen,before:tone,after:1-tone});tone=1-tone}
     else{clean+=raw[i];seen++}
   }
   return {clean,marks,tone};
 }
 // Exact tones: "~" is only deleted from the text node (no element is inserted,
 // so the shaping run is untouched and क्ष/न्दु/क्त्र stay joined). The colour
 // change is painted at the marker's exact pixel, one gradient layer per line.
 function applyExactTones(root){
   const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT),nodes=[];let n;
   while(n=w.nextNode())if(n.nodeValue&&n.nodeValue.includes("~"))nodes.push(n);
   const byBlock=new Map(),consumed=new Map();
   let tone=0;
   nodes.forEach(node=>{
     const block=toneBlock(node),raw=node.nodeValue;
     if(!block){
       const segs=planSegments(raw,tone);
       if(segs.length)tone=1-segs[segs.length-1].tone;
       const frag=document.createDocumentFragment();
       segs.forEach(s=>{const sp=document.createElement("span");sp.className=s.tone?"marker-part tone-b":"marker-part tone-a";sp.textContent=s.text;frag.appendChild(sp)});
       node.parentNode.replaceChild(frag,node);
       return;
     }
     const res=stripMarkers(raw,consumed.get(block)||0,tone);
     tone=res.tone;node.nodeValue=res.clean;
     consumed.set(block,(consumed.get(block)||0)+res.clean.length);
     if(!byBlock.has(block))byBlock.set(block,[]);
     res.marks.forEach(m=>byBlock.get(block).push(m));
   });
   byBlock.forEach((list,block)=>{
     let ink=block.querySelector(":scope > .tone-ink");
     if(!ink){ink=document.createElement("div");ink.className="tone-ink";while(block.firstChild)ink.appendChild(block.firstChild);block.appendChild(ink)}
     toneInks.set(ink,list);
     paintInk(ink,list);
   });
 }
 function applyToneSpans(root){
   const nodes=[];const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let n;
   while(n=w.nextNode())if(n.nodeValue&&n.nodeValue.includes("~"))nodes.push(n);
   let tone=0;
   nodes.forEach(node=>{
     const segs=planSegments(node.nodeValue,tone);
     if(segs.length)tone=1-segs[segs.length-1].tone;
     const frag=document.createDocumentFragment();
     segs.forEach(s=>{const sp=document.createElement("span");sp.className=s.tone?"marker-part tone-b":"marker-part tone-a";sp.textContent=s.text;frag.appendChild(sp)});
     node.parentNode.replaceChild(frag,node);
   });
 }
 function applyMarkerColors(root){gradientTextOK()?applyExactTones(root):applyToneSpans(root)}
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
 addEventListener("resize",scheduleTonePaint);
 if(document.fonts&&document.fonts.ready)document.fonts.ready.then(scheduleTonePaint);
 load();
})();
