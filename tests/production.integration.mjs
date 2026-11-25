import {createServer as createHttpServer} from 'node:http';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'vite';

test('production without storage serves the bundled magazine, exposes no examples and refuses writes',async()=>{
 const vite=await createServer({configFile:false,define:{'import.meta.env.DEV':'false'},server:{middlewareMode:true,hmr:{server:createHttpServer()}},appType:'custom'});
 const previous=process.env.BLOB_READ_WRITE_TOKEN;process.env.BLOB_READ_WRITE_TOKEN='';
 try{
  const local=await vite.ssrLoadModule('/src/lib/local.ts');
  const storage=await vite.ssrLoadModule('/src/lib/storage.ts');
  assert.equal(local.localMode(),false);
  for(const kind of ['news','magazines']){
   assert.deepEqual(await storage.all(kind),[]);
   if(kind==='news')assert.deepEqual(await storage.publicItems(kind),[]);
   else {const items=await storage.publicItems(kind);assert.equal(items.length,1);assert.equal(items[0].slug,'pandawa-5');assert.equal(items[0].year,2026);assert.equal(items[0].allowDownload,true);const fs=await import('node:fs/promises');for(const url of [items[0].pdfUrl,items[0].coverUrl])assert.ok((await fs.stat(`public${url}`)).size>0);assert.equal((await storage.findPublic(kind,'pandawa-5')).id,items[0].id);}
   await assert.rejects(storage.save(kind,{title:'Do not save',status:'published'}),/STORAGE_UNAVAILABLE/);
  }
  assert.equal(await storage.findPublic('news','ruang-belajar-tanpa-batas'),undefined);
  assert.equal(await storage.findPublic('magazines','akar-edisi-01'),undefined);
  const sitemap=await vite.ssrLoadModule('/src/pages/sitemap.xml.ts');
  const xml=await (await sitemap.GET({site:new URL('https://school.test')})).text();
  assert.ok(xml.includes('https://school.test/profil'));
  assert.ok(xml.includes('https://school.test/majalah/pandawa-5'));
  assert.ok(!xml.includes('demo')&&!xml.includes('akar-edisi'));
  await assert.rejects(storage.consumeLoginLimit('production-test'),/LOGIN_STORAGE_UNAVAILABLE/);
 }finally{if(previous===undefined)delete process.env.BLOB_READ_WRITE_TOKEN;else process.env.BLOB_READ_WRITE_TOKEN=previous;await vite.close();}
});
