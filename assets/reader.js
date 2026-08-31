(()=>{
  const q=s=>document.querySelector(s), id=new URLSearchParams(location.search).get('id'), c=q('#content');
  if(!c)return;

  const MIN=17, MAX=34, STEP=2, DEFAULT=22;
  const getSize=()=>Number(localStorage.getItem('durga-font-size'))||DEFAULT;
  const applySize=(n)=>{
    n=Math.min(MAX,Math.max(MIN,Number(n)||DEFAULT));
    c.style.setProperty('font-size',`${n}px`,'important');
    c.dataset.fontSize=n;
    localStorage.setItem('durga-font-size',String(n));
    const minus=q('#minus'),plus=q('#plus');
    if(minus)minus.disabled=n<=MIN;
    if(plus)plus.disabled=n>=MAX;
  };
  const plainText=()=>c.innerText.replace(/\n[ \t]*\n[ \t]*\n+/g,'\n\n').trim();
  const href=(sel,v)=>{const e=q(sel);if(e){if(v)e.href=v;else e.removeAttribute('href');e.setAttribute('aria-disabled',String(!v));}};
  const track=(n,p)=>{if(window.gtag)window.gtag('event',n,p)};

  applySize(getSize());
  q('#plus')?.addEventListener('click',()=>applySize(getSize()+STEP));
  q('#minus')?.addEventListener('click',()=>applySize(getSize()-STEP));

  q('#copy')?.addEventListener('click',async()=>{
    try{
      await navigator.clipboard.writeText(plainText());
      const b=q('#copy'),old=b.textContent;b.textContent='✓ कॉपी हुआ';setTimeout(()=>b.textContent=old,1400);
      track('copy_content',{chapter_id:id});
    }catch(e){alert('कॉपी नहीं हो सका। कृपया फिर प्रयास करें।')}
  });

  q('#share')?.addEventListener('click',async()=>{
    try{
      if(navigator.share) await navigator.share({title:document.title,url:location.href});
      else {await navigator.clipboard.writeText(location.href);alert('लिंक कॉपी हो गया है।')}
      track('share_content',{chapter_id:id});
    }catch(e){}
  });

  q('#bookmark')?.addEventListener('click',()=>{
    if(!id)return;
    localStorage[`bookmark:${id}`]='1';
    q('#bookmark').textContent='🔖 सुरक्षित';
    track('bookmark_add',{chapter_id:id});
  });

  let chunks=[], chunkIndex=0, speaking=false;
  const speakBtn=q('#speak'), stopBtn=q('#stop');
  function availableHindiVoice(){
    const vs=window.speechSynthesis?.getVoices?.()||[];
    return vs.find(v=>/^hi(-|_)/i.test(v.lang))||vs.find(v=>/hindi|india/i.test(v.name+' '+v.lang))||null;
  }
  function speakNext(){
    if(!speaking||chunkIndex>=chunks.length){speaking=false; if(speakBtn)speakBtn.textContent='🔊 पाठ सुनें'; return;}
    const u=new SpeechSynthesisUtterance(chunks[chunkIndex++]);
    u.lang='hi-IN'; u.rate=.82; u.pitch=1;
    const v=availableHindiVoice(); if(v)u.voice=v;
    u.onend=speakNext; u.onerror=()=>{speaking=false;if(speakBtn)speakBtn.textContent='🔊 पाठ सुनें'};
    window.speechSynthesis.speak(u);
  }
  window.speechSynthesis?.addEventListener?.('voiceschanged',()=>{});
  speakBtn?.addEventListener('click',()=>{
    if(!window.speechSynthesis){alert('इस browser में पाठ सुनाने की सुविधा उपलब्ध नहीं है।');return;}
    window.speechSynthesis.cancel();
    const t=plainText();
    chunks=t.match(/[^।॥!?]+[।॥!?]+|[^।॥!?]+$/g)||[t];
    // Keep speech utterances short enough for mobile browsers.
    chunks=chunks.map(x=>x.trim()).filter(Boolean).reduce((a,s)=>{
      if(!a.length||a[a.length-1].length+s.length>700)a.push(s);else a[a.length-1]+=' '+s;return a;
    },[]);
    chunkIndex=0;speaking=true;speakBtn.textContent='🔊 चल रहा है…';track('audio_play',{chapter_id:id});speakNext();
  });
  stopBtn?.addEventListener('click',()=>{window.speechSynthesis?.cancel();speaking=false;chunkIndex=0;if(speakBtn)speakBtn.textContent='🔊 पाठ सुनें'});

  if(!id){c.innerHTML='<div class="notice">अध्याय उपलब्ध नहीं है।</div>';return}
  fetch('/api/chapter?id='+encodeURIComponent(id),{credentials:'same-origin'})
    .then(r=>{if(!r.ok)throw new Error('HTTP '+r.status);return r.json()})
    .then(x=>{
      document.title=(x.title||'अध्याय')+' | दुर्गा सप्तशती';
      const h=q('#head');
      if(h)h.innerHTML=`<div class="eyebrow">${x.subtitle||'दुर्गा सप्तशती'}</div><h1>${x.title||''}</h1>`;
      c.innerHTML=`<div class="section-block">${x.content_html||''}</div>`;
      // Avoid showing the same title twice when editors paste the title into Content.
      const title=(x.title||'').replace(/\s+/g,' ').trim();
      const first=c.querySelector('h1,h2,h3');
      if(first && first.textContent.replace(/\s+/g,' ').trim()===title) first.remove();
      applySize(getSize());
      href('#prev',x.prev?'/chapter.html?id='+encodeURIComponent(x.prev):null);
      href('#next',x.next?'/chapter.html?id='+encodeURIComponent(x.next):null);
      if(localStorage[`bookmark:${id}`])q('#bookmark').textContent='🔖 सुरक्षित';
      track('chapter_open',{chapter_id:id});
    })
    .catch(()=>c.innerHTML='<div class="notice">यह अध्याय अभी उपलब्ध नहीं है।</div>');
})();
