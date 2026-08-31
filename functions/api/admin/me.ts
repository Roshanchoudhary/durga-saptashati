import {json,currentAdmin,Env} from "../../_shared";
export const onRequestGet:PagesFunction<Env>=async({request,env})=>{
 try{const a:any=await currentAdmin(request,env);return a?json({ok:true,username:a.username,role:a.role}):json({error:"Unauthorized"},401)}
 catch(e:any){return json({error:e?.message||"Authentication error"},500)}
};
