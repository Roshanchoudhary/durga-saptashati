# durgasaptashati.in — D1 Admin Setup

This version uses the existing Cloudflare D1 database `durgasaptashati` (ID `ad9e0e8d-3608-42f3-9ad5-c173ad20b44e`).

Admin is created from `/admin/setup.html`, not CMD. Setup is allowed only while `admins` has zero rows; after the first admin is created, setup returns 403.

Deploy the Worker in `api/` and serve the site on the same production domain. For the most reliable session cookie behavior, route `/api/*` through the Worker on `durgasaptashati.in` rather than relying on a separate workers.dev origin.
