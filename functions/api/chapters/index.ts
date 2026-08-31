import {json,Env} from "../../_shared";
export const onRequestGet:PagesFunction<Env>=async({env})=>{
 try{const r:any=await env.DB.prepare("SELECT id,chapter_number,title,subtitle,slug,seo_title,seo_description FROM chapters WHERE status='published' ORDER BY chapter_number").all();return json(r.results||[])}
 catch(e:any){return json({error:e?.message||"Database error"},500)}
};
