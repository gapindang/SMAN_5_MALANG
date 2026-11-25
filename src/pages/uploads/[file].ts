import type {APIRoute} from 'astro';
import {localMode} from '../../lib/local';
import {readLocalFile,localMediaRecord} from '../../lib/local-media';
export const GET:APIRoute=async({params})=>{
 if(!localMode())return new Response('Not found',{status:404});
 try{const url=`/uploads/${params.file}`;const record=await localMediaRecord(url);if(!record)return new Response('Not found',{status:404});const bytes=await readLocalFile(url);return new Response(new Uint8Array(bytes),{headers:{'Content-Type':record.type,'X-Content-Type-Options':'nosniff','Cache-Control':'no-store'}});}catch{return new Response('Not found',{status:404});}
};
