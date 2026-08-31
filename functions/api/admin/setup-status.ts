import {json,Env} from "../../_shared";
export const onRequestGet:PagesFunction<Env>=async({env})=>{
 try{const c:any=await env.DB.prepare("SELECT COUNT(*) n FROM admins").first();return json({setupAllowed:Number(c?.n||0)===0})}
 catch(e:any){return json({error:e?.message||"Database error"},500)}
};
