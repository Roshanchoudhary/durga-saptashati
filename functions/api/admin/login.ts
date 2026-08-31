import {json,pbkdf2,sha256,cookie,Env} from "../../_shared";
export const onRequestPost:PagesFunction<Env>=async({request,env})=>{
 try{
  const x:any=await request.json(),a:any=await env.DB.prepare("SELECT * FROM admins WHERE username=?").bind(String(x.username||"").trim()).first();
  if(!a)return json({error:"Invalid credentials"},401);
  if(await pbkdf2(String(x.password||""),a.password_salt)!==a.password_hash)return json({error:"Invalid credentials"},401);
  const token=crypto.randomUUID()+"."+crypto.randomUUID(),now=Math.floor(Date.now()/1000),exp=now+86400;
  await env.DB.prepare("INSERT INTO admin_sessions(token_hash,admin_id,expires_at,created_at) VALUES(?,?,?,?)").bind(await sha256(token),a.id,exp,now).run();
  return json({ok:true},200,{"Set-Cookie":cookie(token)});
 }catch(e:any){return json({error:e?.message||"Login failed"},500)}
};
