import {loadEnv} from 'vite';
const env={...loadEnv('production',process.cwd(),''),...process.env};
const issues=[];
if(!env.ADMIN_USERNAME?.trim())issues.push('ADMIN_USERNAME belum diatur.');
if(!/^[a-f0-9]{32}:[a-f0-9]{128}$/.test(env.ADMIN_PASSWORD_HASH||''))issues.push('ADMIN_PASSWORD_HASH belum valid. Jalankan npm run hash-password.');
if((env.SESSION_SECRET||'').length<32)issues.push('SESSION_SECRET minimal 32 karakter.');
for(const key of ['BLOB_READ_WRITE_TOKEN','MEDIA_BLOB_READ_WRITE_TOKEN'])if(!env[key]?.startsWith('vercel_blob_rw_'))issues.push(`${key} belum diatur atau format token tidak sesuai.`);
if(env.BLOB_READ_WRITE_TOKEN&&env.BLOB_READ_WRITE_TOKEN===env.MEDIA_BLOB_READ_WRITE_TOKEN)issues.push('Gunakan dua store berbeda: private untuk data dan public untuk media.');
const site=env.PUBLIC_SITE_URL||(env.VERCEL_PROJECT_PRODUCTION_URL?`https://${env.VERCEL_PROJECT_PRODUCTION_URL}`:'');
try{const url=new URL(site);if(url.protocol!=='https:'||url.hostname==='localhost'||url.pathname!=='/'||url.search||url.hash||url.username||url.password)throw Error();}catch{issues.push('PUBLIC_SITE_URL harus origin HTTPS produksi, contoh https://nama-proyek.vercel.app.');}
if(issues.length){console.error('Konfigurasi deployment belum lengkap:');for(const issue of issues)console.error(`- ${issue}`);process.exitCode=1;}else console.log('Konfigurasi deployment lengkap. Koneksi Blob dan alur browser tetap perlu diuji pada deployment Vercel.');
