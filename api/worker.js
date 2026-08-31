const cors={"Access-Control-Allow-Origin":"https://durgasaptashati.in","Access-Control-Allow-Credentials":"true","Access-Control-Allow-Headers":"Content-Type","Access-Control-Allow-Methods":"GET,POST,OPTIONS"};
const enc=new TextEncoder();
async function sha256(s){const b=await crypto.subtle.digest("SHA-256",enc.encode(s));return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,"0")).join("")}
async function pbkdf2(password,salt){const k=await crypto.subtle.importKey("raw",enc.encode(password),"PBKDF2",false,["deriveBits"]);const b=await crypto.subtle.deriveBits({name:"PBKDF2",salt:enc.encode(salt),iterations:210000,hash:"SHA-256"},k,256);return btoa(String.fromCharCode(...new Uint8Array(b)))}
function out(data,status=200,extra={}){return new Response(JSON.stringify(data),{status,headers:{"content-type":"application/json; charset=utf-8",...cors,...extra}})}
function cookie(token,maxAge=86400){return `ds_admin=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`}
async function admin(req,env){const raw=req.headers.get("Cookie")||"";const m=raw.match(/(?:^|; )ds_admin=([^;]+)/);if(!m)return null;const h=await sha256(m[1]);const x=await env.DB.prepare("SELECT a.id,a.username,a.role,s.expires_at FROM admin_sessions s JOIN admins a ON a.id=s.admin_id WHERE s.token_hash=?").bind(h).first();if(!x||Number(x.expires_at)<Math.floor(Date.now()/1000))return null;return x}
export default {async fetch(req,env){
 const u=new URL(req.url);
 if(req.method==="OPTIONS")return new Response("",{headers:cors});
 try{
  if(u.pathname==="/api/admin/login"&&req.method==="POST"){
   const x=await req.json();const a=await env.DB.prepare("SELECT * FROM admins WHERE username=?").bind(x.username||"").first();
   if(!a)return out({error:"Invalid credentials"},401);
   const hash=await pbkdf2(x.password||"",a.password_salt);
   if(hash!==a.password_hash)return out({error:"Invalid credentials"},401);
   const token=crypto.randomUUID()+"."+crypto.randomUUID(), th=await sha256(token), exp=Math.floor(Date.now()/1000)+86400;
   await env.DB.prepare("INSERT INTO admin_sessions(token_hash,admin_id,expires_at,created_at) VALUES(?,?,?,?)").bind(th,a.id,exp,Math.floor(Date.now()/1000)).run();
   return out({ok:true},200,{"Set-Cookie":cookie(token)});
  }
  if(u.pathname==="/api/admin/me"&&req.method==="GET"){const a=await admin(req,env);return a?out({ok:true,username:a.username,role:a.role}):out({error:"Unauthorized"},401)}
  if(u.pathname==="/api/admin/logout"&&req.method==="POST"){const raw=req.headers.get("Cookie")||"",m=raw.match(/(?:^|; )ds_admin=([^;]+)/);if(m)await env.DB.prepare("DELETE FROM admin_sessions WHERE token_hash=?").bind(await sha256(m[1])).run();return out({ok:true},200,{"Set-Cookie":cookie("",0)})}
  if(u.pathname==="/api/chapters"&&req.method==="GET"){const r=await env.DB.prepare("SELECT id,chapter_number,title,subtitle,slug,seo_title,seo_description FROM chapters WHERE status='published' ORDER BY chapter_number").all();return out(r.results)}
  if(u.pathname==="/api/chapter"&&req.method==="GET"){const id=u.searchParams.get("id"),x=await env.DB.prepare("SELECT * FROM chapters WHERE id=? AND status='published'").bind(id).first();if(!x)return out({error:"Not found"},404);const p=await env.DB.prepare("SELECT id FROM chapters WHERE status='published' AND chapter_number<? ORDER BY chapter_number DESC LIMIT 1").bind(x.chapter_number).first(),n=await env.DB.prepare("SELECT id FROM chapters WHERE status='published' AND chapter_number>? ORDER BY chapter_number LIMIT 1").bind(x.chapter_number).first();return out({...x,prev:p?.id||null,next:n?.id||null})}
  if(u.pathname==="/api/chapter"&&req.method==="POST"){if(!await admin(req,env))return out({error:"Unauthorized"},401);const x=await req.json();if(!x.id||!x.title||!x.chapter_number)return out({error:"Missing fields"},400);await env.DB.prepare(`INSERT INTO chapters(id,chapter_number,title,subtitle,slug,content_html,seo_title,seo_description,status,updated_at) VALUES(?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP) ON CONFLICT(id) DO UPDATE SET chapter_number=excluded.chapter_number,title=excluded.title,subtitle=excluded.subtitle,slug=excluded.slug,content_html=excluded.content_html,seo_title=excluded.seo_title,seo_description=excluded.seo_description,status=excluded.status,updated_at=CURRENT_TIMESTAMP`).bind(x.id,x.chapter_number,x.title,x.subtitle||"",x.slug||"",x.content_html||"",x.seo_title||"",x.seo_description||"",x.status||"draft").run();return out({ok:true})}
  return new Response("Not found",{status:404});
 }catch(e){return out({error:e.message},500)}
}};