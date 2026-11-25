import {test} from 'node:test';import assert from 'node:assert/strict';import {mkdtemp,rm} from 'node:fs/promises';import {tmpdir} from 'node:os';import {join} from 'node:path';import {createLocalStore} from '../src/lib/local-store.mjs';
test('local JSON survives reopening and serializes conflicting edits',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'school-store-'));try{
 const store=createLocalStore(dir);await store.write('news/a.json',{title:'Draft'});
 const old=await store.read('news/a.json');assert.equal(createLocalStore(dir) instanceof Object,true);assert.equal((await createLocalStore(dir).read('news/a.json')).value.title,'Draft');
 const edits=await Promise.allSettled([store.write('news/a.json',{title:'First'},old.etag),store.write('news/a.json',{title:'Second'},old.etag)]);assert.equal(edits.filter(x=>x.status==='fulfilled').length,1);assert.equal(edits.filter(x=>x.status==='rejected').length,1);
 assert.equal((await store.list('news/')).length,1);await assert.rejects(store.read('../escape.json'),/Invalid storage path/);
 }finally{await rm(dir,{recursive:true,force:true});}
});
