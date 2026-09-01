FINAL v3 — PHOTO + MARKER FIX

इस version में API पहले chapters की नई columns (image_url, content_type, sort_order) मौजूद हैं या नहीं जाँचता है और missing होने पर अपने-आप बनाता है। इसलिए photo URL save करने के लिए अलग migration चलाना जरूरी नहीं होना चाहिए।

Reader में ~ invisible marker अब पूरे article के text nodes पर काम करता है; existing HTML tags टूटेंगे नहीं। ~ पर रंग A/B बदलता है। Anushtubh block में A-B-B-A रखा गया है।

Deploy करने के बाद Cloudflare Pages का नया deployment पूरा होने दें और browser में hard refresh करें (Ctrl+F5)।
