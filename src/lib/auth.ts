import type {APIContext} from 'astro';
import {validSession,validOrigin} from './security.mjs';
export const secret=()=>process.env.SESSION_SECRET||'';
export const authenticated=(ctx:Pick<APIContext,'cookies'>)=>validSession(ctx.cookies.get('session')?.value||'',secret());
export function guard(ctx:APIContext){if(!authenticated(ctx))throw new Response('Tidak diizinkan',{status:401});if(!validOrigin(ctx.request))throw new Response('Origin tidak valid',{status:403});}
export const json=(value:unknown,status=200)=>new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
