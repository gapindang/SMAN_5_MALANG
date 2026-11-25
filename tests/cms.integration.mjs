import {createServer as createHttpServer} from 'node:http';
import {test} from 'node:test';import assert from 'node:assert/strict';import {createServer} from 'vite';import {randomBytes} from 'node:crypto';import {signSession} from '../src/lib/security.mjs';
test('local CMS: authenticated upload, draft, publish, stale edit, unpublish, delete and persistence',async()=>{
 const vite=await createServer({configFile:false,server:{middlewareMode:true,hmr:{server:createHttpServer()}},appType:'custom'});
 const oldToken=process.env.BLOB_READ_WRITE_TOKEN;const oldSecret=process.env.SESSION_SECRET;
 process.env.BLOB_READ_WRITE_TOKEN='';process.env.SESSION_SECRET=randomBytes(48).toString('hex');
 let entry;let media;
 try{
 const content=await vite.ssrLoadModule('/src/pages/api/admin/content.ts');
 const storage=await vite.ssrLoadModule('/src/lib/storage.ts');
 const local=await vite.ssrLoadModule('/src/lib/local.ts');
 const mediaApi=await vite.ssrLoadModule('/src/pages/api/admin/media.ts');
 const uploader=await vite.ssrLoadModule('/src/pages/api/admin/upload.ts');
 const token=signSession(process.env.SESSION_SECRET);
 function context(method,data,{auth=true,origin='http://localhost:4321',path='/api/admin/content?kind=news'}={}){const url=new URL(path,'http://localhost:4321');return {url,request:new Request(url,{method,headers:{origin,...(data instanceof FormData?{}:{'Content-Type':'application/json'})},...(data?{body:data instanceof FormData?data:JSON.stringify(data)}:{})}),cookies:{get:()=>auth?{value:token}:undefined}};}
 const draft={title:'Integration test story',category:'Test',excerpt:'A valid test excerpt',author:'Test',content:'<p>Test story</p><script>alert(1)</script>',featuredImageUrl:'',status:'draft'};
 assert.equal((await content.POST(context('POST',draft,{auth:false}))).status,401);
 assert.equal((await content.POST(context('POST',draft,{origin:'https://evil.test'}))).status,403);
 const form=new FormData();form.set('file',new File([Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aN0cAAAAASUVORK5CYII=','base64')],'test.png',{type:'image/png'}));
 const uploaded=await uploader.POST(context('POST',form,{path:'/api/admin/upload'}));assert.equal(uploaded.status,200);media=await uploaded.json();draft.featuredImageUrl=media.url;
 const saved=await content.POST(context('POST',draft));assert.equal(saved.status,200);entry=await saved.json();assert.ok(!entry.content.includes('<script>'));assert.equal(await storage.findPublic('news',entry.slug),undefined);
 const published=await content.POST(context('POST',{...entry,status:'published'}));assert.equal(published.status,200);const stale=entry;entry=await published.json();assert.ok(await storage.findPublic('news',entry.slug));
 const {createLocalStore}=await import('../src/lib/local-store.mjs');assert.equal((await createLocalStore(new URL('../.data/',import.meta.url).pathname).read(`content/news/${entry.id}.json`)).value.title,entry.title);
 assert.equal((await content.POST(context('POST',{...stale,title:'Stale update'}))).status,409);
 assert.equal((await mediaApi.DELETE(context('DELETE',{url:media.url},{path:'/api/admin/media'}))).status,409);
 const unpublished=await content.POST(context('POST',{...entry,status:'draft'}));assert.equal(unpublished.status,200);entry=await unpublished.json();assert.equal(await storage.findPublic('news',entry.slug),undefined);
 assert.equal((await content.DELETE(context('DELETE',{id:entry.id,updatedAt:entry.updatedAt}))).status,200);assert.ok(!(await (await content.GET(context('GET'))).json()).some(x=>x.id===entry.id));
 assert.equal((await mediaApi.DELETE(context('DELETE',{url:media.url},{path:'/api/admin/media'}))).status,200);media=null;
 await local.local.remove(`content/news/${entry.id}.json`);entry=null;
 }finally{
 if(entry||media){const {local}=await vite.ssrLoadModule('/src/lib/local.ts');if(entry)await local.remove(`content/news/${entry.id}.json`);if(media){const m=await vite.ssrLoadModule('/src/lib/local-media.ts');await m.deleteLocalFile(media.url);await m.removeLocalMediaRecord(media.url);}}
 if(oldToken===undefined)delete process.env.BLOB_READ_WRITE_TOKEN;else process.env.BLOB_READ_WRITE_TOKEN=oldToken;if(oldSecret===undefined)delete process.env.SESSION_SECRET;else process.env.SESSION_SECRET=oldSecret;await vite.close();
 }
});
