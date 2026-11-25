import {createServer as createHttpServer} from 'node:http';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'vite';
import {randomBytes} from 'node:crypto';
import {signSession} from '../src/lib/security.mjs';

test('magazine upload, validation, draft visibility, publication, edits and deletion',async()=>{
 const vite=await createServer({configFile:false,server:{middlewareMode:true,hmr:{server:createHttpServer()}},appType:'custom'});
 const previous={token:process.env.BLOB_READ_WRITE_TOKEN,secret:process.env.SESSION_SECRET};
 process.env.BLOB_READ_WRITE_TOKEN='';process.env.SESSION_SECRET=randomBytes(48).toString('hex');
 const token=signSession(process.env.SESSION_SECRET);const assets=[];let entry;let local;let localMedia;
 function context(method,data,{auth=true,path='/api/admin/content?kind=magazines'}={}){
  const url=new URL(path,'http://localhost:4321');return {url,request:new Request(url,{method,headers:{origin:url.origin,...(data instanceof FormData?{}:{'Content-Type':'application/json'})},...(data?{body:data instanceof FormData?data:JSON.stringify(data)}:{})}),cookies:{get:()=>auth?{value:token}:undefined}};
 }
 try{
  const content=await vite.ssrLoadModule('/src/pages/api/admin/content.ts');
  const storage=await vite.ssrLoadModule('/src/lib/storage.ts');
  const uploader=await vite.ssrLoadModule('/src/pages/api/admin/upload.ts');
  const media=await vite.ssrLoadModule('/src/pages/api/admin/media.ts');
  ({local}=await vite.ssrLoadModule('/src/lib/local.ts'));localMedia=await vite.ssrLoadModule('/src/lib/local-media.ts');
  async function upload(bytes,name,type,auth=true){const form=new FormData();form.set('file',new File([bytes],name,{type}));return uploader.POST(context('POST',form,{auth,path:'/api/admin/upload'}));}
  assert.equal((await upload('%PDF-1.7','test.pdf','application/pdf',false)).status,401);
  assert.equal((await upload('fake PDF','fake.pdf','application/pdf')).status,400);
  assert.equal((await upload(new Uint8Array(5*1024*1024+1),'large.png','image/png')).status,400);
  const cover=await (await upload(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aN0cAAAAASUVORK5CYII=','base64'),'cover.png','image/png')).json();assets.push(cover);
  const pdfResponse=await upload('%PDF-1.7\n% integration test fixture','test.pdf','application/pdf');assert.equal(pdfResponse.status,200);const pdf=await pdfResponse.json();assets.push(pdf);
  const draft={title:'Magazine integration test',edition:'01',year:2026,description:'Test magazine',status:'draft',coverUrl:cover.url,pdfUrl:'',allowDownload:false};
  assert.equal((await content.POST(context('POST',{...draft,status:'published'}))).status,400);
  assert.equal((await content.POST(context('POST',{...draft,pdfUrl:cover.url}))).status,400);
  const created=await content.POST(context('POST',draft));assert.equal(created.status,200);entry=await created.json();assert.equal(await storage.findPublic('magazines',entry.slug),undefined);
  const published=await content.POST(context('POST',{...entry,pdfUrl:pdf.url,status:'published'}));assert.equal(published.status,200);entry=await published.json();const originalSlug=entry.slug;assert.equal((await storage.findPublic('magazines',entry.slug)).allowDownload,false);
  assert.equal((await media.DELETE(context('DELETE',{url:pdf.url},{path:'/api/admin/media'}))).status,409);
  const stale={...entry};const edited=await content.POST(context('POST',{...entry,title:'Renamed magazine',allowDownload:true}));assert.equal(edited.status,200);entry=await edited.json();assert.equal(entry.slug,originalSlug);
  assert.equal((await content.POST(context('POST',stale))).status,409);
  const unpublished=await content.POST(context('POST',{...entry,status:'draft'}));assert.equal(unpublished.status,200);entry=await unpublished.json();assert.equal(await storage.findPublic('magazines',originalSlug),undefined);
  assert.equal((await content.DELETE(context('DELETE',{id:entry.id,updatedAt:entry.updatedAt}))).status,200);
  assert.ok(!(await (await content.GET(context('GET'))).json()).some(item=>item.id===entry.id));
  assert.equal((await content.POST(context('POST',{...entry,status:'published'}))).status,409);
  for(const asset of assets)assert.equal((await media.DELETE(context('DELETE',{url:asset.url},{path:'/api/admin/media'}))).status,200);
 }finally{
  if(entry)await local?.remove(`content/magazines/${entry.id}.json`);
  for(const asset of assets){await localMedia?.deleteLocalFile(asset.url);await localMedia?.removeLocalMediaRecord(asset.url);}
  if(previous.token===undefined)delete process.env.BLOB_READ_WRITE_TOKEN;else process.env.BLOB_READ_WRITE_TOKEN=previous.token;
  if(previous.secret===undefined)delete process.env.SESSION_SECRET;else process.env.SESSION_SECRET=previous.secret;
  await vite.close();
 }
});
