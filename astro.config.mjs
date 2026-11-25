import {defineConfig} from 'astro/config';
import vercel from '@astrojs/vercel';
import svelte from '@astrojs/svelte';
import tailwind from '@tailwindcss/vite';
import {loadEnv} from 'vite';
const env=loadEnv(process.env.NODE_ENV || 'development',process.cwd(),'');
for(const [key,value] of Object.entries(env))if(process.env[key]===undefined)process.env[key]=value;
const site=process.env.PUBLIC_SITE_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'http://localhost:4321');
export default defineConfig({site,output:'server',adapter:vercel(),integrations:[svelte()],vite:{plugins:[tailwind()]}});
