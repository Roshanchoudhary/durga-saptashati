DURGASAPTASHATI — Pages + Functions + D1

यह package एक ही Cloudflare Pages project में website + server/API + D1 चलाने के लिए है।

1. GitHub repository की root में इस ZIP की files रखें/replace करें।
2. Cloudflare Pages project "durgasaptashati" उसी GitHub repository से deploy करें।
3. Build command खाली रखें (static site है)।
4. Build output directory: repository root / कोई अलग output directory नहीं।
5. wrangler.toml root में मौजूद है और D1 binding DB -> durgasaptashati सेट है।
6. D1 में पहले से बनाई गई tables रहने दें।
7. Deploy के बाद:
   /admin/setup.html
   खोलें और पहला Admin browser से बनाएँ।
8. Admin बनने के बाद setup दोबारा बंद रहेगा।
9. Login:
   /admin/login.html
10. Dashboard:
   /admin/index.html

महत्वपूर्ण: अलग Worker/API deploy करने की जरूरत नहीं है। Pages Functions ही /api/* संभालते हैं।
