import {createServer as createHttpServer} from 'node:http';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'vite';
import {randomBytes} from 'node:crypto';
import {hashPassword,validSession,signSession} from '../src/lib/security.mjs';

test('admin login, session cookies, logout, invalid credentials and rate limits',async()=>{
 const vite=await createServer({configFile:false,server:{middlewareMode:true,hmr:{server:createHttpServer()}},appType:'custom'});
 const keys=['ADMIN_USERNAME','ADMIN_PASSWORD_HASH','SESSION_SECRET','BLOB_READ_WRITE_TOKEN'];
 const previous=Object.fromEntries(keys.map(key=>[key,process.env[key]]));
 const password=randomBytes(24).toString('hex');
 Object.assign(process.env,{ADMIN_USERNAME:'test-admin',ADMIN_PASSWORD_HASH:hashPassword(password),SESSION_SECRET:randomBytes(48).toString('hex'),BLOB_READ_WRITE_TOKEN:''});
 const cookies=new Map();
 const options=new Map();
 const origin='https://school.test';
 function context(body,{originHeader=origin,ip='login-test',session,raw=false}={}){
  const url=new URL('/api/admin/login',origin);
  return {url,clientAddress:ip,request:new Request(url,{method:'POST',headers:{origin:originHeader,'Content-Type':'application/json'},body:raw?body:JSON.stringify(body)}),cookies:{get:key=>session?{value:session}:cookies.has(key)?{value:cookies.get(key)}:undefined,set:(key,value,settings)=>{cookies.set(key,value);options.set(key,settings);},delete:key=>cookies.delete(key)}};
 }
 try{
  const login=await vite.ssrLoadModule('/src/pages/api/admin/login.ts');
  const logout=await vite.ssrLoadModule('/src/pages/api/admin/logout.ts');
  const content=await vite.ssrLoadModule('/src/pages/api/admin/content.ts');
  assert.equal((await login.POST(context({username:'test-admin',password},{originHeader:'https://evil.test'}))).status,403);
  assert.equal((await login.POST(context({username:'test-admin',password:'wrong'}))).status,401);
  assert.equal((await login.POST(context({username:'wrong-admin',password}))).status,401);
  assert.equal((await login.POST(context(null))).status,401);
  assert.equal((await login.POST(context('{broken',{raw:true}))).status,400);
  assert.equal((await login.POST(context({username:'test-admin',password}))).status,200);
  const token=cookies.get('session');
  assert.ok(validSession(token,process.env.SESSION_SECRET));
  assert.equal(options.get('session').httpOnly,true);
  assert.equal(options.get('session').sameSite,'strict');
  assert.equal(options.get('session').maxAge,8*3600);
  assert.equal(options.get('session').path,'/');
  const adminContext=context({});adminContext.url=new URL('/api/admin/content?kind=news',origin);
  assert.equal((await content.GET(adminContext)).status,200);
  const forged=context({},{session:token+'tampered'});forged.url=adminContext.url;
  assert.equal((await content.GET(forged)).status,401);
  const expired=context({},{session:signSession(process.env.SESSION_SECRET,Date.now()-9*3600000)});expired.url=adminContext.url;
  assert.equal((await content.GET(expired)).status,401);
  assert.equal((await logout.POST(context({},{originHeader:'https://evil.test'}))).status,403);
  assert.equal((await logout.POST(context({}))).status,200);
  assert.ok(!cookies.has('session'));
  assert.equal((await content.GET(adminContext)).status,401);
  assert.equal((await logout.POST(context({}))).status,401);
  for(let i=0;i<8;i++)assert.equal((await login.POST(context({username:'test-admin',password:'wrong'},{ip:'limit-test'}))).status,401);
  assert.equal((await login.POST(context({username:'test-admin',password},{ip:'limit-test'}))).status,429);
  process.env.SESSION_SECRET='';
  assert.equal((await login.POST(context({username:'test-admin',password}))).status,503);
 }finally{
  for(const key of keys){if(previous[key]===undefined)delete process.env[key];else process.env[key]=previous[key];}
  await vite.close();
 }
});
