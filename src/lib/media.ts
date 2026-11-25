import {local,localMode} from './local';
import {localMediaRecord,removeLocalMediaRecord} from './local-media';
import {createHash} from 'node:crypto';import {put,get,list,del} from '@vercel/blob';import {signatureType} from './security.mjs';
const recordPath=(url:string)=>`media-records/${createHash('sha256').update(url).digest('hex')}.json`;
export async function validateUploaded(blob:{url:string;pathname:string},expected:string){
 if(!/^https:\/\/[^/]+\.public\.blob\.vercel-storage\.com\/media\//.test(blob.url))throw Error('URL media tidak valid');
 const response=await fetch(blob.url,{headers:{Range:'bytes=0-11'},redirect:'error'});if(!response.ok)throw Error('File tidak dapat diperiksa');
 const reader=response.body!.getReader();let bytes=new Uint8Array();while(bytes.length<12){const {value,done}=await reader.read();if(done)break;const merged=new Uint8Array(bytes.length+value.length);merged.set(bytes);merged.set(value,bytes.length);bytes=merged;}await reader.cancel();
 const actual=signatureType(bytes);if(actual!==expected){await del(blob.url,{token:process.env.MEDIA_BLOB_READ_WRITE_TOKEN});throw Error('Signature file tidak cocok.');}
 await put(recordPath(blob.url),JSON.stringify({...blob,type:actual,createdAt:new Date().toISOString()}),{access:'private',addRandomSuffix:false,allowOverwrite:true,contentType:'application/json'});
}
export async function verifiedMedia(url:string,type:'image'|'pdf'='image'){if(!url)return true;if(localMode()){const data=await localMediaRecord(url);return !!data&&(type==='pdf'?data.type==='application/pdf':data.type.startsWith('image/'));}const result=await get(recordPath(url),{access:'private',useCache:false});if(!result||result.statusCode!==200)return false;const data=JSON.parse(await new Response(result.stream).text());return data.url===url&&(type==='pdf'?data.type==='application/pdf':data.type.startsWith('image/'));}
export async function mediaRecords(){if(localMode())return local.list('media-records/');let cursor:string|undefined;const records:any[]=[];do{const page=await list({prefix:'media-records/',cursor});for(const b of page.blobs){const result=await get(b.pathname,{access:'private',useCache:false});if(result?.statusCode===200)records.push(JSON.parse(await new Response(result.stream).text()));}cursor=page.hasMore?page.cursor:undefined;}while(cursor);return records;}
export async function removeMediaRecord(url:string){if(localMode())return removeLocalMediaRecord(url);await del(recordPath(url));}
