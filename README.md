# durgasaptashati.in — D1 + Secure Admin

- `index.html` homepage
- one common `chapter.html?id=...`
- one common `stotra.html?id=...`
- one full-width Word-style editor for Sanskrit + Hindi together
- all chapter content stored in D1 `content_html`
- secure admin login using HttpOnly/Secure/SameSite session cookie
- POST chapter API rejects unauthenticated users
- GA4/AdSense integration points
- Cloudflare Worker + D1

## Deployment
Cloudflare Pages serves the public static files. Cloudflare Worker handles `/api/*` and should also be routed in front of `/admin/*` on the same custom domain. This is necessary because a static Pages folder alone cannot securely hide an HTML page.

Run `api/schema.sql` in D1. Create the first admin using `api/create-admin.mjs` and insert its generated SQL into D1.

Do not expose an unauthenticated POST API. Do not rely on JavaScript-only login for security.


## Login-first
Opening `/admin/` or `/admin/index.html` checks the server-side session immediately and redirects unauthenticated users to `/admin/login.html`. The dashboard is not intentionally exposed before login. The Worker remains the actual security boundary and protects the write API.
