import {mkdir,readFile,readdir,writeFile,rename,unlink} from 'node:fs/promises';
import {resolve,dirname,sep} from 'node:path';
import {createHash,randomUUID} from 'node:crypto';

export function createLocalStore(root) {
 const locks=new Map();
 function location(path){const target=resolve(root,path);if(!target.startsWith(resolve(root)+sep))throw Error('Invalid storage path');return target;}
 async function read(path){try{const bytes=await readFile(location(path));return {value:JSON.parse(bytes.toString()),etag:createHash('sha256').update(bytes).digest('hex')};}catch(e){if(e.code==='ENOENT')return null;throw e;}}
 async function write(path,value,expected){
  const previous=locks.get(path)||Promise.resolve();
  const operation=previous.catch(()=>{}).then(async()=>{
   const old=await read(path);
   if(expected===undefined?!!old:old?.etag!==expected)throw Error('CONFLICT');
   const target=location(path);await mkdir(dirname(target),{recursive:true});
   const temporary=`${target}.${randomUUID()}.tmp`;
   try{await writeFile(temporary,JSON.stringify(value),{mode:0o600});await rename(temporary,target);}finally{await unlink(temporary).catch(()=>{});}
  });
  locks.set(path,operation);
  try{await operation;}finally{if(locks.get(path)===operation)locks.delete(path);}
 }
 async function list(prefix){const dir=location(prefix);try{const files=await readdir(dir);return (await Promise.all(files.filter(f=>f.endsWith('.json')).map(f=>read(`${prefix.replace(/\/$/,'')}/${f}`)))).filter(Boolean).map(r=>r.value);}catch(e){if(e.code==='ENOENT')return [];throw e;}}
 async function remove(path){await unlink(location(path)).catch(e=>{if(e.code!=='ENOENT')throw e;});}
 return {read,write,list,remove};
}
