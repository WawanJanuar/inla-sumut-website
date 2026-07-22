# WIP — Fitur Artikel/WordPress (Ditahan)

Status per 2026-07-22: **ditahan**, nunggu keputusan atasan soal hosting WordPress. File ini menyimpan potongan dokumentasi & config yang sudah siap tapi sengaja belum di-commit/push ke `main`, supaya gampang dipasang kembali begitu WordPress live.

Kode sumber fitur ini (`src/pages/artikel/`, `src/utils/wordpress.ts`) **tetap ada di working directory**, hanya belum ter-commit (untracked). Jangan dihapus.

## Yang perlu dikembalikan saat WordPress sudah live

### 1. `src/pages/index.astro`
Ganti item ContentGrid "Artikel":
```diff
- { label: 'Artikel',          href: '#',                  image: imgMountain,    active: false },
+ { label: 'Artikel',          href: BASE + '/artikel',   image: imgMountain,    active: true },
```

### 2. `.github/workflows/deploy.yml`
Tambahkan trigger `repository_dispatch` dan env `WORDPRESS_API_URL`:
```yaml
on:
  push:
    branches: [main]
  workflow_dispatch:
  repository_dispatch:
    types: [wp-post-published]
  schedule:
    - cron: '0 17 * * *'
```
Dan di step "Build Astro site":
```yaml
env:
  YOUTUBE_API_KEY: ${{ secrets.YOUTUBE_API_KEY }}
  WORDPRESS_API_URL: ${{ secrets.WORDPRESS_API_URL }}
```
Juga perlu set secret `WORDPRESS_API_URL` di GitHub repo (Settings → Secrets and variables → Actions) setelah domain CMS WordPress final.

### 3. `CLAUDE.md`

**Tabel Environment Variables** — tambah baris:
```
| `WORDPRESS_API_URL` | Base URL REST API WordPress headless CMS (misal `https://cms.inlasumut.org/wp-json/wp/v2`), dipakai `src/utils/wordpress.ts` untuk fetch artikel | **Tidak wajib** — beda dari `YOUTUBE_API_KEY`, kalau kosong halaman `/artikel` cuma tampil state "Belum ada artikel" (graceful, bukan error build). Lihat bagian "Halaman Artikel" di bawah. |
```
Dan contoh `.env`:
```
WORDPRESS_API_URL=https://cms.inlasumut.org/wp-json/wp/v2
```
Dan kalimat GitHub Actions secret jadi:
```
**GitHub Actions (production build):** disimpan sebagai repo secret (Settings → Secrets and variables → Actions), dipakai di `.github/workflows/deploy.yml` step "Build Astro site" via `env: YOUTUBE_API_KEY: ${{ secrets.YOUTUBE_API_KEY }}` dan `WORDPRESS_API_URL: ${{ secrets.WORDPRESS_API_URL }}`. `WORDPRESS_API_URL` bukan kredensial rahasia (cuma base URL endpoint publik) — tetap diperlakukan sebagai secret demi konsistensi dan supaya kalau domain CMS pindah, tinggal ganti secret tanpa perlu ubah kode.
```

**Bagian Deployment** — kalimat "Cara kerja" jadi:
```
**Cara kerja:** `.github/workflows/deploy.yml` dijalankan otomatis setiap push ke `main`, atau manual via `workflow_dispatch`, atau otomatis lewat `repository_dispatch` (event type `wp-post-published`) yang di-trigger WordPress tiap kali artikel di-publish/edit/unpublish — lihat bagian "Halaman Artikel" di bawah. Workflow: checkout → `npm ci` → `npm run build` → upload `dist/` → deploy ke GitHub Pages.
```
Dan paragraf "Rebuild terjadwal harian" tambah kalimat pembanding:
```
Beda dengan artikel WordPress (yang punya webhook `repository_dispatch` karena kita kontrol server WordPress-nya), YouTube gak punya mekanisme notifikasi upload yang praktis dipakai di sini...
```

**Struktur File** — tambah di bawah `activities/`:
```
    artikel/
      index.astro                — Daftar artikel (route: /artikel) — sumber data WordPress headless CMS
      [slug].astro                — Detail artikel (route: /artikel/:slug) — 1 halaman per post WordPress
```
Dan di `utils/`:
```
    wordpress.ts                  — getAllArticles(), fetch WordPress REST API + in-memory cache (dipakai artikel/index.astro dan artikel/[slug].astro), lihat "Halaman Artikel"
```

**Halaman Home section 5** ganti jadi:
```
5. **Kenali Kegiatan Kami** — Komponen `ContentGrid` (lihat bagian "Komponen ContentGrid" di bawah). 4 kotak editorial grid, yang aktif saat ini "Kegiatan & Acara" (→ `/activities`), "MV & Music" (→ `/mv-music`), dan "Artikel" (→ `/artikel`, lihat "Halaman Artikel"); "Penampilan" masih `active: false` (belum ada halaman tujuan).
```

**Section baru lengkap** "## Halaman Artikel (`src/pages/artikel/`) — WordPress Headless CMS" — isi lengkapnya ada di riwayat git (cari commit sebelum tanggal 2026-07-22 yang menghapus dokumentasi ini, atau tanya Claude untuk regenerate dari membaca `src/pages/artikel/` dan `src/utils/wordpress.ts` langsung — kodenya sudah lengkap dan self-explanatory).

## Kenapa ditahan
Instruksi user 2026-07-22: kode Astro untuk artikel sudah siap dan aman di-deploy (graceful empty state kalau `WORDPRESS_API_URL` kosong), tapi ditahan dulu sampai ada keputusan dari atasan soal hosting WordPress. Jangan push bagian ini sampai ada instruksi eksplisit untuk lanjut.
