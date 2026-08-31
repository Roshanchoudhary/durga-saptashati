import { json, pbkdf2, sha256, cookie, Env } from "../_shared";
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const x: any = await request.json();
    const username = String(x.username || "").trim();
    const password = String(x.password || "");
    const a: any = await env.DB.prepare("SELECT * FROM admins WHERE username=?").bind(username).first();
    if (!a) return json({ error: "Invalid credentials" }, 401);

    const hash = await pbkdf2(password, a.password_salt);
    if (hash !== a.password_hash) return json({ error: "Invalid credentials" }, 401);

    const token = crypto.randomUUID() + "." + crypto.randomUUID();
    const th = await sha256(token);
    const now = Math.floor(Date.now() / 1000);
    const exp = now + 86400;

    await env.DB.prepare(
      "INSERT INTO admin_sessions(token_hash,admin_id,expires_at,created_at) VALUES(?,?,?,?)"
    ).bind(th, a.id, exp, now).run();

    return json({ ok: true }, 200, { "Set-Cookie": cookie(token) });
  } catch (e: any) {
    return json({ error: e?.message || "Login failed" }, 500);
  }
};
