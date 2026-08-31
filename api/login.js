const API="https://durga-saptashati.roshanchoudhary.workers.dev";
document.getElementById("login").addEventListener("submit",async e=>{e.preventDefault();const msg=document.getElementById("msg");msg.textContent="Login हो रहा है…";
try{const r=await fetch(API+"/api/admin/login",{method:"POST",headers:{"content-type":"application/json"},credentials:"include",body:JSON.stringify({username:document.getElementById("email").value.trim(),password:document.getElementById("password").value})});
if(r.ok)location.href="/admin/index.html";else{const x=await r.json().catch(()=>({}));msg.textContent="✕ "+(x.error||"Username या password गलत है।");document.getElementById("password").value=""}}catch(e){msg.textContent="✕ Worker से connection नहीं हुआ।"}});
