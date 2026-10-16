// Serve published chapter slugs through the shared reader page while keeping the clean URL in the browser.
const reserved = new Set(["", "index.html", "chapter.html", "stotra.html", "sitemap.xml", "robots.txt", "manifest.webmanifest", "favicon.ico"]);
export const onRequest: PagesFunction = async ({ request, next }) => {
  const url = new URL(request.url);
  const path = url.pathname.slice(1).replace(/\\/$/, "");
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/assets/") || url.pathname.startsWith("/admin/") || reserved.has(path) || path.includes(".")) return next();
  const rewritten = new URL("/chapter.html", url);
  rewritten.searchParams.set("slug", decodeURIComponent(path));
  return next({ request: new Request(rewritten.toString(), request) });
};
