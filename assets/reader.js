(() => {
  const q = s => document.querySelector(s);
  const params = new URLSearchParams(location.search);
  const id = params.get("id");
  const slug = params.get("slug") || decodeURIComponent(location.pathname.replace(/^\/+|\/+$/g, ""));
  const head=q("#head"), content=q("#content");

  let fs=Number(localStorage.getItem("ds-font-size")||22);
  let currentToken=null, utterance=null, fallbackTimer=null, speaking=false;
  let tokenList=[], boundaryMap=[], startedAt=0;

  const esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
  const applySize=()=>{if(content)content.style.fontSize=fs+"px"};
  const setHref=(sel,url)=>{const a=q(sel);if(!a)return;if(url){a.href=url;a.removeAttribute("aria-disabled")}else{a.removeAttribute("href");a.setAttribute("aria-disabled","true")}};

  function clearHighlight(){
    if(currentToken){
      currentToken.classList.remove("tts-current");
      currentToken.style.removeProperty("--tts-scale");
    }
    currentToken=null;
  }

  function prepareTokens(){
    content.querySelectorAll(".sanskrit-text,.hindi-text").forEach(block=>{
      if(block.dataset.ttsReady==="1")return;
      const walker=document.createTreeWalker(block,NodeFilter.SHOW_TEXT,{
        acceptNode:n=>n.nodeValue.trim()?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT
      });
      const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
      nodes.forEach(n=>{
        const frag=document.createDocumentFragment();
        n.nodeValue.split(/(\s+)/u).forEach(piece=>{
          if(!piece)return;
          if(/^\s+$/u.test(piece))frag.appendChild(document.createTextNode(piece));
          else{
            const span=document.createElement("span");
            span.className="tts-token";
            span.textContent=piece;
            frag.appendChild(span);
          }
        });
        n.parentNode.replaceChild(frag,n);
      });
      block.dataset.ttsReady="1";
    });
    tokenList=[...content.querySelectorAll(".tts-token")];
  }

  function tokenText(){return tokenList.map(x=>x.textContent.trim()).filter(Boolean)}

  function highlightToken(i){
    if(!tokenList.length)return;
    i=Math.max(0,Math.min(tokenList.length-1,i));
    const t=tokenList[i];
    if(t===currentToken)return;
    clearHighlight();
    currentToken=t;
    t.classList.add("tts-current");
    // Gentle zoom, not layout-breaking.
    t.style.setProperty("--tts-scale","1.16");
    t.scrollIntoView({behavior:"smooth",block:"center",inline:"nearest"});
  }

  function buildBoundaryMap(text){
    boundaryMap=[];
    let pos=0;
    tokenList.forEach((t,i)=>{
      const value=t.textContent.trim();
      const start=pos, end=pos+value.length;
      boundaryMap.push({i,start,end});
      pos=end+1;
    });
  }

  function boundaryIndex(charIndex){
    if(!boundaryMap.length)return 0;
    let lo=0,hi=boundaryMap.length-1;
    while(lo<=hi){
      const mid=(lo+hi)>>1, b=boundaryMap[mid];
      if(charIndex<b.start)hi=mid-1;
      else if(charIndex>b.end)lo=mid+1;
      else return b.i;
    }
    return Math.max(0,Math.min(boundaryMap.length-1,lo));
  }

  function clearFallback(){if(fallbackTimer){clearInterval(fallbackTimer);fallbackTimer=null}}

  // Fallback for Android engines that don't emit onboundary.
  // It is deliberately conservative; real boundary events always take priority.
  function startFallback(text,rate){
    clearFallback();
    const avgCharsPerSecond=Math.max(5,13*rate);
    const words=text.split(/\s+/u).filter(Boolean);
    let i=0, last=performance.now(), elapsed=0;
    fallbackTimer=setInterval(()=>{
      if(!speaking)return;
      const now=performance.now();
      elapsed+=(now-last)/1000;last=now;
      const total=text.length/avgCharsPerSecond;
      const fraction=Math.min(0.999,elapsed/Math.max(.1,total));
      const idx=Math.min(tokenList.length-1,Math.floor(fraction*tokenList.length));
      highlightToken(idx);
      if(i<idx)i=idx;
    },120);
  }

  function chooseVoice(lang){
    const vs=speechSynthesis.getVoices();
    const exact=vs.find(v=>v.lang.toLowerCase()===lang.toLowerCase());
    if(exact)return exact;
    const prefix=vs.find(v=>v.lang.toLowerCase().startsWith(lang.split("-")[0].toLowerCase()));
    if(prefix)return prefix;
    if(lang.startsWith("sa"))return vs.find(v=>v.lang.toLowerCase().startsWith("hi"))||vs[0]||null;
    return vs.find(v=>v.lang.toLowerCase().startsWith("hi"))||vs[0]||null;
  }

  function stop(){
    clearFallback();speechSynthesis.cancel();speaking=false;utterance=null;clearHighlight();
  }

  function speak(){
    if(!("speechSynthesis" in window)){alert("इस ब्राउज़र में पाठ सुनने की सुविधा उपलब्ध नहीं है।");return}
    prepareTokens();stop();
    const text=tokenText().join(" ");
    if(!text)return;
    buildBoundaryMap(text);
    utterance=new SpeechSynthesisUtterance(text);
    utterance.lang="sa-IN";
    utterance.voice=chooseVoice("sa-IN");
    utterance.rate=.76;
    utterance.pitch=1;
    let gotBoundary=false;
    startedAt=performance.now();

    utterance.onstart=()=>{
      speaking=true;
      startFallback(text,utterance.rate);
    };
    utterance.onboundary=e=>{
      if(typeof e.charIndex==="number"){
        gotBoundary=true;
        clearFallback();
        highlightToken(boundaryIndex(e.charIndex));
      }
    };
    utterance.onpause=()=>{clearFallback()};
    utterance.onresume=()=>{
      if(speaking&&!gotBoundary)startFallback(text,utterance.rate);
    };
    utterance.onend=()=>{
      clearFallback();speaking=false;clearHighlight();utterance=null;
    };
    utterance.onerror=()=>{
      clearFallback();speaking=false;clearHighlight();utterance=null;
    };
    speechSynthesis.speak(utterance);
  }

  async function load(){
    try{
      if(!id&&!slug)throw 0;
      const key=id?"id="+encodeURIComponent(id):"slug="+encodeURIComponent(slug);
      const r=await fetch("/api/chapter?"+key,{cache:"no-store"});
      const x=await r.json();if(!r.ok)throw 0;
      document.title=(x.title||"दुर्गा सप्तशती")+" | दुर्गा सप्तशती";
      head.innerHTML=`${x.image_url?`<div class="post-cover"><img src="${esc(x.image_url)}" alt="${esc(x.title)}"></div>`:""}<div class="eyebrow">${esc(x.content_type||"देवी उपासना")}</div><h1>${esc(x.title)}</h1>${x.subtitle?`<p class="subtitle">${esc(x.subtitle)}</p>`:""}`;
      content.innerHTML=x.content_html||"<div class='notice'>इस पोस्ट में अभी सामग्री नहीं है।</div>";

      content.querySelectorAll(".sanskrit-text").forEach(el=>{
        if(el.dataset.chhand==="anushtubh")return;
        el.innerHTML=el.innerHTML.split("~").map((part,i)=>`<span class="marker-part ${i?"tone-b":"tone-a"}">${part}</span>`).join("");
      });
      content.querySelectorAll('.sanskrit-text[data-chhand="anushtubh"]').forEach(el=>{
        [...el.querySelectorAll("[data-pada]")].forEach((p,i)=>p.classList.add(i===0||i===3?"tone-a":"tone-b"));
      });

      applySize();prepareTokens();

      const prev=x.prev_slug?"/"+encodeURIComponent(x.prev_slug):(x.prev?"/chapter.html?id="+encodeURIComponent(x.prev):null);
      const next=x.next_slug?"/"+encodeURIComponent(x.next_slug):(x.next?"/chapter.html?id="+encodeURIComponent(x.next):null);
      ["#prev","#prevBottom"].forEach(sel=>{setHref(sel,prev);const n=q(sel+" .nav-name");if(n)n.textContent=x.prev_title||"पिछला"});
      ["#next","#nextBottom"].forEach(sel=>{setHref(sel,next);const n=q(sel+" .nav-name");if(n)n.textContent=x.next_title||"अगला"});

      q("#speak")?.addEventListener("click",speak);
      q("#stop")?.addEventListener("click",stop);
      q("#plus")?.addEventListener("click",()=>{fs=Math.min(36,fs+2);localStorage.setItem("ds-font-size",fs);applySize()});
      q("#minus")?.addEventListener("click",()=>{fs=Math.max(16,fs-2);localStorage.setItem("ds-font-size",fs);applySize()});
      q("#copy")?.addEventListener("click",async()=>{await navigator.clipboard?.writeText(content.innerText);q("#copy").textContent="✓ Copied";setTimeout(()=>q("#copy").textContent="📋 Copy",1200)});
      q("#share")?.addEventListener("click",async()=>{if(navigator.share)await navigator.share({title:x.title,url:location.href});else await navigator.clipboard?.writeText(location.href)});
      const bm="bookmark:"+x.id;
      if(localStorage.getItem(bm))q("#bookmark").textContent="🔖 सुरक्षित";
      q("#bookmark")?.addEventListener("click",()=>{localStorage.setItem(bm,"1");q("#bookmark").textContent="🔖 सुरक्षित"});
      speechSynthesis.onvoiceschanged=()=>{};
    }catch(e){content.innerHTML="<div class='notice'>सामग्री लोड नहीं हो सकी।</div>"}
  }
  load();
})();
