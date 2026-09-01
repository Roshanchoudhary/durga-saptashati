(() => {
  const q = s => document.querySelector(s);
  const params = new URLSearchParams(location.search);
  const id = params.get("id");
  const slug = params.get("slug") || decodeURIComponent(location.pathname.replace(/^\/+|\/+$/g, ""));
  const head = q("#head"), content = q("#content");

  let fs = Number(localStorage.getItem("ds-font-size") || 22);
  let activeUtterance = null;
  let speaking = false;
  let currentToken = null;

  const esc = s => String(s ?? "").replace(/[&<>"']/g, m =>
    ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[m])
  );

  function applySize() {
    if (content) content.style.fontSize = fs + "px";
  }

  function href(sel, url) {
    const a = q(sel);
    if (!a) return;
    if (url) {
      a.href = url;
      a.removeAttribute("aria-disabled");
    } else {
      a.removeAttribute("href");
      a.setAttribute("aria-disabled", "true");
    }
  }

  function clearHighlight() {
    if (currentToken) currentToken.classList.remove("tts-current");
    currentToken = null;
  }

  // Convert visible text into word spans while preserving existing HTML.
  // We intentionally do this only inside readable Sanskrit/Hindi blocks.
  function prepareTtsTokens() {
    content.querySelectorAll(".sanskrit-text, .hindi-text").forEach(block => {
      if (block.dataset.ttsReady === "1") return;

      const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT, {
        acceptNode(node) {
          if (!node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
          if (node.parentElement.closest(".tts-current")) return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        }
      });

      const nodes = [];
      while (walker.nextNode()) nodes.push(walker.currentNode);

      nodes.forEach(node => {
        const text = node.nodeValue;
        const frag = document.createDocumentFragment();
        // Keep punctuation attached to words; whitespace is preserved.
        const pieces = text.split(/(\s+)/u);

        pieces.forEach(piece => {
          if (!piece) return;
          if (/^\s+$/u.test(piece)) {
            frag.appendChild(document.createTextNode(piece));
          } else {
            const span = document.createElement("span");
            span.className = "tts-token";
            span.textContent = piece;
            frag.appendChild(span);
          }
        });
        node.parentNode.replaceChild(frag, node);
      });

      block.dataset.ttsReady = "1";
    });
  }

  function visibleWords() {
    return [...content.querySelectorAll(".tts-token")].filter(el => el.textContent.trim());
  }

  function getReadableText() {
    return visibleWords().map(x => x.textContent).join(" ");
  }

  // Find the token corresponding to speechSynthesis's character boundary.
  function highlightBoundary(charIndex) {
    const tokens = visibleWords();
    if (!tokens.length) return;

    let pos = 0;
    let best = tokens[0];

    for (const token of tokens) {
      const len = token.textContent.length;
      if (charIndex >= pos && charIndex <= pos + len) {
        best = token;
        break;
      }
      pos += len + 1;
    }

    if (currentToken === best) return;
    clearHighlight();
    currentToken = best;
    currentToken.classList.add("tts-current");

    // Keep the word near the comfortable reading area.
    currentToken.scrollIntoView({
      behavior: "smooth",
      block: "center",
      inline: "nearest"
    });
  }

  function chooseVoice(lang) {
    const voices = speechSynthesis.getVoices();
    if (!voices.length) return null;

    const exact = voices.find(v => v.lang.toLowerCase() === lang.toLowerCase());
    if (exact) return exact;

    const prefix = voices.find(v => v.lang.toLowerCase().startsWith(lang.split("-")[0].toLowerCase()));
    if (prefix) return prefix;

    // Sanskrit fallback: prefer Hindi only when Sanskrit is unavailable.
    if (lang.startsWith("sa")) {
      return voices.find(v => v.lang.toLowerCase().startsWith("hi")) || voices[0];
    }
    return voices.find(v => v.lang.toLowerCase().startsWith("hi")) || voices[0];
  }

  function speak() {
    if (!("speechSynthesis" in window)) {
      alert("इस ब्राउज़र में पाठ सुनने की सुविधा उपलब्ध नहीं है।");
      return;
    }

    prepareTtsTokens();
    clearHighlight();
    speechSynthesis.cancel();

    const text = getReadableText();
    if (!text.trim()) return;

    const u = new SpeechSynthesisUtterance(text);
    u.lang = "sa-IN";
    u.voice = chooseVoice("sa-IN") || null;
    u.rate = 0.78;
    u.pitch = 1;

    u.onstart = () => { speaking = true; };
    u.onboundary = e => {
      // Most Chromium Android TTS engines report word boundaries.
      if (typeof e.charIndex === "number") highlightBoundary(e.charIndex);
    };
    u.onend = () => {
      speaking = false;
      clearHighlight();
    };
    u.onerror = () => {
      speaking = false;
      clearHighlight();
    };

    activeUtterance = u;
    speechSynthesis.speak(u);
  }

  function stop() {
    speechSynthesis.cancel();
    speaking = false;
    clearHighlight();
  }

  async function load() {
    try {
      if (!id && !slug) throw new Error("missing");
      const key = id ? ("id=" + encodeURIComponent(id)) : ("slug=" + encodeURIComponent(slug));
      const r = await fetch("/api/chapter?" + key, { cache: "no-store" });
      const x = await r.json();
      if (!r.ok) throw new Error(x.error || "Not found");

      document.title = (x.title || "दुर्गा सप्तशती") + " | दुर्गा सप्तशती";

      head.innerHTML =
        `${x.image_url ? `<div class="post-cover"><img src="${esc(x.image_url)}" alt="${esc(x.title)}"></div>` : ""}` +
        `<div class="eyebrow">${esc(x.content_type || "देवी उपासना")}</div>` +
        `<h1>${esc(x.title)}</h1>` +
        `${x.subtitle ? `<p class="subtitle">${esc(x.subtitle)}</p>` : ""}`;

      content.innerHTML = x.content_html || "<div class='notice'>इस पोस्ट में अभी सामग्री नहीं है।</div>";

      // Invisible ~ marker: toggle colour, never show the marker itself.
      content.querySelectorAll(".sanskrit-text").forEach(el => {
        if (el.dataset.chhand === "anushtubh") return;
        el.innerHTML = el.innerHTML.split("~").map((part, i) =>
          `<span class="marker-part ${i % 2 ? "tone-b" : "tone-a"}">${part}</span>`
        ).join("");
      });

      content.querySelectorAll('.sanskrit-text[data-chhand="anushtubh"]').forEach(el => {
        const p = [...el.querySelectorAll("[data-pada]")];
        if (p.length === 4) p.forEach((x, i) => x.classList.add(i === 0 || i === 3 ? "tone-a" : "tone-b"));
      });

      applySize();
      prepareTtsTokens();

      const prevUrl = x.prev_slug ? "/" + encodeURIComponent(x.prev_slug) :
        (x.prev ? "/chapter.html?id=" + encodeURIComponent(x.prev) : null);
      const nextUrl = x.next_slug ? "/" + encodeURIComponent(x.next_slug) :
        (x.next ? "/chapter.html?id=" + encodeURIComponent(x.next) : null);

      ["#prev", "#prevBottom"].forEach(sel => {
        href(sel, prevUrl);
        const n = q(sel + " .nav-name");
        if (n) n.textContent = x.prev_title || "पिछला";
      });
      ["#next", "#nextBottom"].forEach(sel => {
        href(sel, nextUrl);
        const n = q(sel + " .nav-name");
        if (n) n.textContent = x.next_title || "अगला";
      });

      q("#speak")?.addEventListener("click", speak);
      q("#stop")?.addEventListener("click", stop);

      q("#plus")?.addEventListener("click", () => {
        fs = Math.min(36, fs + 2);
        localStorage.setItem("ds-font-size", fs);
        applySize();
      });
      q("#minus")?.addEventListener("click", () => {
        fs = Math.max(16, fs - 2);
        localStorage.setItem("ds-font-size", fs);
        applySize();
      });

      q("#copy")?.addEventListener("click", async () => {
        await navigator.clipboard?.writeText(content.innerText);
        q("#copy").textContent = "✓ Copied";
        setTimeout(() => q("#copy").textContent = "📋 Copy", 1200);
      });

      q("#share")?.addEventListener("click", async () => {
        if (navigator.share) await navigator.share({ title: x.title, url: location.href });
        else await navigator.clipboard?.writeText(location.href);
      });

      const bm = "bookmark:" + x.id;
      if (localStorage.getItem(bm)) q("#bookmark").textContent = "🔖 सुरक्षित";
      q("#bookmark")?.addEventListener("click", () => {
        localStorage.setItem(bm, "1");
        q("#bookmark").textContent = "🔖 सुरक्षित";
      });

      // Voice list may load after page load; keep the browser's list warm.
      speechSynthesis.onvoiceschanged = () => {};
    } catch (e) {
      content.innerHTML = "<div class='notice'>सामग्री लोड नहीं हो सकी।</div>";
    }
  }

  load();
})();
