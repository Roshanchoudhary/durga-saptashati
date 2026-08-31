# Admin security

The login is enforced server-side by the Worker. A browser-only redirect is NOT security.

Configure the Worker so that these paths go to the Worker:
- `/api/*`
- `/admin/*`

If using Cloudflare Pages + a separate Worker, create a Worker route for `/admin/*` and `/api/*` on the same custom domain. The Worker should proxy/serve the Pages assets for `/admin/*` only after authentication, or use Cloudflare Access in front of `/admin/*`.

The POST chapter API always checks the secure HttpOnly session cookie.

Create the first admin using `create-admin.mjs`, then insert the generated SQL into D1. Never commit your real password.
