import { Env } from "./_shared";

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  try {
    await env.DB.prepare("CREATE TABLE IF NOT EXISTS site_settings (setting_key TEXT PRIMARY KEY, setting_value TEXT NOT NULL, updated_at TEXT DEFAULT CURRENT_TIMESTAMP)").run();
    const row:any = await env.DB.prepare("SELECT setting_value FROM site_settings WHERE setting_key='adsense_publisher_id'").first();
    let publisher = "";
    if (row?.setting_value) {
      try { publisher = JSON.parse(row.setting_value); } catch { publisher = String(row.setting_value); }
    }
    const match = /^ca-pub-(\d{8,30})$/.exec(String(publisher || ""));
    const body = match ? "google.com, pub-" + match[1] + ", DIRECT, f08c47fec0942fa0\n" : "";
    return new Response(body, { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=300" } });
  } catch {
    return new Response("", { status: 200, headers: { "content-type": "text/plain; charset=utf-8" } });
  }
};
