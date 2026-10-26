import { Env, ensureContentColumns } from "./_shared";

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const origin = new URL(request.url).origin;

  try {
    await ensureContentColumns(env.DB);
    const result: any = await env.DB.prepare(
      "SELECT id FROM chapters WHERE status='published' ORDER BY sort_order, chapter_number, title"
    ).all();

    // These are the actual public reader URLs used by the site.
    const urls = [
      origin + "/",
      origin + "/stotra.html",
      ...(result.results || []).map((row: any) =>
        origin + "/chapter.html?id=" + encodeURIComponent(String(row.id))
      ),
    ];

    const xml =
      '<?xml version="1.0" encoding="UTF-8"?>' +
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' +
      urls
        .map((url) => "<url><loc>" + url.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") + "</loc></url>")
        .join("") +
      "</urlset>";

    return new Response(xml, {
      headers: {
        "content-type": "application/xml; charset=utf-8",
        "cache-control": "public, max-age=300",
      },
    });
  } catch {
    return new Response("Sitemap unavailable", {
      status: 500,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }
};
