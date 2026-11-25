# SMA Negeri 5 Malang — profil, berita & majalah digital

Implementation based on `../PRD_Website_Profil_SMA_Astro_Svelte_Tailwind.pdf` (v1.0).

Astro server rendering, Svelte interactive islands, Tailwind CSS, TypeScript, Vercel deployment and Blob storage. The Indonesian editorial design uses the PRD's ivory, sage, forest, terracotta and sand palette, Playfair Display and Plus Jakarta Sans.

## Run locally

Requires Node.js 22.12+ and npm. From this directory:

```sh
npm install
cp .env.example .env
npm run dev
```

Visit the URL printed by Astro (normally http://localhost:4321).
In local development without a Blob token, login, news/magazine CRUD, drafts, and image/PDF uploads use persistent files in `.data/`. An empty local store starts without sample articles. Restarting the dev server preserves these records and uploads. `.data/` is excluded from version control; back it up if needed. Local storage is enabled only during `npm run dev`; production still requires Vercel Blob. Without production storage, public lists stay empty and admin writes fail with a configuration error. No sample content is published.

## Configure the school

Edit `src/lib/school.ts` for school identity, address, contact details, vision, mission, statistics, and hero image. Extend `src/pages/profil.astro` with verified school history, facilities, achievements, extracurricular activities, and principal's greeting. Replace stock photography, `public/favicon.svg`, and example cover with approved school assets. Upload real magazine covers and PDFs through the dashboard.

Sample stories and editions have been removed. Local development and configured Blob stores show only their own content or an empty state. Footer and contact page explicitly show missing contact information rather than invented addresses or working-looking contact links.

Panduan deployment berbahasa Indonesia: [DEPLOY-VERCEL.md](DEPLOY-VERCEL.md). Jalankan `npm run verify` untuk seluruh pemeriksaan dan `npm run check:deploy` untuk memeriksa konfigurasi produksi tanpa mencetak rahasia.

## Vercel setup

1. Import this directory as the Vercel project root; use the Astro framework preset. The `@astrojs/vercel` adapter handles server rendering and endpoints.
2. Create a **private** Vercel Blob store for JSON records. Set its token as `BLOB_READ_WRITE_TOKEN`.
3. Create a separate **public** Blob store for media. Set its token as `MEDIA_BLOB_READ_WRITE_TOKEN`. Two stores prevent unpublished article JSON from being exposed as public objects.
4. Set `ADMIN_USERNAME` and generate `ADMIN_PASSWORD_HASH` with `npm run hash-password` (scrypt; minimum 12 characters). The script asks for a password in the local terminal; avoid shared terminals.
5. Generate `SESSION_SECRET` with `node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"`. Store it only in `.env` / Vercel environment settings.
6. Set `PUBLIC_SITE_URL` to the canonical HTTPS production origin. Redeploy after environment changes.
7. Visit `/adminlog`, publish a test story and magazine, then run the release checklist below.

Keep `.env` out of version control. To revoke all active sessions, rotate `SESSION_SECRET`. No credentials are shipped in Svelte props or client bundles. The app loads local `.env` values in Astro configuration and uses server-only process environment reads.

## Content and media behavior

- Each news or magazine record has a permanent UUID and its own private `content/<kind>/<id>.json` object. Slugs include the full permanent ID and remain stable across title edits. There is no shared JSON index.
- Public lists, search, detail routes, related content, and sitemap all select only `published` records and sort by `publishedAt`. Draft JSON has no public URL. Content is fetched at request time, so publishing needs no rebuild.
- Updates compare the editor's `updatedAt` and use Blob ETag `ifMatch` for a conditional write. A conflict requires reload. Deletion writes a conditional tombstone so a concurrent edit cannot silently restore the record.
- Rich text supports headings, paragraphs, bold/italic, lists, links, images and quotes. The server sanitizes HTML, validates Zod fields, and checks that inserted images belong to the validated media registry. Pasted material enters as plain text; use the toolbar to format it.
- In local development, authenticated multipart uploads validate size and byte signatures and save under `.data/uploads/`, served through `/uploads/[file]`. On Vercel, direct client uploads bypass the serverless request body limit. Session-bound, same-origin token requests constrain path, content type, size and lifetime. Covers are limited to 5 MB; PDFs to 50 MB. MIME and extension are checked before token generation; byte signatures are validated by the signed completion callback. Invalid files are removed. Content cannot reference unverified assets.
- Upload completion callbacks need a reachable deployed endpoint. Local development against Blob requires an HTTPS tunnel and a supported callback configuration; test actual uploads on Vercel Preview rather than assuming callbacks can reach localhost.
- A failed verification/callback can leave an unreferenced object. Inspect the public Blob store for stale `media/` objects during maintenance; the dashboard lists verified objects only. Do not delete objects that are still referenced by content.
- Deleting content retains its media. The media library checks active draft/published references, including inline article images, before manual deletion. With one admin, avoid editing/publishing content while deleting its media in another tab: cross-object transactions are unavailable. Back up Blob records and assets before bulk cleanup. Tombstones and login-limit records are retained until a deliberate maintenance cleanup; login counters reset logically after 15 minutes.
- Media URLs are public. Draft text is private, but uploaded draft images/PDFs are accessible to anyone who obtains their URLs. Turning off the download button does not prevent copying a public PDF. Do not upload confidential material to the public store.
- The PDF.js reader loads only after the visitor chooses to read. It supports page navigation, zoom, mobile fitting, loading/error states, and optional download links. Verify CORS behavior of actual Blob PDFs on deployment.
- In local development without Blob, login attempts use process-local counters that reset when the server restarts. Production login attempts use private Blob counters with conditional writes (8 attempts per IP / 15 minutes). Trust forwarded IP headers only behind Vercel; configure platform firewall limits for abuse protection as well. Cookies are HttpOnly, SameSite=Strict, Secure in production, and expire after 8 hours. Mutation endpoints require an exact same-origin header and valid session.

## Verification

```sh
npm test
npm run test:cms
npm run check
npm run lint
npm run build
```

The dependency-free Node tests cover passwords, sessions, same-origin checks, file signatures, local persistence and conflicting edits. `test:cms` tests the actual API handlers with local storage: unauthenticated/cross-origin rejection, upload verification, draft visibility, publication, stale edits, media reference protection, unpublishing and deletion. It creates and cleans up only its own test records. It does not test the browser UI or real Blob integration.

Local CRUD repair verification: Unit tests and API integration suites cover local CMS and production empty-state behavior; run `npm run verify` for current results. Astro/Svelte/TypeScript checks and the Vercel production build pass. Browser QA could not run because this execution environment prohibits binding a local server port. Real Blob integration and live Vercel deployment remain unverified; no Lighthouse score or production readiness is claimed.

### Release checklist (required before production)

- Run all commands above after dependencies install, address any diagnostics, and commit the resulting lockfile.
- At 360 px, tablet, and desktop: check menu, no horizontal overflow, focus order, contrast, image fallbacks, and reduced motion.
- Verify missing/incorrect credentials fail, forged/expired sessions fail, logout clears access, and unauthenticated or cross-origin mutations are rejected.
- Create/edit/delete news; save draft; ensure draft is absent from every public route and detail URL; publish; verify ordering and pagination; test stale edits from two tabs.
- Verify sanitization with script/event-handler/unsafe URL input.
- Upload valid JPG/PNG/WebP/PDF and reject invalid signatures, unsupported types and oversized files. Check upload failure recovery, progress and signed callbacks on Vercel Preview.
- Publish a magazine with a real multi-page PDF; check page navigation, zoom, phone rendering, invalid PDF errors, and optional download button.
- Check media reference protection for main images, covers, PDFs and inline images.
- Redeploy and confirm all published content and files persist.
- Check canonical URLs, sitemap, robots, title/descriptions and social previews against the production domain.
- Run Lighthouse against representative public routes and confirm the PRD's LCP target <2.5s under stated test conditions. Check on a real mobile device.

The PRD's complete definition of done remains pending these checks and a working Vercel deployment with credentials.
#   S M A N _ 5 _ M A L A N G  
 