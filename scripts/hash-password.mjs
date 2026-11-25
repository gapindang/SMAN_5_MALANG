import {hashPassword} from '../src/lib/security.mjs';
import {createInterface} from 'node:readline/promises';
import {readFile,writeFile} from 'node:fs/promises';
const rl=createInterface({input:process.stdin,output:process.stdout});
const password=await rl.question('Password (visible in this local terminal): ');rl.close();
if(password.length<12)throw Error('Use at least 12 characters.');
const hash=hashPassword(password);
if(process.argv.includes('--write')){
 // One hash for local development and the private Vercel import file.
 const updates=[];
 for(const file of ['.env','.env.production.local']){
  let source;try{source=await readFile(file,'utf8');}catch(error){if(error.code!=='ENOENT')throw error;throw Error(`${file} is missing. Create it from .env.example first.`);}
  const line=`ADMIN_PASSWORD_HASH=${hash}`;
  source=/^ADMIN_PASSWORD_HASH=.*$/m.test(source)?source.replace(/^ADMIN_PASSWORD_HASH=.*$/m,()=>line):`${source.trimEnd()}\n${line}\n`;
  updates.push({file,source});
 }
 for(const {file,source} of updates)await writeFile(file,source);
 console.log('Password hash updated in .env and .env.production.local. Restart npm run dev. Import ADMIN_PASSWORD_HASH into Vercel and redeploy.');
}else console.log(hash);
