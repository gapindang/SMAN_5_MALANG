import {mkdir,writeFile,readFile,unlink} from 'node:fs/promises';
import {resolve} from 'node:path';
import {randomUUID,createHash} from 'node:crypto';
import {local,localMode} from './local';
import {signatureType} from './security.mjs';
const dir=resolve(process.cwd(),'.data/uploads');
const key=(url:string)=>`media-records/${createHash('sha256').update(url).digest('hex')}.json`;
const filename=(url:string)=>{if(!/^\/uploads\/[a-f0-9-]{36}\.(jpg|png|webp|pdf)$/.test(url))throw Error('URL media tidak valid');return url.slice('/uploads/'.length);};
export async function saveLocalFile(file:File){
 if(!localMode())throw Error('Local uploads disabled');
 const types:Record<string,string>={'image/jpeg':'jpg','image/png':'png','image/webp':'webp','application/pdf':'pdf'};
 if(!types[file.type])throw Error('Format file tidak didukung.');
 if(!file.size||file.size>(file.type==='application/pdf'?50:5)*1024*1024)throw Error('Ukuran file tidak sesuai batas.');
 const bytes=new Uint8Array(await file.arrayBuffer());if(signatureType(bytes)!==file.type)throw Error('Isi file tidak cocok dengan formatnya.');
 const pathname=`${randomUUID()}.${types[file.type]}`;const url=`/uploads/${pathname}`;
 const record={url,pathname,type:file.type,size:file.size,createdAt:new Date().toISOString()};
 await mkdir(dir,{recursive:true});await writeFile(resolve(dir,pathname),bytes,{mode:0o600});
 try{await local.write(key(url),record);}catch(e){await unlink(resolve(dir,pathname));throw e;}return record;
}
export async function readLocalFile(url:string){return readFile(resolve(dir,filename(url)));}
export async function deleteLocalFile(url:string){await unlink(resolve(dir,filename(url))).catch(e=>{if(e.code!=='ENOENT')throw e;});}
export async function localMediaRecord(url:string){filename(url);return (await local.read(key(url)))?.value;}
export async function removeLocalMediaRecord(url:string){filename(url);await local.remove(key(url));}
