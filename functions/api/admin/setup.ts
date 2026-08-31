import {json,pbkdf2,Env} from "../../_shared";
export const onRequestPost:PagesFunction<Env>=async({request,env})=>{
 try{
  const c:any=await env.DB.prepare("SELECT COUNT(*) n FROM admins").first();
  if(Number(c?.n||0)>0)return json({error:"Admin already exists. Setup is closed."},403);
  const x:any=await request.json(),username=String(x.username||"").trim(),email=String(x.email||"").trim(),password=String(x.password||"");
  if(!/^[A-Za-z0-9._-]{3,40}$/.test(username))return json({error:"Username 3-40 characters: letters, numbers, . _ -"},400);
  if(password.length<10)return json({error:"Password must be at least 10 characters."},400);
  const salt=btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(16))));
  const hash=await pbkdf2(password,salt);
  await env.DB.prepare("INSERT INTO admins(id,username,email,password_hash,password_salt,role) VALUES(?,?,?,?,?,?)").bind(crypto.randomUUID(),username,email||null,hash,salt,"admin").run();
  return json({ok:true},201);
 }catch(e:any){return json({error:e?.message||"Setup failed"},500)}
};
