import {bundledMagazines} from './bundled-magazines';
import {local,localMode} from './local';
import {get,put,list,del} from '@vercel/blob';
import {createLocalLoginLimiter} from './login-limit.mjs';
const localLoginLimit=createLocalLoginLimiter();
import {randomUUID} from 'node:crypto';
export type Kind='news'|'magazines';
export type Entry={id:string;title:string;slug:string;status:'draft'|'published'|'deleted';createdAt:string;updatedAt:string;publishedAt:string|null;[key:string]:any};
export const configured=()=>!!process.env.BLOB_READ_WRITE_TOKEN;
async function read(path:string){if(localMode())return local.read(path);const result=await get(path,{access:'private',useCache:false});if(!result||result.statusCode!==200)return null;return {value:JSON.parse(await new Response(result.stream).text()),etag:result.blob.etag};}
export async function all(kind:Kind):Promise<Entry[]>{
 if(localMode())return local.list(`content/${kind}/`);
 if(!configured())return [];
 let cursor:string|undefined;const entries:Entry[]=[];
 do{const page=await list({prefix:`content/${kind}/`,cursor,limit:1000});const values=await Promise.all(page.blobs.map(b=>read(b.pathname)));entries.push(...values.filter(Boolean).map(v=>v!.value));cursor=page.hasMore?page.cursor:undefined;}while(cursor);
 return entries;
}
export async function publicItems(kind:Kind){
 const stored=await all(kind);
 const bundled=kind==='magazines'?bundledMagazines.filter(item=>!stored.some(entry=>entry.id===item.id||entry.slug===item.slug)):[];
 return [...stored,...bundled].filter(n=>n.status==='published').sort((a,b)=>Date.parse(b.publishedAt!)-Date.parse(a.publishedAt!));
}
export async function findPublic(kind:Kind,slug:string){return (await publicItems(kind)).find(n=>n.slug===slug);}
export async function save(kind:Kind,input:any){
 if(!configured()&&!localMode())throw Error('STORAGE_UNAVAILABLE');
 const id=input.id||randomUUID();if(!/^[a-zA-Z0-9-]{1,80}$/.test(id))throw Error('ID tidak valid');
 const path=`content/${kind}/${id}.json`;const old=await read(path);
 if(old&&old.value.status==='deleted')throw Error('CONFLICT');
 if(old&&old.value.updatedAt!==input.updatedAt)throw Error('CONFLICT');
 if(input.id&&!old)throw Error('CONFLICT');
 const now=new Date(Math.max(Date.now(),old?Date.parse(old.value.updatedAt)+1:0)).toISOString();
 // Permanent UUID suffix guarantees logically unique slugs without a mutable shared index.
 const base=input.title.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,85)||'cerita';
 const value={...input,id,slug:old?.value.slug||`${base}-${id}`,createdAt:old?.value.createdAt||now,updatedAt:now,publishedAt:input.status==='published'?(old?.value.publishedAt||now):null};
 if(localMode()){await local.write(path,value,old?.etag);return value;}
 await put(path,JSON.stringify(value),{access:'private',addRandomSuffix:false,allowOverwrite:!!old,contentType:'application/json',...(old?{ifMatch:old.etag}:{})});return value;
}
export async function remove(kind:Kind,id:string,updatedAt:string){if(!configured()&&!localMode())throw Error('STORAGE_UNAVAILABLE');if(!/^[a-zA-Z0-9-]{1,80}$/.test(id))throw Error('ID tidak valid');const path=`content/${kind}/${id}.json`;const old=await read(path);if(!old||old.value.updatedAt!==updatedAt)throw Error('CONFLICT');
 // CAS tombstone avoids racing an in-flight update; retain assets until explicit media cleanup.
 if(localMode()){await local.write(path,{...old.value,status:'deleted',updatedAt:new Date().toISOString()},old.etag);return;}
 await put(path,JSON.stringify({...old.value,status:'deleted',updatedAt:new Date().toISOString()}),{access:'private',addRandomSuffix:false,allowOverwrite:true,ifMatch:old.etag,contentType:'application/json'});
}
export async function consumeLoginLimit(key:string){
 if(!configured()){
  if(import.meta.env.DEV)return localLoginLimit(key);
  throw Error('LOGIN_STORAGE_UNAVAILABLE');
 }
 const path=`security/login/${key}.json`;
 for(let i=0;i<4;i++){const old=await read(path);const now=Date.now();const fresh=!old||old.value.reset<now;const value=fresh?{count:1,reset:now+15*60000}:{...old.value,count:old.value.count+1};if(value.count>8)return false;
 try{await put(path,JSON.stringify(value),{access:'private',addRandomSuffix:false,allowOverwrite:!!old,...(old?{ifMatch:old.etag}:{})});return true;}catch{}}
 throw Error('LOGIN_STORAGE_UNAVAILABLE');
}
export async function deleteUnusedMedia(url:string){const entries=[...await all('news'),...await all('magazines')].filter(e=>e.status!=='deleted');if(entries.some(e=>[e.featuredImageUrl,e.coverUrl,e.pdfUrl,...(String(e.content||'').match(/https?:[^\s"<>]+/g)||[])].includes(url)))throw Error('Media masih dipakai konten.');if(localMode()){const {deleteLocalFile}=await import('./local-media');await deleteLocalFile(url);}else await del(url,{token:process.env.MEDIA_BLOB_READ_WRITE_TOKEN});}
