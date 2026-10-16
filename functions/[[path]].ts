// Serve published chapter slugs through the shared reader page while keeping the clean URL in the browser.
const reserved = new Set(["", "index.html", "chapter.html", "stotra.html", "sitemap.xml", "robots.txt", "manifest.webmanifest", "favicon.ico"]);

export const onRequest: PagesFunction = async ({ request, next }) => {
  const url = new URL(request.url);
  const path = url.pathname.slice(1).replace(/\/$/, "");

  if (request.method !== "GET" && request.method !== "HEAD") return next();
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/assets/") ||
    url.pathname.startsWith("/admin/") ||
    path === "admin" ||
    reserved.has(path) ||
    path.includes(".")
  ) {
    return next();
  }

  // A malformed percent escape in a URL must not crash the Pages Worker (Error 1101).
  let slug: string;
  try {
    slug = decodeURIComponent(path);
  } catch {
    return next();
  }

  const rewritten = new URL("/chapter.html", url);
  rewritten.searchParams.set("slug", slug);

  // Preserve the original request options while rewriting only the URL.
  return next(new Request(rewritten.toString(), request));
};
