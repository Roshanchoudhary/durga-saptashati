import {json,Env,ensureContentColumns} from "../../_shared";
export const onRequestGet:PagesFunction<Env>=async({env})=>{
  try{
    await ensureContentColumns(env.DB);
    try{
      const r:any=await env.DB.prepare("SELECT id,chapter_number,title,subtitle,slug,image_url,content_type,sort_order,seo_title,seo_description FROM chapters WHERE status='published' ORDER BY sort_order,chapter_number,title").all();
      return json(r.results||[]);
    }catch{
      const r:any=await env.DB.prepare("SELECT id,chapter_number,title,subtitle,slug,seo_title,seo_description FROM chapters WHERE status='published' ORDER BY chapter_number,title").all();
      return json((r.results||[]).map((x:any)=>({...x,image_url:"",content_type:"content",sort_order:x.chapter_number||0})));
    }
  }catch(e:any){return json({error:e?.message||"Database error"},500)}
};
