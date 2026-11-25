# Deploy ke Vercel

Proyek memakai Astro SSR, Node.js 22.x, dan adapter @astrojs/vercel. Majalah Pandawa 5 sudah disertakan di public/majalah/ sehingga tersedia tanpa Blob. CMS berita, unggahan baru, dan login produksi memerlukan Blob.

## 1. File konfigurasi

- .gitignore mengabaikan dependencies, build, .astro/, .vercel/, .data/, .local/, env rahasia, log, dan PDF sumber di root. PDF dalam public/majalah/ tetap masuk Git dan deployment.
- .vercelignore juga mengecualikan data dan rahasia lokal saat deploy melalui CLI.
- .env.example adalah template kosong yang boleh di-commit.
- .env adalah konfigurasi pengembangan lokal. Token Blob kosong mengaktifkan penyimpanan .data/ saat npm run dev.
- .env.production.local adalah konfigurasi produksi privat untuk diisi dan diimpor ke Vercel.
- .local/admin-credentials.txt berisi username dan password acak yang dibuat saat setup awal. Buka secara lokal; jangan commit atau bagikan.

## 2. Buat proyek dan storage

1. Push source ke GitHub, lalu import repository di Vercel. Pilih folder yang berisi package.json sebagai Root Directory.
2. Framework: Astro. Node.js: 22.x. Install: npm ci. Build: npm run build. Output Directory: default framework. vercel.json sudah menetapkan framework dan perintah build/install.
3. Buat dan hubungkan Blob store PRIVATE untuk data CMS. Isi BLOB_READ_WRITE_TOKEN dengan token store ini.
4. Buat dan hubungkan Blob store PUBLIC terpisah untuk gambar/PDF. Isi MEDIA_BLOB_READ_WRITE_TOKEN dengan token store ini. Periksa nama token yang ditambahkan otomatis agar tidak tertukar.

## 3. Isi environment produksi

Buka .env.production.local secara lokal dan lengkapi:

| Variabel | Nilai |
| --- | --- |
| ADMIN_USERNAME | Sudah diisi admin |
| ADMIN_PASSWORD_HASH | Hash password acak sudah dibuat; salin seluruh nilai salt:hash |
| SESSION_SECRET | Secret produksi sudah dibuat, berbeda dari secret lokal |
| BLOB_READ_WRITE_TOKEN | Token Blob PRIVATE dari Vercel |
| MEDIA_BLOB_READ_WRITE_TOKEN | Token Blob PUBLIC dari Vercel |
| PUBLIC_SITE_URL | Origin HTTPS situs, misalnya https://nama-proyek.vercel.app |

Jalankan npm run check:deploy. Pemeriksaan menampilkan nama variabel yang belum lengkap tanpa mencetak nilai rahasia. Ini belum menguji koneksi ke Blob.

Di Vercel, buka Project Settings > Environment Variables dan impor .env.production.local atau salin keenam variabelnya untuk Production. Jangan mengimpor .env pengembangan karena URL-nya localhost. File env lokal yang diabaikan Git tidak otomatis tersedia pada deployment Git. Jika memakai Preview, konfigurasi juga environment Preview; gunakan store pengujian terpisah jika diperlukan.

Jika domain belum diketahui pada deployment pertama, PUBLIC_SITE_URL boleh dikosongkan agar aplikasi menggunakan VERCEL_PROJECT_PRODUCTION_URL. Pemeriksaan lokal check:deploy memerlukan PUBLIC_SITE_URL atau VERCEL_PROJECT_PRODUCTION_URL. Setelah domain tersedia, isi origin HTTPS produksi lalu redeploy. Jangan mengatur NODE_ENV atau VERCEL_PROJECT_PRODUCTION_URL secara manual di dashboard; gunakan variabel sistem Vercel.

Jika ingin mengganti password, jalankan npm run hash-password lalu ganti ADMIN_PASSWORD_HASH di env lokal/produksi dan dashboard. Gunakan password asli saat login, bukan hash. Mengganti SESSION_SECRET mencabut sesi aktif.

## 4. Deploy dan cek

Klik Deploy. Setelah mengganti variabel environment, lakukan Redeploy agar perubahan digunakan.

- /majalah dan /majalah/pandawa-5: sampul, pembaca 71 halaman, navigasi, zoom, unduh PDF.
- /adminlog: login memakai kredensial dari .local/admin-credentials.txt.
- /admin: pengunjung tanpa login dialihkan ke halaman login.
- Buat draft berita, terbitkan, dan periksa halaman publik; uji juga unggah gambar serta PDF dari dashboard.
- Redeploy dan pastikan konten CMS tetap tersedia melalui Blob.
- Cek canonical dan /sitemap.xml memakai domain produksi.

Data .data/ lokal tidak dimigrasikan otomatis ke Blob. Publikasikan konten lokal yang diperlukan melalui dashboard produksi. Pandawa 5 sudah menjadi aset source dan tidak perlu diunggah ulang.

Unggah produksi memakai client upload langsung ke Blob. Callback verifikasi memerlukan endpoint deployment yang dapat diakses Vercel Blob; periksa Deployment Protection jika callback unggahan Preview gagal.

Dokumentasi resmi: [Environment variables](https://vercel.com/docs/environment-variables), [Astro deployment](https://docs.astro.build/en/guides/deploy/vercel/), [Private Blob](https://vercel.com/docs/vercel-blob/private-storage).
