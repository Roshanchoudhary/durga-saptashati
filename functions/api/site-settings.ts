import { Env, json, currentAdmin } from "./_shared";

const DEFAULTS = {
 homepage_title: "श्री दुर्गा सप्तशती",
 homepage_description: "सम्पूर्ण पाठ, संस्कृत सामग्री और हिन्दी अर्थ के लिए सरल और तेज़ reading experience।",
 seo_title: "दुर्गा सप्तशती | सम्पूर्ण पाठ",
 seo_description: "दुर्गा सप्तशती के अध्याय, संस्कृत पाठ और हिन्दी अर्थ।",
 menu_items: [{label:"होम",url:"/"},{label:"विषय सूची",url:"/#chapters"}]
};
async function ensureTable(db:D1Database){
 await db.prepare("CREATE TABLE IF NOT EXISTS site_settings (setting_key TEXT PRIMARY KEY, setting_value TEXT NOT NULL, updated_at TEXT DEFAULT CURRENT_TIMESTAMP)").run();
}
async function readSettings(db:D1Database){
 await ensureTable(db);
 const rows:any=await db.prepare("SELECT setting_key,setting_value FROM site_settings").all();
 const out:any={...DEFAULTS};
 for(const row of rows.results||[]){try{out[row.setting_key]=JSON.parse(row.setting_value)}catch{out[row.setting_key]=row.setting_value}}
 if(!Array.isArray(out.menu_items))out.menu_items=DEFAULTS.menu_items;
 return out;
}
export const onRequestGet:PagesFunction<Env>=async({env})=>{
 try{return json(await readSettings(env.DB),200,{"cache-control":"public, max-age=60"})}
 catch(e:any){return json({...DEFAULTS,error:e?.message||"Settings unavailable"},200)}
};
export const onRequestPost:PagesFunction<Env>=async({request,env})=>{
 try{
  if(!await currentAdmin(request,env))return json({error:"Unauthorized"},401);
  const x:any=await request.json();
  const values:any={
   homepage_title:String(x.homepage_title||"").trim().slice(0,160),
   homepage_description:String(x.homepage_description||"").trim().slice(0,1000),
   seo_title:String(x.seo_title||"").trim().slice(0,180),
   seo_description:String(x.seo_description||"").trim().slice(0,320),
   menu_items:Array.isArray(x.menu_items)?x.menu_items.slice(0,20).map((m:any)=>({label:String(m.label||"").trim().slice(0,80),url:String(m.url||"").trim().slice(0,500)})).filter((m:any)=>m.label&&m.url):[]
  };
  if(!values.homepage_title||!values.seo_title||!values.menu_items.length)return json({error:"Homepage title, SEO title और कम से कम एक menu link जरूरी है।"},400);
  for(const item of values.menu_items){if(!item.url.startsWith("/")&&!/^https:\/\//i.test(item.url))return json({error:"Menu URL / या https:// से शुरू होना चाहिए।"},400)}
  await ensureTable(env.DB);
  for(const [key,value] of Object.entries(values))await env.DB.prepare("INSERT INTO site_settings(setting_key,setting_value,updated_at) VALUES(?,?,CURRENT_TIMESTAMP) ON CONFLICT(setting_key) DO UPDATE SET setting_value=excluded.setting_value,updated_at=CURRENT_TIMESTAMP").bind(key,JSON.stringify(value)).run();
  return json({ok:true});
 }catch(e:any){return json({error:e?.message||"Settings save failed"},500)}
};
