import { json, Env } from "../_shared";
export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  try {
    const count: any = await env.DB.prepare("SELECT COUNT(*) AS n FROM admins").first();
    return json({ setupAllowed: Number(count?.n || 0) === 0 });
  } catch (e: any) {
    return json({ error: e?.message || "Database error" }, 500);
  }
};
