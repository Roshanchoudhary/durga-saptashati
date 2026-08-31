# durgasaptashati.in — Final production architecture

## What is included
- `index.html`: homepage
- `chapter.html?id=...`: ONE common chapter template
- `stotra.html?id=...`: ONE common stotra template
- Admin Word-like rich editor for Sanskrit + Hindi
- Reader controls: speech, stop, font size, dark mode, copy, share, bookmark
- Previous / chapter list / next navigation above and below
- Cloudflare Worker + D1 schema/API
- SEO fields
- AdSense and GA4 configuration placeholders
- robots.txt, sitemap.xml, manifest

## Important
This package does not contain the religious source text. Add your own verified/permitted content through Admin.

## Before production
1. Create D1 and run `api/schema.sql`.
2. Put D1 ID into `api/wrangler.toml`.
3. Deploy the Worker and route `/api/*` to it.
4. Deploy the static root to Cloudflare Pages.
5. Protect `/admin/` and POST `/api/chapter` with Cloudflare Access or authenticated Worker logic.
6. Add your GA4 Measurement ID and AdSense Publisher/slot IDs.
7. Generate/update a dynamic sitemap for published chapters after content is added.

## Security
Do NOT deploy the POST endpoint publicly without authentication. The editor intentionally focuses on the content workflow; authentication should be enforced at the Cloudflare layer.
