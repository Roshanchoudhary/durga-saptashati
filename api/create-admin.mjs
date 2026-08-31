// Run once locally with Node 20+ after installing Wrangler, then remove this file from public deployment.
// Usage: ADMIN_USER=admin ADMIN_PASSWORD='your-strong-password' node create-admin.mjs
import crypto from "node:crypto";
const user=process.env.ADMIN_USER, pass=process.env.ADMIN_PASSWORD;
if(!user||!pass) throw new Error("Set ADMIN_USER and ADMIN_PASSWORD");
const salt=crypto.randomBytes(16).toString("base64");
const hash=crypto.pbkdf2Sync(pass,Buffer.from(salt).toString(),210000,32,"sha256").toString("base64");
const id=crypto.randomUUID();
console.log(`INSERT INTO admins(id,username,password_hash,password_salt,role) VALUES('${id.replaceAll("'","''")}','${user.replaceAll("'","''")}','${hash}','${salt}','admin');`);
