import {json,currentAdmin,Env,ensureContentColumns} from "../_shared";
export const onRequestGet:PagesFunction<Env>=async({request,env})=>{
 try{
  await ensureContentColumns(env.DB);
  const id=new URL(request.url).searchParams.get("id");if(!id)return json({error:"Missing id"},400);
  let x:any;
  try{x=await env.DB.prepare("SELECT * FROM chapters WHERE id=? AND status='published'").bind(id).first()}catch{ x=null }
  if(!x)return json({error:"Not found"},404);
  const p:any=await env.DB.prepare("SELECT id FROM chapters WHERE status='published' AND chapter_number<? ORDER BY chapter_number DESC LIMIT 1").bind(x.chapter_number).first();
  const n:any=await env.DB.prepare("SELECT id FROM chapters WHERE status='published' AND chapter_number>? ORDER BY chapter_number LIMIT 1").bind(x.chapter_number).first();
  return json({...x,prev:p?.id||null,next:n?.id||null,image_url:x.image_url||"",content_type:x.content_type||"content"});
 }catch(e:any){return json({error:e?.message||"Database error"},500)}
};
export const onRequestPost:PagesFunction<Env>=async({request,env})=>{
 try{
  await ensureContentColumns(env.DB);
  if(!await currentAdmin(request,env))return json({error:"Unauthorized"},401);
  const x:any=await request.json();if(!x.id||!x.title)return json({error:"ID और नाम जरूरी हैं।"},400);
  try{
   await env.DB.prepare(`INSERT INTO chapters(id,chapter_number,title,subtitle,slug,image_url,content_type,content_html,seo_title,seo_description,status,sort_order,updated_at)
   VALUES(?,?,?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP)
   ON CONFLICT(id) DO UPDATE SET chapter_number=excluded.chapter_number,title=excluded.title,subtitle=excluded.subtitle,slug=excluded.slug,
   image_url=excluded.image_url,content_type=excluded.content_type,content_html=excluded.content_html,seo_title=excluded.seo_title,
   seo_description=excluded.seo_description,status=excluded.status,sort_order=excluded.sort_order,updated_at=CURRENT_TIMESTAMP`)
   .bind(x.id,Number(x.chapter_number||0),x.title,x.subtitle||"",x.slug||"",x.image_url||"",x.content_type||"content",x.content_html||"",x.seo_title||"",x.seo_description||"",x.status||"published",Number(x.sort_order||x.chapter_number||0)).run();
  }catch{
   await env.DB.prepare(`INSERT INTO chapters(id,chapter_number,title,subtitle,slug,content_html,seo_title,seo_description,status,updated_at)
   VALUES(?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP)
   ON CONFLICT(id) DO UPDATE SET chapter_number=excluded.chapter_number,title=excluded.title,subtitle=excluded.subtitle,slug=excluded.slug,
   content_html=excluded.content_html,seo_title=excluded.seo_title,seo_description=excluded.seo_description,status=excluded.status,updated_at=CURRENT_TIMESTAMP`)
   .bind(x.id,Number(x.chapter_number||0),x.title,x.subtitle||"",x.slug||"",x.content_html||"",x.seo_title||"",x.seo_description||"",x.status||"published").run();
  }
  return json({ok:true});
 }catch(e:any){return json({error:e?.message||"Save failed"},500)}
};
export const onRequestDelete:PagesFunction<Env>=async({request,env})=>{
 try{if(!await currentAdmin(request,env))return json({error:"Unauthorized"},401);const id=new URL(request.url).searchParams.get("id");if(!id)return json({error:"Missing id"},400);await env.DB.prepare("DELETE FROM chapters WHERE id=?").bind(id).run();return json({ok:true})}
 catch(e:any){return json({error:e?.message||"Delete failed"},500)}
};
