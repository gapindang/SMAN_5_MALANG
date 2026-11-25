import {defineMiddleware} from 'astro:middleware';import {authenticated} from './lib/auth';
export const onRequest=defineMiddleware(async(ctx,next)=>{
 const path=ctx.url.pathname.replace(/\/+$/, '') || '/';
 if((path==='/admin'||path.startsWith('/admin/'))&&!authenticated(ctx))return ctx.redirect('/adminlog');
 const res=await next();res.headers.set('X-Content-Type-Options','nosniff');res.headers.set('Referrer-Policy','strict-origin-when-cross-origin');res.headers.set('X-Frame-Options','SAMEORIGIN');
 if(ctx.url.pathname.startsWith('/admin')||ctx.url.pathname.startsWith('/api'))res.headers.set('Cache-Control','no-store');return res;
});
