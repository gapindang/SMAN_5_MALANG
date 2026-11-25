import type {APIRoute} from 'astro';import {guard,json} from '../../../lib/auth';
export const POST:APIRoute=(ctx)=>{try{guard(ctx);ctx.cookies.delete('session',{path:'/'});return json({ok:true});}catch(e){return e instanceof Response?e:json({error:'Gagal keluar'},500);}};
