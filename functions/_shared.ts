export interface Env { DB: D1Database }

export async function sha256(s:string) {
  const b=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(s));
  return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,"0")).join("");
}
export async function pbkdf2(password:string,salt:string) {
  const k=await crypto.subtle.importKey("raw",new TextEncoder().encode(password),"PBKDF2",false,["deriveBits"]);
  const b=await crypto.subtle.deriveBits({name:"PBKDF2",salt:new TextEncoder().encode(salt),iterations:210000,hash:"SHA-256"},k,256);
  return btoa(String.fromCharCode(...new Uint8Array(b)));
}
export function json(data:unknown,status=200,headers:HeadersInit={}) {
  return new Response(JSON.stringify(data),{status,headers:{"content-type":"application/json; charset=utf-8",...headers}});
}
export function cookie(token:string,maxAge=86400) {
  return `ds_admin=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}
export async function currentAdmin(request:Request,env:Env) {
  const raw=request.headers.get("Cookie")||"";
  const m=raw.match(/(?:^|; )ds_admin=([^;]+)/);
  if(!m)return null;
  const row:any=await env.DB.prepare("SELECT a.id,a.username,a.role,s.expires_at FROM admin_sessions s JOIN admins a ON a.id=s.admin_id WHERE s.token_hash=?").bind(await sha256(m[1])).first();
  if(!row || Number(row.expires_at)<Math.floor(Date.now()/1000))return null;
  return row;
}
