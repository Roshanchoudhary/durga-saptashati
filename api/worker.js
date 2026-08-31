const json=(data,status=200,extra={})=>new Response(JSON.stringify(data),{status,headers:{"content-type":"application/json; charset=utf-8","cache-control":"public, max-age=60",...extra}});
export default {async fetch(req,env){
 const u=new URL(req.url);
 if(req.method==="OPTIONS") return new Response("",{headers:{"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"Content-Type","Access-Control-Allow-Credentials":"true"}});
 try{
  if(u.pathname==="/api/chapters"&&req.method==="GET"){
   const r=await env.DB.prepare("SELECT id,chapter_number,title,subtitle,slug,seo_title,seo_description FROM chapters WHERE status='published' ORDER BY chapter_number").all();
   return json(r.results);
  }
  if(u.pathname==="/api/chapter"&&req.method==="GET"){
   const id=u.searchParams.get("id");
   const x=await env.DB.prepare("SELECT * FROM chapters WHERE id=? AND status='published'").bind(id).first();
   if(!x)return json({error:"Not found"},404);
   const p=await env.DB.prepare("SELECT id FROM chapters WHERE status='published' AND chapter_number<? ORDER BY chapter_number DESC LIMIT 1").bind(x.chapter_number).first();
   const n=await env.DB.prepare("SELECT id FROM chapters WHERE status='published' AND chapter_number>? ORDER BY chapter_number LIMIT 1").bind(x.chapter_number).first();
   return json({...x,prev:p?.id||null,next:n?.id||null});
  }
  if(u.pathname==="/api/chapter"&&req.method==="POST"){
   // IMPORTANT: protect this endpoint with Cloudflare Access or authenticated Worker logic before production.
   const x=await req.json();
   if(!x.id||!x.title||!x.chapter_number)return json({error:"Missing fields"},400);
   await env.DB.prepare(`INSERT INTO chapters(id,chapter_number,title,subtitle,slug,content_html,seo_title,seo_description,status,updated_at)
   VALUES(?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP)
   ON CONFLICT(id) DO UPDATE SET chapter_number=excluded.chapter_number,title=excluded.title,subtitle=excluded.subtitle,slug=excluded.slug,content_html=excluded.content_html,seo_title=excluded.seo_title,seo_description=excluded.seo_description,status=excluded.status,updated_at=CURRENT_TIMESTAMP`)
   .bind(x.id,x.chapter_number,x.title,x.subtitle||"",x.slug||"",x.content_html||"",x.seo_title||"",x.seo_description||"",x.status||"draft").run();
   return json({ok:true});
  }
  return new Response("Not found",{status:404});
 }catch(e){return json({error:e.message},500)}
}};