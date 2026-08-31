import { json, sha256, cookie, Env } from "../_shared";
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const raw = request.headers.get("Cookie") || "";
    const m = raw.match(/(?:^|; )ds_admin=([^;]+)/);
    if (m) await env.DB.prepare("DELETE FROM admin_sessions WHERE token_hash=?").bind(await sha256(m[1])).run();
    return json({ ok: true }, 200, { "Set-Cookie": cookie("", 0) });
  } catch (e: any) {
    return json({ error: e?.message || "Logout failed" }, 500);
  }
};
