import { json, currentAdmin, Env } from "../_shared";
export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const id = new URL(request.url).searchParams.get("id");
    if (!id) return json({ error: "Missing id" }, 400);
    const x: any = await env.DB.prepare("SELECT * FROM chapters WHERE id=? AND status='published'").bind(id).first();
    if (!x) return json({ error: "Not found" }, 404);

    const p: any = await env.DB.prepare(
      "SELECT id FROM chapters WHERE status='published' AND chapter_number<? ORDER BY chapter_number DESC LIMIT 1"
    ).bind(x.chapter_number).first();
    const n: any = await env.DB.prepare(
      "SELECT id FROM chapters WHERE status='published' AND chapter_number>? ORDER BY chapter_number LIMIT 1"
    ).bind(x.chapter_number).first();

    return json({ ...x, prev: p?.id || null, next: n?.id || null });
  } catch (e: any) {
    return json({ error: e?.message || "Database error" }, 500);
  }
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    if (!await currentAdmin(request, env)) return json({ error: "Unauthorized" }, 401);
    const x: any = await request.json();
    if (!x.id || !x.title || !x.chapter_number) return json({ error: "Missing fields" }, 400);

    await env.DB.prepare(`
      INSERT INTO chapters(id,chapter_number,title,subtitle,slug,content_html,seo_title,seo_description,status,updated_at)
      VALUES(?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET
        chapter_number=excluded.chapter_number,title=excluded.title,subtitle=excluded.subtitle,
        slug=excluded.slug,content_html=excluded.content_html,seo_title=excluded.seo_title,
        seo_description=excluded.seo_description,status=excluded.status,updated_at=CURRENT_TIMESTAMP
    `).bind(
      x.id, Number(x.chapter_number), x.title, x.subtitle || "", x.slug || "",
      x.content_html || "", x.seo_title || "", x.seo_description || "", x.status || "draft"
    ).run();

    return json({ ok: true });
  } catch (e: any) {
    return json({ error: e?.message || "Save failed" }, 500);
  }
};

export const onRequestDelete: PagesFunction<Env> = async ({ request, env }) => {
  try {
    if (!await currentAdmin(request, env)) return json({ error: "Unauthorized" }, 401);
    const id = new URL(request.url).searchParams.get("id");
    if (!id) return json({ error: "Missing id" }, 400);
    await env.DB.prepare("DELETE FROM chapters WHERE id=?").bind(id).run();
    return json({ ok: true });
  } catch (e: any) {
    return json({ error: e?.message || "Delete failed" }, 500);
  }
};
