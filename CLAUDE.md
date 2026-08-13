# CLAUDE.md

Panduan untuk Claude Code saat bekerja di repo ini. File ini adalah **sumber kebenaran** — selalu baca ini sebelum membuat perubahan.

---

## Gambaran Proyek

Website **INLA SUMUT** (International Nature Loving Association — Sumatera Utara). Seluruh halaman kini dibangun dengan **Astro 7**, termasuk halaman detail kegiatan, About, dan Bergabung. Legacy static HTML (`public/Page/`) masih ada tapi hanya sebagai fallback — pengembangan aktif dilakukan di stack Astro.

---

## Cara Menjalankan

```bash
cd "/Users/wawanjanuar/Documents/INLA SUMUT/Project Web INLA"
npm install        # pertama kali saja
npm run dev        # dev server dengan HMR (hot reload)
npm run build      # output ke dist/
npm run preview    # serve dist/ secara lokal
```

Deploy: output ada di `dist/` (gitignored). Push ke `main` → GitHub Actions otomatis build & deploy.

---

## Environment Variables

| Variabel | Kegunaan | Wajib untuk |
|---|---|---|
| `YOUTUBE_API_KEY` | YouTube Data API v3 key, dipakai `src/utils/youtube.ts` untuk fetch video & playlist channel `@inlasumut` | `npm run dev`, `npm run build` — halaman `/mv-music` akan error kalau tidak ada |

**Lokal:** simpan di file `.env` (root project, sudah di-`.gitignore`, **jangan pernah commit**):
```
YOUTUBE_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**GitHub Actions (production build):** disimpan sebagai repo secret bernama `YOUTUBE_API_KEY` (Settings → Secrets and variables → Actions), dipakai di `.github/workflows/deploy.yml` step "Build Astro site" via `env: YOUTUBE_API_KEY: ${{ secrets.YOUTUBE_API_KEY }}`.

**Cara buat API key baru:** Google Cloud Console → buat/pilih project → APIs & Services → Library → enable "YouTube Data API v3" → Credentials → Create Credentials → API Key → restrict ke "YouTube Data API v3" saja. Tidak perlu akses admin channel YouTube-nya — cukup akun Google apa saja, karena yang diambil hanya data publik channel.

---

## Deployment — GitHub Pages

**URL publik:** `https://wawanjanuar.github.io/inla-sumut-website`

**Cara kerja:** `.github/workflows/deploy.yml` dijalankan otomatis setiap push ke `main`, manual via `workflow_dispatch`, atau otomatis lewat rebuild terjadwal harian (lihat di bawah). Workflow: checkout → `npm ci` → `npm run build` → upload `dist/` → deploy ke GitHub Pages.

**Rebuild terjadwal harian (`schedule: cron: '0 17 * * *'`)** — jam 00:00 WIB (UTC+7) tiap hari. **Alasan:** situs ini statis, cuma fetch data YouTube (`src/utils/youtube.ts`) saat proses build — video baru yang di-upload ke channel `@inlasumut` gak otomatis muncul di situs live sampai ada rebuild. YouTube gak punya mekanisme notifikasi upload yang praktis dipakai di sini (butuh server penerima yang selalu online buat nangkep webhook-nya, kita gak punya itu) — jadi rebuild terjadwal adalah solusi paling realistis. **Dampak:** video baru butuh waktu sampai ~24 jam buat muncul di situs live (tergantung kapan upload-nya relatif ke jam 00:00 WIB), beda dengan `npm run dev`/localhost yang selalu fetch fresh langsung dari YouTube API. Kalau butuh video baru muncul LEBIH cepat dari jadwal ini, trigger manual lewat GitHub repo → Actions → "Deploy to GitHub Pages" → "Run workflow".

**Aktivasi pertama kali (manual, sekali saja):**
1. Buka GitHub repo → Settings → Pages
2. Source: pilih **GitHub Actions** (bukan "Deploy from a branch")
3. Save — setelah itu semua push otomatis deploy

**Cek status deploy:** GitHub repo → tab Actions → workflow "Deploy to GitHub Pages"

---

## Base Path — PENTING untuk Pengembangan

Karena repo bernama `inla-sumut-website` (bukan `wawanjanuar.github.io`), GitHub Pages menyajikan site di subfolder `/inla-sumut-website/`. Ini artinya semua path di Astro harus pakai prefix base URL.

**Konfigurasi di `astro.config.mjs`:**
```js
export default defineConfig({
  site: 'https://wawanjanuar.github.io',
  base: '/inla-sumut-website',
});
```

**Pola wajib di setiap `.astro` file yang pakai path:**
```astro
---
const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');
// Development: BASE = '' (kosong)
// Production:  BASE = '/inla-sumut-website'
---
```

Kemudian gunakan `BASE` sebagai prefix:
```astro
<!-- BENAR -->
<a href={BASE + '/about'}>About</a>
<img src={BASE + '/SRC/logo.png'} />
<div style={`background-image:url('${BASE}/SRC/image.jpg')`}></div>

<!-- SALAH — jangan hardcode tanpa BASE -->
<a href="/about">About</a>
<img src="/SRC/logo.png" />
```

**File yang sudah diupdate dengan pola BASE:**
- `src/layouts/Layout.astro` — favicon, `<body data-base={import.meta.env.BASE_URL}>`
- `src/components/Navbar.astro` — semua href + logo src
- `src/components/Footer.astro` — semua href + logo src
- `src/components/GalleryGrid.astro` — semua img src dan data-src
- `src/components/RelatedActivities.astro` — background-image URL dan href
- `src/pages/index.astro` — href dan background-image kartu kegiatan
- `src/pages/about.astro` — href CTA
- `src/pages/karir.astro` — JS modal close redirect
- `src/pages/activities/index.astro` — semua href dan background-image
- `src/pages/activities/igts.astro` — breadcrumb dan sidebar href
- `src/pages/activities/igt.astro` — breadcrumb dan sidebar href
- `src/pages/activities/mvoh.astro` — breadcrumb dan sidebar href
- `src/pages/activities/pagelaran.astro` — breadcrumb dan sidebar href
- `src/pages/mv-music.astro` — prefix untuk cover album yang path-nya string `/SRC/...`

**Komponen yang menangani BASE secara internal** (halaman pemanggil tidak perlu tambah BASE):
- `GalleryGrid.astro` — otomatis prefix images prop
- `RelatedActivities.astro` — otomatis prefix item.image dan item.href

**Untuk client-side JS (script tag):** Base URL tidak bisa diakses langsung dengan `import.meta.env`. Gunakan `document.body.dataset.base` yang sudah di-set di `Layout.astro`:
```js
const base = document.body.dataset.base ?? '/';
window.location.href = base; // redirect ke home
```

**Kalau ada halaman atau komponen baru** yang pakai path absolut (href, src, url()), wajib tambah prefix `BASE`. Tanpa ini, path akan rusak di production tapi tampak benar di local dev.

**Troubleshooting:**
| Gejala | Kemungkinan penyebab | Solusi |
|---|---|---|
| Gambar tidak muncul di production | Path `/SRC/...` tanpa BASE prefix | Tambah `${BASE}` sebelum path |
| Link navigasi ke halaman blank/404 | href `/about` tanpa BASE prefix | Ganti dengan `href={BASE + '/about'}` |
| JS redirect ke halaman salah | `window.location.href = '/'` hardcoded | Ganti dengan `document.body.dataset.base ?? '/'` |
| Build berhasil tapi site kosong | GitHub Pages Source belum diset ke "GitHub Actions" | Settings → Pages → Source → GitHub Actions |
| Workflow gagal | Cek tab Actions di GitHub repo untuk error log | Biasanya `npm ci` gagal atau ada TypeScript error |

---

## Struktur File

```
package.json, astro.config.mjs, tsconfig.json
src/
  pages/
    index.astro                  — Home (route: /)
    about.astro                  — About Us (route: /about)
    karir.astro                  — Bergabung / Join (route: /karir)
    mv-music.astro              — MV & Music (route: /mv-music) — album grid + video grid + modal player
    mv-music/
      [slug].astro                — Detail Album "Full Video" (route: /mv-music/:slug) — 1 halaman per playlist YouTube
      videos.json.ts               — API route static (route: /mv-music/videos.json) — semua 341 video "di luar playlist", di-fetch on-demand oleh search di mv-music.astro
      audio/
        [slug].astro                — Detail Album "Full Audio" (route: /mv-music/audio/:slug) — 1 halaman per album di src/data/albums.ts
    activities/
      index.astro                — Daftar semua kegiatan (route: /activities)
      igts.astro                 — INLA Goes To School (route: /activities/igts)
      igt.astro                  — INLA Got Talent (route: /activities/igt)
      mvoh.astro                 — Musical Voice of Harmony (route: /activities/mvoh)
      pagelaran.astro            — Pagelaran SKS (route: /activities/pagelaran)
  layouts/
    Layout.astro                 — <head>, ClientRouter, lightbox HTML, video modal HTML,
                                   semua JS global (astro:page-load)
  components/
    Navbar.astro                 — Navbar + hamburger mobile drawer
    Footer.astro                 — Footer dengan navigasi
    HeroDetail.astro             — Hero untuk halaman detail kegiatan (video background opsional)
    StatsStrip.astro             — Strip statistik angka
    GalleryGrid.astro            — Grid foto dengan lightbox
    HistorySidebar.astro         — Sidebar timeline riwayat edisi kegiatan
    RelatedActivities.astro      — Kartu kegiatan terkait di bawah halaman detail
    ContentGrid.astro            — 4 kotak editorial grid di akhir Home ("Kenali Kegiatan Kami")
    AlbumHeroBackground.astro    — Blob mengambang + noise + cursor spotlight, shared antara mv-music/[slug].astro (video) dan mv-music/audio/[slug].astro (audio)
  data/
    activities.ts                — Sumber data kegiatan (digunakan home + bisa dikembangkan)
    albums.ts                    — Sumber data album "Full Audio" (judul, tagline, tracks[]) — penyimpanan sementara sebelum database, lihat bagian "Halaman Detail Album — Full Audio"
    lyrics/
      index.ts                    — Registry lirik per album (`getAlbumLyrics(albumSlug)`), lihat "Panel Lirik" di bagian "Halaman Detail Album — Full Audio"
      kembali-terhubung-dengan-alam.ts — Lirik per track album ini (10 dari 19 track terisi), teks polos tanpa timestamp
  utils/
    youtube.ts                   — getChannelVideosNotInPlaylists(handle) + getChannelAlbums(handle), fetch YouTube Data API v3 + in-memory cache (dipakai mv-music.astro dan mv-music/[slug].astro)
  styles/
    global.css                   — Semua CSS: variabel warna, layout, komponen, animasi
  assets/images/                 — Gambar untuk halaman Astro (dioptimasi jadi WebP saat build)
    logo.png                     — Logo INLA SUMUT
    Landingpage(main).png        — Slide 1 hero home
    Landinpage (Event).jpg       — Slide 2 hero home
    children-sunset.jpg
    dance-bali.jpg
    dance-kimono.jpg
    festival-stage.jpg
    hero-mountain.jpg
    wheat-field.jpg
public/                          — Disalin as-is ke dist/ (tidak diproses Astro)
  Page/
    about.html                   — Legacy About Us (static HTML, tidak aktif dikembangkan)
    activities.html              — Legacy Activities (static HTML, tidak aktif dikembangkan)
  audio/{slug}/                  — File mp3 + thumbnail per album audio (~144MB untuk 19 lagu) — PENYIMPANAN SEMENTARA, lihat bagian "Halaman Detail Album — Full Audio"
  SRC/                           — Gambar untuk legacy pages dan kartu kegiatan di Astro
  style.css                      — CSS legacy pages
  CSS/animations.css             — Animasi legacy
  JS/main.js                     — JS legacy pages
dist/                            — Build output (gitignored)
```

---

## Stack & Teknologi

| Tool | Versi | Kegunaan |
|---|---|---|
| Astro | 7 | Static site builder, routing berbasis file, `<Image />` optimization |
| Pure CSS | — | **Tidak ada Tailwind.** Semua styling di `src/styles/global.css` |
| `astro:transitions` `ClientRouter` | — | SPA-like navigasi antar halaman Astro |
| `astro:assets` `<Image />` | — | Otomatis konversi gambar ke WebP saat build |
| TypeScript | — | Digunakan di `src/data/activities.ts` |

**Tidak ada:** Tailwind, GSAP, Framer Motion, AOS, Bootstrap, library eksternal lainnya di halaman Astro. Semua interaksi hand-rolled vanilla JS.

---

## Sistem Warna (WAJIB DIIKUTI)

Semua warna didefinisikan sebagai nilai literal di `global.css`. **Jangan** gunakan warna di luar daftar ini:

| Variabel / Nilai | Kegunaan |
|---|---|
| `#1c2e1c` | Warna teks utama, background navbar, tombol primary |
| `#3d7a3d` | Hijau utama — CTA, link, aksen |
| `#4a9e4a` | Hijau terang — hover state |
| `#f5f2ec` | Background utama (krem/offwhite) |
| `#7ec87e` | Aksen hijau muda |
| `#fff` | Background section putih |

**Tidak ada gold/amber.** Pernah ditambahkan lalu dihapus atas permintaan klien ("tidak masuk, kita gunakan warna hijau"). Jangan tambahkan kembali tanpa konfirmasi.

**Pengecualian:** `src/pages/mv-music/[slug].astro` (halaman detail album "Full Video") pakai palet dark green/lime/**gold** yang sama sekali berbeda, atas spek desain eksplisit dari user lengkap dengan hex code — lihat bagian "Halaman Detail Album" di bawah. Ini **tidak membatalkan** aturan "tidak ada gold" untuk sisa site — scoped cuma di halaman itu.

---

## Open Graph & Twitter Card (`src/layouts/Layout.astro`)

Layout menerima props `title`, `description?`, `ogImage?`, `ogUrl?` dan merender meta tag `og:*` dan `twitter:*` di `<head>` — dipakai untuk preview link saat di-share ke WhatsApp/Telegram/Facebook/dll.

- `ogImage` menerima **dua bentuk**:
  - `string` — path publik relatif (contoh `"/SRC/bg5.jpg"`), di-prefix otomatis dengan origin (`https://wawanjanuar.github.io`) + `BASE`.
  - `ImageMetadata` (hasil `import` dari `src/assets/images/`) — diproses lewat `getImage()` (width 1200) agar dapat URL WebP hasil build; origin ditambahkan tanpa `BASE` karena path build sudah otomatis mengandung prefix base.
- Default `ogImage` adalah hero home (`Landingpage(main).png`) jika halaman tidak mengoper prop ini.
- `ogUrl` default ke `Astro.url.href` (sudah benar untuk GitHub Pages karena `site` + `base` sudah dikonfigurasi di `astro.config.mjs`).
- Halaman yang sudah diberi `description` + `ogImage` spesifik: `index.astro`, `about.astro`, `activities/index.astro`, `activities/igts.astro`, `activities/igt.astro`, `activities/mvoh.astro`, `activities/pagelaran.astro`, `mv-music.astro`, `mv-music/[slug].astro` (pakai `album.thumbnail`, URL eksternal `i.ytimg.com` — `fullOgImage` di Layout.astro sudah handle string yang `startsWith('http')` tanpa prefix `BASE`). `karir.astro` masih pakai default Layout (belum diberi nilai khusus).

### Slot `"head"` — buat halaman yang butuh `<link>` tambahan di `<head>`
Layout.astro punya `<slot name="head" />` di dalam `<head>` (sebelum `<ClientRouter />`). Dipakai halaman yang butuh resource spesifik-halaman di `<head>` (contoh: `mv-music/[slug].astro` load Google Fonts lewat `<link rel="preconnect">` + `<link rel="stylesheet">`, bukan `@import` di dalam `<style>` scoped — `@import` di situ render-blocking dan cuma ke-discover browser setelah parsing CSS component itu, sementara `<link>` di `<head>` bisa langsung di-discover & di-fetch paralel oleh browser). Cara pakai:
```astro
<Layout ...>
  <Fragment slot="head">
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="stylesheet" href="..." />
  </Fragment>
  <Navbar />
  ...
</Layout>
```
**Jangan taruh resource yang cuma dibutuhkan 1 halaman langsung di Layout.astro** — pakai slot ini supaya halaman lain yang gak butuh gak ikut nanggung biaya loading-nya.

---

## JavaScript — Pola Global (Layout.astro)

**SEMUA JS** diinisialisasi di dalam:
```js
document.addEventListener('astro:page-load', () => { ... });
```
Jangan gunakan `DOMContentLoaded` atau `astro:after-swap`. `astro:page-load` dipilih karena firing pada initial load DAN setiap navigasi via ClientRouter.

**Tidak ada `_globalSetupDone` flag** — pernah dipakai, dihapus karena menyebabkan event handler tidak ter-attach ulang setelah DOM swap oleh ViewTransitions.

### Fitur JS Global (di Layout.astro)

| Fitur | Cara Kerja |
|---|---|
| Scroll reveal | `[data-reveal]` + `IntersectionObserver` (threshold 0.12, one-time — `unobserve` setelah `.revealed` ditambahkan), delay via `data-reveal-delay="1"`–`"6"` (`transition-delay` 0.1s–0.6s). Diterapkan menyeluruh di 3 halaman utama (`index.astro`, `about.astro`, `activities/index.astro`) plus komponen `ContentGrid.astro` yang mereka pakai — tiap section header dapat `data-reveal` polos, tiap card/list berulang dapat `data-reveal` + delay staggered (biasanya `Math.min(i, 4) \|\| undefined` di `.map()` supaya delay maksimal 0.4s dan atribut kosong di-omit untuk index 0). Hero tiap halaman **sengaja tidak** diberi reveal (selalu full-visible saat load, konsisten di semua halaman). Kartu di container horizontal-scroll (`.cards`) juga otomatis kena efek ini — `IntersectionObserver` menghormati clipping dari ancestor `overflow-x:auto`, jadi kartu yang belum discroll ke area terlihat baru revealed begitu discroll masuk (bukan bug, perilaku wajar). |
| Magnetic buttons | `[data-magnetic]` — mouse tracking offset |
| Counter animasi | `[data-counter]` / `[data-suffix]` — ease-out cubic count-up |
| Cursor glow | `div#cursor-glow` mengikuti posisi mouse |
| Navbar scroll | `.scrolled` ditambah ke navbar saat `scrollY > 60` |
| **Lightbox foto** | `[data-gallery]` + `[data-src]` pada tiap item, dikelompokkan per nilai `data-gallery`. `display:flex/none` (bukan class toggle). Z-index 9999/10000/10001 semua inline. |
| **Video modal** | `[data-watch-video="videoId"]` pada tombol, membuka iframe YouTube fullscreen. `display:flex/none`. |

### Z-Index Modal (JANGAN UBAH)
```
overlay (#lightbox / #videoModal): z-index 9999
konten modal:                       z-index 10000
tombol (close / prev / next):       z-index 10001  ← semua inline style
```

### Glow Neon di Lightbox & Video Modal Global
Kedua overlay ini (`#lightbox`, `#videoModal`) punya efek cahaya neon hijau bergerak di sekeliling konten (`.glow-ring` berputar + `.glow-outer` berdenyut, `@keyframes ringRotate`/`glowPulse`) — CSS-nya di `<style>` Layout.astro sendiri (bukan inline, karena butuh `@keyframes`). Ini **perluasan eksplisit dari user** (awalnya glow cuma ada di modal video `mv-music.astro`/`mv-music/[slug].astro`) — dipilih warna & pola yang SAMA PERSIS (neon hijau `rgba(0,255,136,...)`/`rgba(74,222,128,...)`) supaya konsisten di seluruh situs.

**Kenapa cuma muncul di halaman kegiatan (IGTS/IGT/MVOH/Pagelaran):** `#lightbox` dan `#videoModal` ada di Layout.astro (dipakai SEMUA halaman), tapi yang men-*trigger*-nya cuma `[data-gallery]` (dari `GalleryGrid.astro`) dan `[data-watch-video]` (dari `HeroDetail.astro`) — kedua komponen itu cuma dipakai di 4 halaman detail kegiatan. Jadi glow otomatis cuma kelihatan di situ, gak perlu scoping tambahan.

**Struktur wrapper (`.glow-media-wrap`)** — dibungkus di sekitar konten media (iframe untuk video modal, `<img>` untuk lightbox), dengan `.glow-outer`/`.glow-ring` sebagai sibling di dalamnya (z-index 0 relatif) dan konten media sendiri z-index 1 relatif. **Tier z-index 9999/10000/10001 di atas TETAP dipertahankan** — cuma `z-index:10000` yang tadinya nempel langsung di `<img>`/div-iframe sekarang pindah ke `.glow-media-wrap` (karena itu yang sekarang jadi "konten modal"-nya), bukan perubahan pada aturan tier-nya.

---

## Halaman Home (`src/pages/index.astro`)

### Sections (urutan dari atas):
1. **Hero** — 2-slide slideshow (fade 1.2s, interval 5s, Ken Burns `scale(1→1.06)`). Gambar: `Landingpage(main).png` + `Landinpage (Event).jpg`. Di atas slides ada glassmorphism card (`hero-glass-card`: `background: rgba(255,255,255,0.78)`, `backdrop-filter: blur(36px) saturate(200%)`, border+inset highlight terang di atas, shadow besar `0 30px 70px rgba(28,46,28,0.28)` untuk kesan melayang). Refleksi cahaya dibuat via `::before` (highlight atas, opacity puncak 0.45, fade panjang) dan `::after` (garis diagonal tipis, opacity 0.35, `filter: blur(2px)`). Karena background sekarang terang, teks di dalam card di-override jadi warna gelap (`.hero-glass-card .hero-h1/.hero-p/.hero-tag/.btn-ghost` — scoped khusus, tidak memengaruhi hero page lain yang punya selector sendiri seperti `.hero-karir .hero-h1`). **Tinggi hero `min-height: 85vh`** (mobile juga `85vh`) — awalnya `520px` tetap lalu naik bertahap (`1050px` → `75vh` → **`85vh`** final) atas permintaan user langsung, supaya hero menutupi sampai ke section "Tentang Kami" di bawahnya (2026-08-13).
2. **About** — Grid 2 kolom: teks + 4 pillar icon.
3. **Highlight Kegiatan** (`#aktivitas`) — Horizontal scroll 6 kartu. Data diambil dari `src/data/activities.ts`, di-sort by `publishedAt` terbaru. Di akhir scroll ada tombol bulat `→` link ke `/activities`.
4. **Kenali Kegiatan Kami** — Komponen `ContentGrid` (lihat bagian "Komponen ContentGrid" di bawah). 4 kotak editorial grid, satu-satunya yang aktif saat ini adalah "Kegiatan & Acara" (→ `/activities`) dan "MV & Music" (→ `/mv-music`); "Penampilan" dan "Artikel" masih `active: false` (belum ada halaman tujuan).

**⚠️ SEMUA FITUR INSTAGRAM SUDAH DIHAPUS PERMANEN (2026-08-13), atas permintaan eksplisit user ("semua fitur instagram hapus permanen").** Section "Konten Media Sosial" (dulu section ke-4 di Home, judulnya sama dengan section "Recent" di About) sudah dihapus total dari `index.astro` dan `about.astro` — begitu juga tombol Instagram di `Footer.astro` (`.socials`, dulu ada 3 tombol FB/IG/YT, sekarang cuma FB+YT). Semua CSS terkait (`.sosmed-section`, `.sosmed-header`, `.sosmed-eyebrow/-title/-subtitle/-grid/-card/-img*/-body/-caption/-btn/-footer-cta/-follow-btn` + versi mobile-nya) juga sudah dibuang dari `global.css`, termasuk CSS legacy `.socmed-*` (beda ejaan, dead code lama yang sudah gak dipakai di mana pun sejak sebelumnya — sekalian dibuang saat pembersihan ini). Import gambar yang cuma dipakai section ini (`imgLogo`, `imgChildren`, `imgWheat` di `index.astro`; `imgLogo`, `imgChildren`, `imgDanceBali`, `imgDanceKimono`, `imgFestival`, `imgWheat`, plus import `Image` dari `astro:assets` itu sendiri di `about.astro`) juga sudah dibersihkan. **Kalau nanti fitur Instagram mau dihidupkan lagi, ini bukan "un-delete" sederhana** — perlu dibangun ulang dari nol (markup + CSS + data), bukan cuma uncomment, karena semuanya sudah beneran dibuang dari kode.

### Navbar nav item: "Home" (bukan "Dashboard" — sudah direname semua)

---

## Komponen ContentGrid (`src/components/ContentGrid.astro`)

Section "Kenali Kegiatan Kami" di akhir Home. Vibes editorial magazine grid — bukan card konvensional.

**Props:** `eyebrow`, `title`, `titleHighlight`, `items: {label, href, image: ImageMetadata, active: boolean}[]`

**Layout:** grid 4 kolom equal (`repeat(4,1fr)`, gap 12px), tiap kotak `aspect-ratio: 1/1` (persegi — awalnya 4/5, diubah ke 1/1 atas permintaan), `border-radius:16px`. Mobile (`≤768px`): 2×2 grid, gap 10px; `≤480px`: gap 8px, font label lebih kecil.

**Hover:** gambar `saturate(0.85)` default → `saturate(1) + scale(1.05)` saat hover, overlay gradient gelap muncul dari bawah, label + arrow (`↗`) fade-in dari `translateY(8px)`. Semua CSS scoped di dalam komponen (tidak di `global.css`).

**Item `active: false` (belum ada halaman tujuan):** tetap terlihat & terasa "hidup" (hover penuh, cursor pointer) — **BUKAN** didimming/di-`pointer-events:none`. Klik `href="#"` di-`preventDefault()` lewat `data-inactive="true"` + script `astro:page-load` di dalam komponen, supaya tidak ada scroll-jump ke atas tapi juga tidak terlihat "disabled". Ini keputusan sadar dari user — jangan diubah ke pola disabled/dimmed tanpa diminta.

---

## Data Kegiatan (`src/data/activities.ts`)

**Sumber kebenaran** untuk semua metadata kegiatan yang tampil di home highlights.

```ts
interface Activity {
  slug: string;
  title: string;
  tag: string;
  description: string;
  image: string;      // path dari public/SRC/
  href: string;       // link ke halaman detail atau /activities
  publishedAt: string; // ISO date — sorting berdasarkan ini
}
```

Fungsi `getHighlights(limit = 6)` mengembalikan `limit` kegiatan terbaru berdasarkan `publishedAt` descending.

**Cara tambah kegiatan baru ke highlights home:**
1. Tambah entri baru di array `activities` di file ini
2. Set `publishedAt` ke tanggal terbaru agar muncul di posisi atas
3. Jalankan `npm run build`

Kegiatan terkini saat ini: **IGTS Angkatan 8** (`publishedAt: '2026-06-20'`).

---

## Halaman Detail Kegiatan

Setiap halaman di `src/pages/activities/*.astro` menggunakan komponen:

| Komponen | Props penting |
|---|---|
| `HeroDetail` | `eyebrow`, `title`, `titleHighlight`, `description`, `tags[]`, `emoji`, `bgClass`, `videoId?` |
| `StatsStrip` | `stats: [{value, label}]` |
| `GalleryGrid` | `images?: string[]`, `gallery?: string` — `data-gallery` dan `data-src` per item untuk lightbox |
| `HistorySidebar` | `items: [{year, title, meta}]` |
| `RelatedActivities` | `items: [{href, tag, title, description, emoji, bgClass, image}]` |

**Video di HeroDetail:** gunakan prop `videoId` (YouTube ID). Tombol "Tonton Video" hanya render jika `videoId` diberikan. Menggunakan `data-watch-video={videoId}` (bukan `data-video-id`).

**Hero gradient mask fade:** `.hero-detail-overlay` menggunakan double gradient — kiri-ke-kanan (gelap 98% di kiri → transparan di kanan, video/bg terlihat penuh) + bawah-ke-atas (vignette tipis). Teks terbaca karena sisi kiri sangat gelap; video YouTube muncul jelas di sisi kanan. Konten teks (`hero-detail-content`) vertikal tengah (`align-items: center`).

**Sidebar CTA cards dihapus** dari semua halaman detail — tidak ada lagi card "Daftarkan Sekolahmu", "Daftar sebagai Peserta", "Ikut MVOH Season 9", "Daftar untuk SKS XV" di sidebar. Sidebar hanya berisi `HistorySidebar`.

**Lightbox GalleryGrid:** setiap item `data-gallery` harus punya nilai unik per halaman (`"igts"`, `"igt"`, `"mvoh"`, `"pagelaran"`). Lightbox dikelompokkan berdasarkan nilai ini.

---

## Halaman Semua Kegiatan (`src/pages/activities/index.astro`)

Route `/activities`. Header hero + filter kategori + grid semua kegiatan.

**Filter kategori (`.filter-bar`, `id="filterBar"`):** tombol `.filter-item[data-filter]` (`all`/`igts`/`igt`/`mvoh`/`pagelaran`/`senam`), klik toggle `.active` di semua tombol yang share `data-filter` sama (lihat bagian FAB di bawah) + filter `.act-card[data-label]` via `classList.toggle('hidden', ...)`.

**⚠️ `.filter-bar` (dan `.page-nav` di about.astro) WAJIB `position: relative`, BUKAN `position: sticky`.** Awalnya `sticky; top: 82px` — begitu discroll, dia bertabrakan/tumpang-tindih dengan pill navbar mengambang yang juga `position: fixed` (lihat "Komponen Navbar" di bawah), soalnya keduanya jadi rebutan area yang sama pas discroll bareng. **Fix (2026-08-13):** diganti `position: relative` biasa (scroll normal ikut alur halaman, hilang begitu discroll lewat) — override `top` di breakpoint mobile juga dihapus karena gak relevan lagi. Kalau nanti butuh filter-bar/page-nav "nempel" lagi pas discroll, JANGAN pakai `sticky` langsung — pertimbangkan FAB pattern di bawah ini dulu (fungsinya sama tapi gak akan tabrakan dengan navbar).

**Filter FAB (`#filterFab` + `#filterPanel`)** — tombol bulat mengambang pojok kanan-bawah, jalan pintas ganti kategori tanpa scroll balik ke atas. **Cuma muncul setelah `.filter-bar` discroll lewat (gak keliatan lagi di viewport)** — dipantau via `IntersectionObserver({threshold:0})` yang observe `#filterBar`, toggle class `.visible` di `#filterFab` berdasarkan `!entry.isIntersecting`. Klik FAB toggle `.filter-panel` (isi kategori yang sama, `data-filter` identik dengan filter-bar asli — klik tombol mana pun otomatis sinkron status `.active` di KEDUA set tombol sekaligus, bukan cuma yang diklik). Panel/FAB ditutup lewat: klik salah satu item filter, klik di luar panel (`document` click listener + `.contains()` check), atau `Escape`. **Card panel utamanya (`.filter-panel`) punya cincin cahaya hijau berputar mengelilingi seluruh card** (teknik persis sama dengan `.nav-cta` tombol Bergabung — `::before` conic-gradient raksasa 220% diputar `navCtaSpin` 3.5s infinite, `::after` lapisan solid putih inset 1.5px nyisain garis tipis sebagai cincin cahayanya; `isolation:isolate` + `overflow:hidden` di `.filter-panel` supaya conic-gradient raksasa ke-clip rapi ke bentuk rounded card-nya) — item filter DI DALAM panel (`.filter-item.active`) TETAP pakai style solid biasa (bg gelap `#1c2e1c`), efek cincin cahayanya cuma di card pembungkusnya, bukan di item yang di-klik (2026-08-13, iterasi dari permintaan user — awalnya sempat dicoba di item aktif dulu, lalu dipindah ke card utama atas revisi user). Pola FAB + glow-ring card ini di-reuse persis sama di `about.astro` untuk page-nav (lihat bagian "Halaman About" di bawah).

Ini section "Sorotan Kegiatan Terkini" + grid semua kegiatan (`.act-grid`, 4 kolom) di bawah filter — kartu sama style dengan `.card` di Home tapi versi grid, bukan horizontal-scroll.

---

## Halaman Karir (`src/pages/karir.astro`)

Form bergabung dengan validasi client-side:
- `id="joinForm"` + `novalidate`
- Validasi di `astro:page-load`, bukan submit default browser
- Error ditampilkan dengan `.error-msg` span (append ke `parentElement`)
- Field invalid diberi class `.input-error`
- Radio group "peran" divalidasi dengan `showGroupError()`
- Modal sukses (`#modalOverlay`) muncul setelah semua validasi lolos, menggunakan class `.show`

---

## Halaman About (`src/pages/about.astro`)

Konten resmi dari web F-INLA. **Isi/teks tiap section TIDAK PERNAH diubah** (lihat catatan redesain di bawah) — cuma layout/visual yang berubah dari waktu ke waktu. Sections (urutan dari atas):

1. **Hero** (`.hero-about`) — headline + deskripsi singkat
2. **In-page nav** (`.page-nav`, `id="pageNav"`) — anchor ke: Perkenalan, Sejarah, Tujuan, Target, Misi, Makna, Perjalanan. Aktif saat scroll via `IntersectionObserver`. Sekarang berbentuk **pill mengambang** (`border-radius:999px`, floating card putih dengan `margin-top:-28px` nutupin dikit ke hero di atasnya, `box-shadow` besar) — bukan lagi bar penuh dengan underline tab seperti sebelumnya (lihat "Redesain About Us" di bawah).
3. **Perkenalan** (`#perkenalan`) — "Mari Kenali Kami": tagline resmi F-INLA + deskripsi organisasi nirlaba internasional. CSS scoped: `.intro-wrap`, `.intro-main-h2`, `.intro-divider`, `.intro-sub-heading`, `.intro-tagline`, `.finla-block`, `.finla-name`, `.finla-desc`.
4. **Sejarah** (`#sejarah`, dark bg) — "Asal Mula Pendirian": 3 paragraf resmi (INLA 2006 HK, F-INLA 2015, Wang Ciguang sejak 2001). Layout **2 kolom**:
   - Kiri: teks + stats (20+ negara, 2006) + kartu bendera 11 negara
   - Kanan: foto `hongkong.jpg` dengan **CSS gradient mask** (`mask-image: linear-gradient(to right, transparent → black)`) — teks memudar ke foto
5. **Tujuan** (`#tujuan`, krem) — Sepuluh Prinsip Bersama + tujuan global. Teks dibungkus `.tujuan-block.section-card` (lihat `.section-card` di "Redesain About Us" di bawah).
6. **Target** (`#target`, putih) — Lima Keharmonisan (pikiran/tubuh → keluarga → masyarakat → bangsa → dunia). 5 item numbered, sekarang dalam SATU `.target-list.section-card` (rounded card putih) dengan tiap `.target-item` dipisah hairline divider (`border-bottom`), bukan lagi 5 box kartu terpisah-pisah.
7. **Misi & Tugas** (`#misi`, krem) — Paragraf misi resmi + **7 poin Promosi dan Praktik** bernomor, sekarang dalam SATU `.promosi-section.section-card`, tiap `.promosi-item` dipisah hairline divider (pola sama dengan Target di atas — konsisten setelah redesain).
8. **Makna INLA** (`#makna`, dark bg) — **4 kartu saja** (I, N, L, A) — grid 4 kolom. S dan U dihapus karena INLA hanya 4 huruf.
9. **Closing** — 世界一家
10. **Perjalanan** (`#perjalanan`) — Timeline 12 tonggak sejarah resmi F-INLA, 2006–2025 (bukan generik/placeholder). Konten diberikan langsung oleh user (2026-07-22), diambil dari dokumentasi resmi organisasi. Beberapa entri menggabungkan rentang tahun (`2009-2010`, `2011-2012`, `2019-2020`) karena mencakup lebih dari satu peristiwa berdekatan. `tl-desc` di sini jauh lebih panjang dari card timeline generik biasanya (bisa 60-100+ kata per entri, beberapa peristiwa per tahun) — `.tl-desc` di `global.css` tidak punya batas tinggi/line-clamp, jadi card otomatis menyesuaikan tinggi, tidak perlu diringkas paksa. **Hover effect `.tl-card`**: border berubah jadi hijau muda `#7ec87e` (warna resmi palet) + glow lembut (`box-shadow` rgba hijau muda, bukan neon `#00ff88` seperti modal video mv-music) saat di-hover, dikombinasikan dengan efek `translateY(-2px)`. Pola hover-glow ini scoped khusus `.tl-card` — jangan disamakan/dicampur dengan neon glow modal video yang beda warna & beda konteks.
11. **CTA** (`.cta-section`) — "Jadilah Bagian dari Perjalanan Ini" → `/karir`. Sekarang berbentuk **card rounded mengambang** (`max-width:1160px; margin:56px auto; border-radius:32px`), bukan full-bleed section — tombol `.btn-white` dapat glow pill (`box-shadow` ganda, ring putih + glow hijau).

> Section "Recent" (6 kartu sosmed Instagram) yang dulu ada di sini **sudah dihapus permanen** (2026-08-13) — lihat catatan Instagram di bagian "Halaman Home" di atas, penghapusannya barengan dengan Home.

**Gambar sejarah:** `hongkong.jpg` dari `public/SRC/` (path via BASE prefix).

---

### Redesain About Us — terinspirasi wealthclub.id (2026-08-13)

User minta redesain visual/layout total halaman About meniru **tata letak & UI/UX** situs [wealthclub.id](https://wealthclub.id/) (diriset langsung via `mcp__claude-in-chrome` — sandbox cloud gak punya akses internet umum jadi gak bisa Playwright langsung ke situs eksternal, cuma bisa ke browser asli user), TAPI **palet warna INLA sendiri tetap dipakai** (bukan tema gelap/hitam wealthclub) dan **isi/makna tiap paragraf sejarah TIDAK BOLEH berubah** — cuma boleh polesan kata yang sangat minor kalau perlu, intinya harus tetap sama persis.

**Backup sebelum redesain (WAJIB dicek dulu kalau mau revert):** versi `about.astro` sebelum redesain ini (post-penghapusan-Instagram, sebelum perubahan visual) disimpan di 3 tempat:
1. Dikirim langsung ke user lewat chat (file `about.astro`)
2. Disimpan di Claude Project "INLA SUMUT (The International Loving Asocatiation) WEB" sebagai `claude/about-astro-backup-before-wealthclub-redesign.astro`
3. (Kalau masih ada) copy lokal di sesi Claude yang mengerjakan redesain ini

Kalau redesain ini mau di-revert total, ambil dari salah satu backup di atas, bukan ditulis ulang manual dari nol.

**Pola desain yang diadopsi dari wealthclub.id (semua di `global.css`, scoped ke class-class yang sudah ada di about.astro — TIDAK ada file/komponen baru):**
- **`.section-card`** — class baru, container rounded besar (`border-radius:28px`, `border:1px solid #e4e0d4`, `box-shadow` lembut, `padding:36px 40px`, mobile turun ke `24px 20px`/`20px 16px`) — dipakai buat bungkus blok Tujuan (`.tujuan-block`), Target (`.target-list`), dan Misi (`.promosi-section`). ini elemen inti dari "gaya wealthclub" — mereka bungkus tiap grup konten dalam card besar rounded, bukan section polos.
- **List bernomor pakai hairline divider**, bukan box per-item — `.target-item` dan `.promosi-item` sekarang `border-bottom:1px solid #ece8dc` antar-item (item terakhir `border-bottom:none`) di dalam satu `.section-card`, meniru pola numbered-feature-list wealthclub ("01 Report Business...", dst).
- **Heading section (`.sec-h2`, `.sec-h2-light`, `.meanings-h2`, `.journey-h2`) dibikin lebih besar & bold** — dari `font-size:28px; font-weight:500` jadi `font-size: clamp(26px, 3.6vw, 38px); font-weight:700; letter-spacing:-0.01em`. Eyebrow label (`.eyebrow`, `.eyebrow-light`) juga dipertebal (`font-weight:600`, `letter-spacing:0.12em`).
- **`.page-nav` jadi pill mengambang** — lihat poin 2 di daftar section atas. Item aktif (`.page-nav-item.active`) solid dark fill `#1c2e1c`, bukan lagi underline tab.
- **`.hero-about`** — heading naik ke `clamp(34px, 6vw, 58px)`, `font-weight:700`, padding vertikal ditambah, eyebrow jadi pill kecil dengan border (`display:inline-block; border-radius:999px; padding:7px 16px`) alih-alih teks polos.
- Border-radius kartu-kartu lain (`.glass-card`, `.meaning-card`, `.tl-card`) dinaikkan dikit (14px/14px→20px/20px) biar konsisten sama rounded card besar yang baru.

**Verifikasi:** di-tes penuh (desktop 1400px & mobile 390px, scroll dari hero sampai footer) pakai Playwright + Chromium di sandbox lokal (bukan situs live) sebelum dikirim ke device user — semua section render benar, konten utuh, navbar (`<Navbar activePage="about" />`) sama sekali tidak disentuh.

### Page-nav FAB (`#pageNavFab` + `#pageNavPanel`)

Sama persis pola **Filter FAB** di `activities/index.astro` (lihat bagian "Halaman Semua Kegiatan" di atas) — cuma di-reuse untuk page-nav About, ditambahkan 2026-08-13 atas permintaan user ("pas discroll ke atas sampai gak keliatan, muncul tombol hamburger pojok kanan bawah"). Detail:
- `#pageNav` (nav pill di atas) diobservasi via `IntersectionObserver({threshold:0})` — begitu `!entry.isIntersecting` (udah discroll lewat, gak keliatan lagi), `#pageNavFab` dapat class `.visible`.
- Klik FAB toggle `#pageNavPanel` — isinya 7 link section yang sama (`<a class="page-nav-item filter-item">`), reuse class `page-nav-item` yang sama dengan pill nav asli supaya **status aktifnya otomatis ke-sinkron** oleh `initAbout()` (script yang sama yang nge-highlight pill nav berdasarkan `IntersectionObserver` per section) — TIDAK ada logic active terpisah buat panel ini.
- Klik salah satu link di panel → auto `closePageNavPanel()`. Klik di luar panel / `Escape` juga nutup, sama seperti Filter FAB.
- `.filter-panel` (card pembungkus panel) dapat efek **cincin cahaya hijau berputar** di sekeliling card-nya (reuse `::before`/`::after` + `@keyframes navCtaSpin` yang sama dengan tombol Bergabung) — item link di dalamnya TETAP style biasa, efeknya cuma di card-nya, BUKAN di item yang lagi aktif (lihat detail teknis lengkap di bagian "Halaman Semua Kegiatan").

---

## Halaman MV & Music (`src/pages/mv-music.astro`)

Route `/mv-music`. Tidak pakai `HeroDetail` — hero-nya scoped sendiri di file ini (`.hero-mvmusic`, meniru pola `.hero-activities`/`.hero-karir` di `global.css` tapi tidak ditaruh di sana karena halaman ini berdiri sendiri).

### Sections (urutan dari atas):
1. **Hero** — eyebrow "🎵 Musik & Visual", judul "MV & *Music*".
2. **Album Grid** (`.album-grid`) — **dua sumber digabung** dalam satu grid: album video = **playlist asli** channel YouTube via `getChannelAlbums('inlasumut')` (lihat bagian "Video — YouTube Data API"), href `{BASE}/mv-music/{slug}`; album audio = `audioAlbums` dari `src/data/albums.ts` (lihat "Halaman Detail Album — Full Audio"), href `{BASE}/mv-music/audio/{slug}` — thumbnail-nya butuh prefix `BASE` manual (path public lokal), beda dengan thumbnail video yang sudah URL eksternal penuh (`i.ytimg.com`, gak boleh di-prefix `BASE`). Grid 5 kolom (`≤1024px`→3 kolom, `≤768px`→2 kolom), gap 14px, cover `aspect-ratio:1/1`. **Tidak ada load-more/pagination.**
3. **Divider** (`.divider-with-label`) — dua `<hr>` + label tengah "Video & MV".
4. **Video Grid** (`.video-grid`) — jumlah video **dinamis** (hasil filter YouTube API, lihat bagian "Video — YouTube Data API" di bawah), grid 3 kolom (`≤768px`→2, `≤480px`→1), gap 14px. Klik kartu **membuka modal in-page**, bukan link keluar/tab baru.
5. Footer, lalu modal video (`#video-modal`) sebagai sibling terakhir sebelum `</Layout>`.

### Video — YouTube Data API (`src/utils/youtube.ts`)
Section "Video & MV" **tidak lagi hardcode `videoIds`**. Fungsi `getChannelVideosNotInPlaylists('inlasumut')` fetch via **YouTube Data API v3** dan mengembalikan semua video milik channel `@inlasumut` yang **tidak masuk playlist manapun** di channel itu, terurut dari yang terbaru (`publishedAt` descending). Dipanggil dari frontmatter `mv-music.astro`: `const videos = await getChannelVideosNotInPlaylists('inlasumut');`.

**Alasan desain:** rencananya semua video yang ada di playlist (album/koleksi musik) akan ditampilkan di bagian "Koleksi Album" (desainnya belum final), jadi section "Video & MV" khusus menampilkan video **di luar** playlist manapun — otomatis, tanpa perlu update manual tiap ada video baru di channel.

**Cara kerja `getChannelVideosNotInPlaylists`:**
1. Resolve handle → `channelId` + `uploadsPlaylistId` via `channels.list?forHandle=...`
2. Ambil semua ID playlist di channel via `playlists.list?channelId=...` (paginated)
3. Ambil semua video ID di tiap playlist via `playlistItems.list?playlistId=...` (paginated, `Promise.all` paralel)
4. Ambil semua video uploads channel (title, thumbnail, publishedAt) via `playlistItems.list?playlistId={uploadsPlaylistId}` (paginated)
5. Filter: video uploads yang ID-nya **tidak ada** di gabungan seluruh video ID playlist → itu yang ditampilkan
6. Sort descending berdasarkan `publishedAt`
7. Untuk tiap video hasil filter, fetch `aspectRatio` asli via oEmbed (lihat "Deteksi Video Vertikal" di bawah), concurrency 20 pakai `mapWithConcurrency()`

**Cache in-memory** (variable module-scope `cache`) — hasil filter (bukan per-video seperti oEmbed dulu) di-cache sekali karena butuh banyak request berpaginasi (bisa >9 halaman untuk 438 video, plus 1 oEmbed request per video hasil filter). Dev server: fetch penuh sekali di awal (~7 detik), navigasi berikutnya instan. Build: fetch sekali per proses build (~7-8 detik, tidak signifikan menambah waktu build total).

### Deteksi Video Vertikal (Shorts) untuk Modal
Thumbnail YouTube (`snippet.thumbnails` dari Data API) **selalu** dipotong ke ukuran tetap (misal 480×360) apapun orientasi video aslinya — tidak bisa dipakai deteksi vertikal. oEmbed lewat URL `youtu.be/{id}` atau `/watch?v=` juga cuma balas dua preset ukuran (16:9 atau 4:3), **tidak pernah** portrait, bahkan untuk video Shorts asli.

**Trik yang dipakai** (`getOembedAspectRatio` di `youtube.ts`): request oEmbed pakai URL bentuk `https://www.youtube.com/oembed?url=https://www.youtube.com/shorts/{id}&format=json` — lewat path `/shorts/{id}` ini, YouTube balas `width`/`height` **asli** video (untuk Shorts beneran: `width < height`, misal `113x200`). Aman dipanggil untuk video non-Shorts juga (tetap balas ukuran landscape/4:3 normal, tidak error). Ditemukan lewat eksperimen manual — bukan API resmi yang didokumentasikan, jadi kalau YouTube ubah perilaku ini di masa depan, fallback-nya `16 / 9` (lihat `catch` block).

`ChannelVideo.aspectRatio` (angka `width / height`) dikirim ke tiap `.video-card` lewat `data-aspect={video.aspectRatio}`. Saat modal dibuka, `openModal(videoId, aspectRatio)` set CSS var `--video-ar` ke aspect ratio asli video itu, dan toggle class `.is-vertical` di `.modal-content` kalau `aspectRatio < 1` (mempersempit lebar modal jadi `min(26%, 380px)` supaya video vertikal tidak punya area kosong di kiri-kanan).

**Env var wajib:** `YOUTUBE_API_KEY` (lihat bagian "Environment Variables" di atas). Kalau kosong, fungsi throw error saat build/dev — bukan fallback diam-diam, karena section ini butuh data real dari API (tidak ada cara render fallback yang masuk akal untuk daftar video dinamis).

**Kalau channel ganti handle** atau mau target channel lain: ganti string `'inlasumut'` di pemanggilan `getChannelVideosNotInPlaylists()` di `mv-music.astro`.

### Album = Playlist YouTube (`getChannelAlbums`, dipakai grid mv-music.astro DAN halaman detail)
Fungsi `getChannelAlbums('inlasumut')` fetch **semua playlist** channel via `playlists.list?channelId=...` (title, description, thumbnail, itemCount), lalu untuk tiap playlist ambil semua videonya (`playlistItems.list`) + durasi & view count asli (`videos.list?part=contentDetails,statistics`, di-batch 50 ID/request) + `aspectRatio` per video (oEmbed trik `/shorts/{id}`, sama seperti video biasa). Playlist yang kosong (0 video) di-skip.

Tiap album dapat `slug` dari `slugify(title)` (lowercase, strip diakritik via `.normalize('NFKD')`, non-alfanumerik jadi `-`). Kalau ada 2 playlist judulnya sama persis setelah slugify (misal beda bahasa), slug kedua dan seterusnya dapat suffix 6 karakter terakhir dari playlist ID biar tidak bentrok.

**Keterbatasan `thumbnail` album — BUKAN bug, ini batas resmi YouTube Data API:** `playlists.list?part=snippet` cuma bisa balikin thumbnail dari **video urutan pertama** di playlist (position 0). Kalau pemilik channel set cover custom lewat YouTube Studio (pilih video lain sebagai representasi, atau upload gambar custom), cover itu **tidak ada endpoint publik**-nya — API selalu balikin video pertama, walau itu beda dari yang tampil di halaman YouTube.com. Contoh nyata: playlist "Pagelaran Senam Kasih Semesta Muda-Mudi Sumatera Utara 2025" di YouTube Studio covernya poster flyer custom, tapi API cuma bisa kasih thumbnail video "01. Tim Galaksi...". Sudah dikonfirmasi ke user (2026-07-17) dan **sengaja dibiarkan untuk sekarang** — solusi permanennya nanti lewat admin panel (upload cover manual per album), bukan lewat API. Jangan coba "perbaiki" ini dengan cara lain (misal reorder playlist di YouTube) kecuali user minta.

**Cache terpisah dari `getChannelVideosNotInPlaylists`** (variable module-scope `albumsCache`) — dipanggil dari **dua tempat**: grid album di `mv-music.astro` (butuh `id`, `slug`, `title`, `thumbnail`, `videoCount`, `totalDurationLabel` saja) dan `getStaticPaths()` di `mv-music/[slug].astro` (butuh full `videos[]`). Karena kedua pemanggilan jalan dalam satu proses build/dev yang sama, cache module-level ini mencegah fetch dobel — **jangan** hapus cache ini atau ubah jadi fetch-per-page.

### Search Video (`#video-search`) — 20 kartu statis + fetch on-demand
Karena jumlah video di section "Video & MV" bisa banyak (341 video hasil filter API), section ini **cuma render 20 kartu pertama (terbaru) langsung di HTML** (`videos.slice(0, 20)` di frontmatter mv-music.astro). Ini optimasi ukuran halaman — versi awal nge-render SEMUA 341 kartu ke HTML (disembunyikan lewat CSS `nth-of-type`) bikin `mv-music/index.html` **452 KB**; setelah diubah jadi 20-kartu-statis + fetch-on-demand, turun jadi **~44 KB** (build production, 2026-07-17). Muncul hint text di atas grid: "Menampilkan 20 dari X video terbaru — gunakan pencarian untuk lihat semua" (`.video-list-hint`, cuma dirender kalau `videos.length > 20`).

**Sumber data 341 video lainnya:** `src/pages/mv-music/videos.json.ts` — API route Astro yang di-generate jadi file JSON statis saat build (`output: 'static'` project ini prerender semua route termasuk API route, gak perlu `export const prerender = true` eksplisit). Isinya array semua video dari `getChannelVideosNotInPlaylists('inlasumut')` (field: `id`, `title`, `thumbnail`, `author`, `aspectRatio` — subset field yang dibutuhkan render kartu, bukan seluruh `ChannelVideo`). ~64 KB, **cuma ke-fetch kalau user mulai ngetik di search box** (bukan saat page load) — cache di variable `allVideosPromise` supaya cuma fetch sekali per kunjungan halaman.

**Cara kerja search** (di dalam blok `astro:page-load` yang sama dengan modal):
1. Query kosong → `videoGrid.innerHTML` di-reset ke `defaultGridHTML` (snapshot 20 kartu asli yang disimpan di awal, sebelum sempat diubah-ubah)
2. Query terisi (debounce 200ms) → `fetchAllVideos()` (fetch videos.json, cache promise-nya) → filter `title.includes(query)` di **semua** 341 video → render hasil lewat `videoCardHTML(video)` (template string, bukan lagi elemen yang sudah ada di DOM) → `videoGrid.innerHTML = matches.map(videoCardHTML).join('')`
3. Kalau hasil kosong, tampilkan `#video-search-empty`. `.video-list-hint` disembunyikan selama ada query aktif.

**Klik kartu pakai event delegation** (`videoGrid.addEventListener('click', ...)` + `e.target.closest('.video-card')`), **bukan** listener per-kartu — supaya kartu hasil pencarian yang baru di-`innerHTML`-kan otomatis ke-handle juga tanpa perlu re-attach listener tiap render ulang.

**Bug yang pernah kejadian — jangan diulang, 2 kasus:**
1. Kartu yang match sempat di-set `card.style.display = 'block'` vs `''` — kalau pola lama (semua 341 di DOM + CSS `nth-of-type` sembunyiin) dipakai lagi, inget string kosong `''` cuma menghapus override inline, bukan reset ke "tampil", jadi CSS `nth-of-type` tetap menang. (Sudah tidak relevan sejak pindah ke pola fetch-on-demand, tapi kalau ada yang mau balik ke pendekatan lama, bug ini bisa muncul lagi.)
2. **Kartu yang di-`innerHTML`-kan gak dapat styling SAMA SEKALI** — semua CSS kartu video (`.video-card`, `.video-thumb-wrap`, `.video-thumb`, `.video-overlay`, `.video-play-btn`, `.video-title`, `.video-subtitle`) di scoped `<style>` mv-music.astro **wajib dibungkus `:global(...)`**. Sebabnya sama kayak bug iframe di `mv-music/[slug].astro` (lihat bagian "Halaman Detail Album"): Astro cuma nempelin atribut scope `data-astro-cid-*` ke elemen yang ditulis di template `.astro` saat build — kartu yang dibikin lewat `videoCardHTML()` + `innerHTML` di browser gak pernah dapat atribut itu, jadi versi scoped dari selector-selector itu gak akan pernah match dan CSS-nya kelihatan "hilang total" (kartu polos tanpa gambar/layout). **Pola `:global()` ini WAJIB dipakai tiap kali CSS project ini menyasar elemen yang bisa di-render lewat JS (bukan cuma lewat template `.astro`)** — cek juga bagian ini kalau nanti ada elemen lain yang di-generate dinamis.

**Efek fokus input:** saat input di-klik/fokus, muncul cahaya hijau neon lembut berpulsasi (`@keyframes searchGlowPulse`, box-shadow `rgba(0,255,136,...)` / `rgba(74,222,128,...)`) — sengaja meniru vibe glow di modal video (lihat di bawah), tapi versi lebih kecil/halus (bukan ring berputar, cuma cahaya). Ini perluasan eksplisit dari pengecualian warna neon (awalnya cuma modal video) — tetap jangan pakai warna ini di komponen lain tanpa konfirmasi user.

### Modal Video Player (`#video-modal`)
Klik kartu (`<div data-video-id={id} role="button" tabindex="0">`, **bukan** `<a>`) → buka modal in-page dengan iframe YouTube autoplay. **Tidak ada tombol close** (dihapus atas permintaan user) — modal cuma bisa ditutup lewat klik backdrop atau `Escape`, keduanya panggil `closeModal()` yang sama (clear `iframe.src`, `body.style.overflow = ''`).

**Ukuran modal menyesuaikan orientasi video** (lihat "Deteksi Video Vertikal" di atas) — video landscape/4:3 dapat box lebar `min(72%, 860px)`, video vertikal (Shorts) dapat box sempit `min(26%, 380px)` (mobile: `60%`) lewat class `.is-vertical` + CSS var `--video-ar`, supaya tidak ada area kosong di kiri-kanan video vertikal.

**Tiga pengecualian sengaja dari konvensi project, scoped HANYA di halaman ini:**
- Toggle pakai `modal.classList.add/remove('active')` — bukan `element.style.display` inline seperti lightbox/video-modal global di `Layout.astro`. Ini modal terpisah, bukan yang di Layout.astro, dan tetap dibungkus `astro:page-load` sesuai aturan wajib project. **Jangan ubah pola ini ke `display:flex/none`** kecuali diminta — dan jangan copy pola `classList` ini ke modal Layout.astro yang sudah ada.
- Glow ring/pulse modal pakai warna neon hijau (`#00ff88`, `rgba(74,222,128,...)`) — **di luar palet resmi** di bagian "Sistem Warna". Ini permintaan eksplisit user untuk efek premium khusus modal ini (dan sudah diperluas juga ke fokus input search, lihat di atas). Jangan pakai warna ini di tempat lain tanpa konfirmasi, dan jangan "koreksi" balik ke hijau standar tanpa diminta.
- **Tidak ada tombol close** — beda dari lightbox/video-modal global di `Layout.astro` yang punya tombol `×` eksplisit. Jangan tambahkan kembali tanpa diminta.

Modal **tidak menampilkan judul video** (elemen `.video-meta`/`#video-modal-title` sempat ada lalu dihapus atas permintaan user — cukup video saja, tanpa teks di bawahnya).

---

## Halaman Detail Album — Full Video (`src/pages/mv-music/[slug].astro`)

Route dinamis `/mv-music/:slug` — satu halaman ter-generate per **playlist YouTube** channel `@inlasumut` (lewat `getStaticPaths()` + `getChannelAlbums('inlasumut')` dari `utils/youtube.ts`). Diakses dari klik kartu album di grid `/mv-music`.

**INI HALAMAN DENGAN PALET WARNA & FONT SENDIRI — BUKAN BUG, INI DISENGAJA.** User kasih spek desain eksplisit lengkap dengan hex code, beda total dari "Sistem Warna (WAJIB DIIKUTI)" di bagian atas file ini. Exception ini **scoped HANYA ke halaman ini** (dan `mv-music/[slug].astro` saja) — jangan pernah pakai token warna/font di bawah ini di halaman lain tanpa user minta eksplisit lagi, dan jangan "koreksi" balik ke palet hijau standar site.

### Design Tokens (didefinisikan di `.album-page` sebagai CSS custom property, BUKAN `:root`)
```
--green-950: #0E2417   --lime-400: #7AC943   --cream: #F4F1E6      --gold: #E3B24F
--green-900: #14301F   --lime-300: #A3E06B   --cream-dim: #CFD6C9
--green-800: #1F6E3D                          --line: rgba(244,241,230,0.14)
                                               --glass: rgba(244,241,230,0.06)
```
Font: **Fraunces** (judul/serif), **Inter** (body), **JetBrains Mono** (label/angka/eyebrow/marquee) — di-load lewat `<Fragment slot="head">` (`<link rel="preconnect">` + `<link rel="stylesheet">` Google Fonts, lihat bagian "Slot head" di atas), **bukan** `@import` di dalam `<style>` scoped (sempat begitu, lalu dipindah karena `@import` render-blocking). Dua halaman ini (`mv-music/[slug].astro` dan `mv-music/audio/[slug].astro`) sama-sama load font ini secara terpisah (duplikasi kecil, sengaja — biar tetap independen per halaman, tidak taruh di Layout.astro global).

**Kenapa custom property di `.album-page` bukan `:root`:** Astro scoped `<style>` cuma nempelin atribut scope ke elemen yang di-render component itu sendiri — `<html>`/`<body>` dirender `Layout.astro`, jadi rule `:root {...}` di scoped style halaman ini **tidak akan pernah match**. Solusinya: definisikan semua custom property di elemen wrapper `.album-page` yang memang dirender halaman ini, lalu semua descendant selector normal inherit nilainya.

### Komponen `AlbumHeroBackground.astro` (shared video + audio)
Extract dari implementasi awal halaman video, dipakai juga di `mv-music/audio/[slug].astro`. Props: `heroId` (string) — id dari section hero pemanggil. Render: noise texture (SVG `feTurbulence`), 2 blob mengambang (`hero-blob-lime` kiri-atas, `hero-blob-gold` kanan-bawah, `blobFloat` 12s, warna di-hardcode `#7AC943`/`#E3B24F` bukan `var(--lime-400)` — sengaja supaya komponen ini independen, tidak bergantung parent punya custom property itu), cursor spotlight radial lime (`#{heroId}-spotlight`, CSS var `--x`/`--y` di-update lewat `mousemove` pada elemen `#{heroId}`).

**Parent WAJIB:** section pembungkus `position:relative; overflow:hidden;` dengan `id={heroId}` yang SAMA dengan prop yang dikasih ke komponen (`<AlbumHeroBackground heroId="album-hero" />` di dalam `<section id="album-hero">`).

**Spotlight otomatis mati di mobile/touch** — dicek via `window.matchMedia('(hover: hover) and (pointer: fine)').matches`, kalau false (gak ada mouse asli) event listener mousemove gak dipasang sama sekali. Blob juga mengecil (`width/height: 220px`, `opacity: 0.22`) di `@media (max-width: 768px)`.

**Kalau nanti nambah halaman detail album/hero baru:** import komponen ini, jangan copy-paste ulang CSS blob/noise/spotlight ke file baru.

### Struktur halaman
1. **Hero** (`min-height:78vh`) — background dekoratif (radial+linear gradient hijau gelap, noise texture, 2 blob mengambang, cursor spotlight) di-render lewat `<AlbumHeroBackground heroId="album-hero" />` (lihat `src/components/AlbumHeroBackground.astro`, di-extract supaya bisa dipakai bareng halaman audio, jangan copy-paste manual lagi ke halaman baru — import komponennya). Link `.hero-back` ("← Kembali ke Koleksi Album") di atas eyebrow, `href={BASE + '/mv-music'}` — satu-satunya tempat file ini butuh `BASE`. Eyebrow mono uppercase, judul Fraunces (`clamp(40px,7vw,76px)`) dengan **kata terakhir** di-`<em>` warna lime-400 (dipisah di frontmatter: `titleWords.pop()`), meta baris (jumlah video · total durasi), tombol "▶ Putar Semua".
2. **Marquee** — 2 grup identik teks berulang (judul album + tagline, dipisah `●`), `translateX(-50%)` infinite linear **60s** (awalnya 16s, kecepatan asli kegepetan menurut user — diperlambat ~4x) supaya loop seamless (2 grup sama persis = separuh perjalanan pas balik ke awal grup kedua yang keliatan sama).
3. **Daftar Video** (max-width 920px) — header "Daftar Video" + counter "0X TRACKS", tiap baris (`.video-row`, grid `44px 200px 1fr auto`): nomor urut mono, thumbnail 200px 16:9 dengan badge durasi asli (dari `videos.list?part=contentDetails`, bukan estimasi) + overlay play icon saat hover, judul + subtitle "Video", **jumlah view asli** (`videos.list?part=statistics`, format `Intl.NumberFormat('id-ID')`). Tilt 3D thumbnail ngikutin posisi mouse (`perspective(400px) rotateX/rotateY`, dihitung dari posisi relatif mouse terhadap elemen).

### Interaksi & data
- **Video player pakai YouTube IFrame Player API** (`YT.Player`, bukan `<iframe src="...">` biasa seperti di `mv-music.astro`) — dibutuhkan supaya bisa: (1) auto-lanjut ke video berikutnya begitu video selesai (`onStateChange` → `YT.PlayerState.ENDED`), (2) auto-skip kalau video error/playback disabled (`onError`). Target elemen `<div id="album-video-iframe">` di dalam `.iframe-wrapper` (bukan `<iframe>` langsung — `YT.Player` yang gantiin jadi iframe beneran saat di-construct). Glow/ring/style modal (`.modal-content`, `.glow-ring`, `.glow-outer`, `--video-ar` adaptif video vertikal) tetap sama persis polanya dengan `mv-music.astro`, cuma mekanisme pemutarannya beda.
- **Antrian (`queue`)** — array video + `embeddable` flag, dibangun dari `data-video-id`/`data-aspect`/`data-embeddable` tiap `.video-row`. `nextPlayableIndex(fromIndex)` cari video ter-embeddable berikutnya, dipakai baik oleh "Putar Semua" (mulai dari awal) maupun auto-next (lanjut dari `currentIndex`).
- **Video yang `embeddable:false`** (pemilik matikan "Playback on other websites" di YouTube Studio) — baris dapat class `.is-restricted` (thumbnail redup) + subtitle `"Video · Diputar di YouTube ↗"`, dan klik-nya **buka tab baru** (`window.open('https://youtu.be/{id}')`) alih-alih buka modal — supaya user tidak macet lihat kartu error YouTube "Playback on other websites has been disabled by the video owner" di dalam modal. "Putar Semua" otomatis skip video begini dari awal (lewat `nextPlayableIndex(-1)`).
- **Konstruksi player HARUS sinkron di dalam handler klik, TIDAK boleh di-`await` dulu.** Dua bug nyata yang pernah kejadian di sini, keduanya gara-gara timing:
  1. Kalau `new YT.Player(...)` di-construct saat container-nya masih `display:none` (misal dipanggil langsung pas `astro:page-load`, sebelum modal pernah dibuka), `onReady` **tidak pernah** terpicu sama sekali — makanya construct player-nya ditunda sampai `playIndex()` beneran dipanggil (container sudah `display:flex` duluan).
  2. Script IFrame API (`https://www.youtube.com/iframe_api`) di-**preload** lewat `requestIdleCallback` (fallback `setTimeout` 1s untuk browser tanpa `requestIdleCallback`, misal Safari) — bukan langsung blocking di awal `astro:page-load`, biar ~15 KB request-nya gak rebutan bandwidth/main-thread sama render awal (font, CSS, hero). Tapi tetap **jauh lebih awal** dari kapan user realistis sempat klik play (scroll baca hero+marquee dulu), jadi `window.YT.Player` biasanya sudah siap sinkron pas diklik. Video ID awal juga dikasih langsung di constructor (`new YT.Player(id, {videoId: ..., playerVars:{autoplay:1}})`), bukan lewat `loadVideoById()` yang dipanggil belakangan di `onReady` — soalnya kalau construct player-nya nunggu (`await`) apapun dulu (misal `await loadYouTubeApi()`), video kelihatan macet nge-buffer selamanya di 0:00. Perbaikan berikutnya kalau butuh ganti video (baris lain, atau auto-next) tetap boleh pakai `player.loadVideoById()` karena itu terjadi di dalam player yang sama yang sudah aktif — bukan konstruksi baru.
- **`.iframe-wrapper iframe { width:100%; height:100%; }` WAJIB pakai `:global(iframe)`, bukan `iframe` polos.** Bug nyata: video render kecil (default YouTube 640×360) di pojok modal, nyisain celah hijau kosong di kanan/bawah — padahal CSS-nya sudah benar dan `.iframe-wrapper` sendiri ukurannya sudah pas. Sebabnya: `<iframe>` di sini **bukan** elemen yang ditulis di template (templatenya `<div id="album-video-iframe">`), tapi di-inject runtime oleh `YT.Player()` yang gantiin div itu. Astro cuma nempelin atribut scope (`data-astro-cid-*`) ke elemen yang benar-benar ada di source template saat build — iframe yang dibikin JS di browser gak pernah dapat atribut itu, jadi versi scoped dari selector `iframe` (`iframe[data-astro-cid-xxx]`) gak akan pernah match dia. `:global(iframe)` bikin sisi kanan selector itu unscoped supaya match iframe apapun di dalam `.iframe-wrapper`, termasuk yang dinamis. **Pola ini WAJIB dipakai tiap kali CSS project ini menyasar elemen yang dibikin oleh JS pihak ketiga (bukan ditulis langsung di template `.astro`)** — beda dengan `mv-music.astro` yang `<iframe>`-nya statis di template jadi gak butuh `:global()`.
- Klik baris video (atau auto-next/auto-skip) → toggle class `.is-playing` di baris itu (baris lain di-reset) via `setPlayingRow(index)`, sinkron sama `currentIndex`.
- Tombol "Putar Semua" → animasi `pulseRing` (ring lime menyebar dari tombol, `border` + `scale(1.7)` fade out 0.65s) **dan** `playIndex(nextPlayableIndex(-1))` — mulai dari video ter-embeddable pertama, bukan cuma video index 0.
- Data video (`durationLabel`, `viewCount`, `aspectRatio`, `embeddable`) semuanya real dari API, bukan dummy — kalau `viewCount` undefined (jarang, video baru banget), kolom view dikosongkan bukan ditulis "0".
- **Field yang TIDAK ada sumber datanya** (kategori "Official MV / Teaser / Lyric Video / BTS" dari spek desain awal): YouTube API tidak expose ini. Subtitle tiap baris sekarang statis `"Video"` (atau `"Video · Diputar di YouTube ↗"` untuk yang restricted) — kalau nanti ada cara nge-tag kategori per video (misal dari admin panel yang direncanakan user), field ini yang perlu diisi.

**Cara verifikasi kalau debug lagi:** kalau video kelihatan macet di "0:00" dengan spinner berputar terus (baik di modal ini MAUPUN modal `mv-music.astro` yang masih `<iframe>` biasa, MAUPUN langsung buka youtube.com), itu **bukan bug di kode kita** — itu tandanya koneksi/sesi browser lagi bermasalah streaming YouTube (pernah kejadian pas testing 2026-07-17, konfirmasi dengan buka `youtube.com/watch?v=...` langsung dan cek apakah itu juga macet).

### Yang TIDAK ditambahkan (sesuai batasan eksplisit user)
- Tidak ada tombol lain selain "Putar Semua" (tidak ada "Simpan Album", share button, dll)
- Tidak ada warna/font di luar token yang disebutkan di atas

---

## Halaman Detail Album — Full Audio (`src/pages/mv-music/audio/[slug].astro`)

Route dinamis `/mv-music/audio/:slug` — satu halaman ter-generate per album di `src/data/albums.ts` (`getStaticPaths()` + `audioAlbums`). Diakses dari klik kartu album audio di grid `/mv-music`. **Desain sama persis token warna/font dengan halaman video** (`Halaman Detail Album — Full Video` di atas) — reuse `AlbumHeroBackground.astro`, palet `.album-page` (`--green-950` dst) didefinisikan ulang identik di file ini (duplikasi kecil disengaja, konsisten dengan pola video).

### Sumber Data — `src/data/albums.ts` (PENYIMPANAN SEMENTARA)
**Ini bukan solusi permanen.** User eksplisit bilang: taruh file di `public/audio/{slug}/` dulu, nanti kalau bagian database/admin panel sudah jadi, isi file dipindah ke situ (rencananya Supabase Storage, disebut di percakapan). Struktur data (`AudioAlbum`, `AudioTrack` interface) sengaja dipisah dari komponen halaman supaya migrasi nanti cuma ganti isi `url`/`thumbnail` jadi URL storage, **tanpa ubah halaman sama sekali**.

```ts
interface AudioTrack { title: string; language: string; durationSeconds: number; url: string }
interface AudioAlbum { slug: string; title: string; tagline: string; language: string; year: number | null; thumbnail: string; tracks: AudioTrack[] }
```

`formatDuration(seconds)` → `"3:50"`, `formatTotalDuration(seconds)` → `"1 jam 9 menit"` — di-export dari file yang sama, dipakai juga di `mv-music.astro` (grid) buat subtitle kartu.

**Album pertama:** `kembali-terhubung-dengan-alam` — 19 track asli (bukan dummy), disalin dari folder yang user taruh di root project (`Kembali Terhubung dengan alam/`, sudah TIDAK dipakai lagi setelah file disalin ke `public/audio/`). Durasi tiap track diambil dari metadata file asli (`afinfo`, macOS), **bukan dikira-kira** — field `durationSeconds` manual tapi akurat. `year: null` — user minta dikosongkan dulu, kalau `year` null, bagian itu di-skip dari meta line hero (bukan nge-print string kosong).

**⚠️ Ukuran file besar — `public/audio/kembali-terhubung-dengan-alam/` ~144MB, `dist/audio/` jadi ~154MB setelah build.** Ini akan membengkakkan ukuran repo git & lambat di-push/clone kalau di-commit. Sebelum commit/push perubahan ini, **konfirmasi dulu ke user** — jangan langsung `git add`/`git push` 144MB audio tanpa izin eksplisit, sesuai aturan "actions hard to reverse/affect shared state wajib konfirmasi". Solusi jangka panjang (Supabase Storage) akan menghilangkan masalah ini karena file gak perlu ikut ke git repo lagi.

**File asli** (mp3 dengan ekstensi `.mpeg` dari folder sumber, judul pakai spasi/nomor kayak `"01. Terlihat Seberkas Cahaya.mpeg"`) di-rename jadi slug URL-safe (`01-terlihat-seberkas-cahaya.mp3`) saat disalin ke `public/audio/` — meski isinya beneran MP3 (dikonfirmasi via `file` command: "MPEG ADTS, layer III, v1, 320 kbps"), ekstensi `.mpeg` bisa salah Content-Type di sebagian static host, makanya di-rename ke `.mp3` juga.

### Struktur halaman
1. **Hero** — 2 kolom (disc | info) via `.audio-hero-inner { grid-template-columns: auto 1fr; }`. Disc (`#disc-btn`, 220×220px, `border-radius:50%`, `background-image` dari `album.thumbnail`) muter terus via `animation: discSpin 14s linear infinite; animation-play-state: paused;` — di-toggle `.is-playing` (JS) buat `running`/`paused`, **bukan** animasi baru tiap klik (biar rotasi lanjut dari sudut terakhir, gak reset ke 0°). Overlay bulat semi-transparan (`.disc-overlay`) muncul saat hover, teks "▶ Putar"/"⏸ Jeda" tergantung state. `AlbumHeroBackground` reused persis seperti halaman video. Meta line (`bahasa · tahun · jumlah lagu · total durasi`) di-`.filter(Boolean)` supaya `year: null` gak nyisain separator kosong. **Tombol "▶ Putar Album"** (`#play-all-btn`, class `.play-all-btn` — style identik tombol "▶ Putar Semua" di halaman video, pill lime `var(--lime-400)`) ditaruh setelah meta line, ditambahkan atas permintaan user karena disc-nya sendiri gak cukup jelas sebagai ajakan "klik buat play" (overlay cuma muncul saat hover, gak keliatan default). Klik tombol ini cuma panggil `togglePlay()` yang sama dipakai disc/sticky player — **bukan logic terpisah** — jadi otomatis mulai dari track yang lagi ter-load (`currentIndex`, default track pertama karena `loadTrack(0, false)` jalan duluan saat page load).
2. **Marquee** — pola identik halaman video (2 grup, `translateX(-50%)`, 60s), simbol pemisah `♪` (bukan `●`, sesuai spek audio).
3. **Daftar Lagu** (max-width 1000px) — tiap baris (`.track-row`, grid `44px 1fr auto 40px`): nomor urut ATAU **equalizer 3 bar animasi** (`.track-eq`, `scaleY 0.9s ease-in-out infinite` beda delay per bar) kalau `.is-playing`, judul (truncate `text-overflow:ellipsis` kalau kepanjangan) + bahasa, durasi (`JetBrains Mono`), tombol lirik bulat "Aa" — klik buka **panel lirik** (lihat subbagian "Panel Lirik" di bawah), `stopPropagation()` supaya gak ikut trigger play baris.
4. **Sticky Player** (`position:fixed; bottom:0;`) — glassmorphism (`rgba(14,36,23,.86)` + `backdrop-filter:blur(20px) saturate(140%)`), grid 3 kolom (cover mini+judul | prev/play/next | progress bar+waktu). `padding-bottom` pakai `env(safe-area-inset-bottom)` buat notch iOS. **Markup-nya WAJIB ada di DALAM `.album-page`** (sebelum `</div>` penutup, sebelum `<Footer />`) — lihat bug di bawah kenapa ini penting.

**Bug nyata yang pernah kejadian (2026-07-17) — tombol play/prev/next kelihatan "redup":** sticky player awalnya ditulis sebagai SIBLING setelah `<Footer />`, di LUAR `.album-page`. Semua warnanya (`var(--lime-400)`, `var(--cream)`, `var(--cream-dim)`, dll) jadi gak ke-resolve — custom property CSS cuma bisa di-inherit oleh DESCENDANT elemen yang mendefinisikannya, dan `.album-page` (tempat semua `--lime-400` dkk didefinisikan) BUKAN ancestor dari sticky player yang ada di luar situ. Efeknya: `var(--lime-400)` dkk gak resolve ke apa-apa, `background`/`color` yang pakai `var(--...)` jatuh ke browser default, dan warna teks jatuh ke warna `body` global site (`#1c2e1c` — gelap banget di atas background gelap, makanya kelihatan "redup"/nyaris invisible). **Fix:** pindahkan seluruh markup `.sticky-player` ke dalam `.album-page` (posisi DOM aman dipindah karena `position:fixed` gak terpengaruh nesting, selama gak ada ancestor dengan `transform`/`filter`/`will-change` yang bikin containing block baru — `.album-page` di file ini gak punya itu).

**Catatan untuk halaman video (`mv-music/[slug].astro`):** modal video di situ JUGA sibling di luar `.album-page` (setelah `<Footer />`), tapi TIDAK kena bug ini karena CSS-nya sengaja pakai rgba/hex hardcode langsung (bukan `var(--lime-400)` dkk) — cek dulu pola itu kalau mau nambah elemen baru di luar `.album-page` manapun: **kalau taruh elemen visual apapun di luar `.album-page`, jangan pakai `var(--...)` dari situ — pindahkan ke dalam `.album-page`, atau hardcode nilai hex-nya langsung.**

### Interaksi & Audio Element
- **1 elemen `<audio id="audio-el" preload="none">` untuk seluruh album** — bukan 1 audio per track. Ganti lagu = ganti `audio.src`, bukan bikin elemen baru.
- `loadTrack(index, autoplay)` — fungsi sentral: update `audio.src`, teks sticky player, reset progress ke 0, toggle `.is-playing` di baris yang benar, dan `audio.play()` kalau `autoplay=true`. Dipanggil dari: klik baris manapun, tombol prev/next sticky player, auto-lanjut pas `ended`.
- **State "playing" satu-satunya sumber kebenaran: event `play`/`pause` dari elemen `<audio>` itu sendiri** (bukan variable JS terpisah) — `setPlayingUI()` di-panggil dari `audio.addEventListener('play'/'pause', ...)`, jadi disc, tombol hero "Putar Album", dan tombol sticky player **otomatis selalu sinkron (3 kontrol, 1 sumber state)** tanpa perlu manual update tiap tempat setiap ada aksi.
- **Progress bar draggable** — `mousedown` di `.sp-bar` set `isDragging=true` + langsung update posisi, `mousemove` di `document` (bukan di bar-nya doang, supaya drag tetap kepantau walau kursor keluar dari area bar) update terus selama `isDragging`, `mouseup` di `document` matiin flag. Saat `isDragging=true`, listener `timeupdate` di-skip (supaya gak "ketarik balik" oleh posisi asli audio saat user lagi drag).
- Lagu auto-lanjut ke berikutnya pas `ended` (lewat `loadTrack(currentIndex+1, true)`) — bukan permintaan eksplisit di spek, tapi perilaku wajar player album, low-risk.

### Panel Lirik ("Aa" → bottom sheet)
Klik tombol "Aa" di baris manapun buka **panel lirik bottom-sheet** (`#lyric-overlay` > `#lyric-panel`) — **bukan** modal kotak di tengah, sengaja slide dari bawah (`transform: translateY(100%) → translateY(0)`, `transition: 0.38s cubic-bezier(.22,1,.36,1)` — easing ini WAJIB dipakai, bukan `ease-in-out` biasa, biar berasa "premium" bukan snap kaku). Markup-nya ada di dalam `.album-page` (alasan sama dengan sticky player: butuh inherit `var(--lime-400)` dkk).

**Struktur:** handle bar dekoratif (`.lyric-handle`, 36×4px) → header (judul lagu Fraunces 19px + label `"Lirik · {judul album}"` JetBrains Mono, tombol close bulat 32px `✕`) → body scrollable (`max-height: 46vh`, scrollbar disembunyikan tapi tetap bisa discroll), tanpa footer. Mobile (`≤768px`): panel full-width, `max-height` body naik ke `55vh`, `padding-bottom` pakai `env(safe-area-inset-bottom)`.

**Tutup panel:** klik tombol `✕`, ATAU klik area overlay di luar panel (`e.target === lyricOverlay` check) — **tidak** ada Escape key. Panel terbuka/tertutup **tidak** pause/play audio — disc & audio tetap jalan di background.

**⚠️ Bukan panel lirik sinkron/karaoke — teks statis saja, tanpa highlight baris aktif.** Awalnya diimplementasi dengan highlight baris aktif (ganti font ke Fraunces italic + auto-`scrollIntoView`) yang disinkronkan ke `audio.currentTime`, TAPI **dihapus lagi atas permintaan user (2026-07-17)** setelah dicoba di device asli: highlight-nya "gak ngikutin" nyanyian beneran, karena data waktunya cuma ESTIMASI (durasi lagu dibagi rata per baris, bukan timing asli hasil sinkronisasi manual/file `.lrc`) — user bilang kalau susah dibuat akurat, mending tampilan teks polos aja. **Kalau nanti ada data timing asli** dan mau coba lagi fitur highlight-nya: ganti `lyricsByTrack` dari `Record<string, string[]>` balik ke array of `{time, text}` per baris, lalu di script tambahkan lagi listener `timeupdate`/`play`/`seeked` yang bandingkan `audio.currentTime` vs `line.time` buat nentuin baris aktif (pola ini sempat diimplementasi dan terbukti jalan secara teknis — CSS transition & `scrollIntoView` bekerja normal — masalahnya murni di akurasi datanya, bukan di mekanisme kodenya).

**Sumber data lirik** — `src/data/lyrics/{album-slug}.ts` (satu file per album, export `lyricsByTrack: Record<judulTrack, string[]>` — array baris teks polos), didaftarkan ke `src/data/lyrics/index.ts` (`getAlbumLyrics(albumSlug)`) supaya halaman cukup panggil satu fungsi tanpa tahu file mana yang harus di-import. Halaman serialize lirik tiap track ke `data-lyrics={JSON.stringify(...)}` di `.track-row` (JSON di-parse lagi di client saat tombol "Aa" diklik).

**Lirik yang sudah ada:** 10 dari 19 track (`Terlihat Seberkas Cahaya`, `Aroma Teh`, `Bahasa Bunga`, `Kembali Alami`, `Panggilan Kehidupan`, `Sang Pembersih`, `Kemuliaan Hidup`, `Hati Bertaut Hati`, `Ladang Ceria`, `Kasih Ada di Dalam Hati`, `Bahagia Itu Indah`) — dari file lirik resmi user di `Kembali Terhubung dengan alam/LIRIK/*.pdf`. Versi bahasa Indonesia yang dipakai adalah baris **bold** di tiap PDF (lirik yang dinyanyikan/disesuaikan, bukan terjemahan literal baris-per-baris dari bahasa Mandarin yang juga ada di file itu). Track lain (`Kafe Ceria`, `Tembang Dataran Tinggi`, `Kekuatan Hidup`, `Hargai Setiap Detik Kehidupan`, `Semerbak Kebahagiaan`, `Cahaya Dalam Hati`, `Benih Kebahagiaan`, `Bahagia Seketika`) belum ada file lirik dari user — `trackLyrics[track.title]` bernilai `undefined` untuk itu, `data-lyrics` jadi `[]`, dan panel menampilkan `.lyric-empty` ("Lirik belum tersedia untuk lagu ini.") kalau tombol "Aa" track itu diklik.

**Cara mencocokkan file PDF ke track:** cocokkan berdasarkan JUDUL LAGU (bold text di halaman pertama PDF), **bukan** nomor di nama file — nomor katalog di nama file (`04. Kasih Sang Bunda.pdf`) dan nomor yang tertulis DI DALAM isi PDF itu sendiri kadang beda (contoh nyata: file "01. Terlihat Seberkas Cahaya" isinya tertulis "04. 看見光的方向" — nomor asli dari katalog sumber, bukan urutan di album ini), jadi nomor sama sekali tidak bisa dipakai sebagai kunci pencocokan. 4 file lirik yang ada (`04. Kasih Sang Bunda`, `11. Kembali Sejati`, `15. Kian Gembira`, `19. Dapur Bahagia`) **sengaja tidak dipakai** karena judulnya tidak cocok dengan track manapun di 19 track album ini — kemungkinan besar itu lagu dari kaset/koleksi lain di catalog sumber yang sama, bukan bagian dari album ini. `Kemuliaan Hidup` (track mp3) dipasangkan ke file "20. Muliakan Hidup (光辉生命).pdf" meski judul Indonesia beda tipis (kata kerja vs kata benda) — dikonfirmasi ke user karena judul Mandarin-nya identik persis (光辉生命), dan user mengonfirmasi itu lagu yang sama.

**Bug/masukan user (2026-07-17) — panel kelihatan "terlalu transparan, gak nampak":** meski background aslinya sudah `rgba(...,0.97)`/`rgba(...,0.99)` (nyaris opaque sesuai spek awal), warnanya (dark green) terlalu mirip sama background halaman (`var(--green-950)`) yang juga dark green, jadi kerasa "menyatu"/transparan secara visual walau teknisnya udah nyaris solid. **Fix (masih berlaku):** background panel solid hex penuh tanpa alpha sama sekali (`linear-gradient(180deg, #1c3d26 0%, #0d2116 100%)`), border dipertegas (`rgba(244,241,230,0.22)` + tambahan `box-shadow` glow tipis lime), dan overlay backdrop digelapkan (`rgba(4,10,7,0.72)`) biar kontras panel-vs-backdrop lebih jelas. Teks baris lirik juga dinaikkan ke `color: var(--cream); opacity: 0.88` (dari sebelumnya `cream-dim` + `opacity:0.42` yang sengaja didimkan untuk kontras sama baris aktif — karena baris aktif udah gak ada, teks sekarang perlu kontras penuh biar gampang dibaca).

### ⚠️ Keterbatasan Verifikasi — Audio Playback Gak Bisa Ditest di Sesi Ini
Saat development (2026-07-17), `<audio>` element **sama sekali tidak bisa playback** di sesi browser-automation yang dipakai testing — `readyState` macet di 0 selamanya walau `networkState` bilang lagi "loading", bahkan untuk **file mp3 eksternal dari CDN lain** (bukan cuma file lokal project ini). Ini dikonfirmasi bukan bug kode:
- `fetch()` biasa ke file yang sama berhasil instant (9MB dalam 33ms, localhost)
- Dev server mendukung HTTP Range request dengan benar (`206 Partial Content`, header `Accept-Ranges` lengkap)
- File eksternal (`soundhelix.com`) juga gagal identik — bukan masalah file/server project ini
- Coba pakai Blob URL (`URL.createObjectURL`) malah bikin tab freeze/timeout total

Yang **berhasil** diverifikasi (gak butuh audio beneran nyala): render hero/disc/tracklist/sticky player, klik baris → equalizer pindah + sticky player update teks + `.is-playing` sinkron, math drag progress bar (klik 50% → `fill`/`handle` jadi ~50%), link dari grid `/mv-music` ke halaman ini. **Belum diverifikasi visual:** apakah audio betulan bunyi + progress bar jalan real-time saat playback asli, dan layout mobile (tool resize viewport di sesi ini juga gak berhasil ubah `window.innerWidth` walau window OS-nya keliatan resize). User perlu coba sendiri di browser biasa buat konfirmasi dua hal ini.

### Yang TIDAK ditambahkan (sesuai batasan eksplisit user)
- Tidak ada shuffle, repeat, atau volume slider
- Tidak ada warna/font di luar token yang sama dengan halaman video
- Tidak ada Escape key buat tutup panel lirik (cuma tombol `✕` atau klik overlay, sesuai spek)
- Panel lirik belum draggable-to-close (handle bar baru dekoratif, sesuai spek "untuk sekarang cukup visual")

---

## Komponen Navbar (`src/components/Navbar.astro`)

- Nav items: Home `/`, About Us `/about`, Kegiatan `/activities`, Bergabung `/karir`
- `activePage` prop menentukan item aktif
- Hamburger toggle via `.nav-hamburger` + `.nav-drawer` — **tidak ada Bootstrap collapse**
- Tidak ada `data-bs-toggle`

### Tombol mobile — "Menu" / "Tutup" (2026-08-13, redesain dari icon hamburger 3-garis)

Sebelumnya di mode HP (`≤768px`), `.nav-actions` berisi 3 elemen: tombol hijau "Bergabung" (`.nav-cta`) + tombol bulat icon hamburger 3-garis (`.nav-hamburger`) di sebelahnya. Atas permintaan eksplisit user, ini disederhanakan jadi **1 tombol pill teks** yang menggantikan fungsi keduanya:

- **`.nav-cta` (Bergabung) disembunyikan total di mobile** (`display:none` di breakpoint `≤768px`) — link "Bergabung" TETAP ada, cuma dipindah jadi item terakhir di dalam `.nav-drawer` (drawer-nya sendiri gak berubah, lihat bagian di bawah).
- **`.nav-hamburger` diubah dari icon 3-garis jadi pill teks hijau** — markup-nya sekarang 2 `<span>` (`.nav-hamburger-label-open` isinya teks "Menu", `.nav-hamburger-label-close` isinya teks "Tutup"), di-toggle visibility via CSS (`.nav-hamburger.open .nav-hamburger-label-open{display:none}` dst) — jadi teks tombolnya otomatis ganti "Menu" ⇄ "Tutup" sesuai state buka/tutup drawer, TANPA logic JS tambahan (JS toggle `.open` class-nya udah ada dari sebelumnya, cuma CSS yang baru).
- **Style tombolnya di-samain persis dengan `.nav-cta`** — termasuk animasi cincin cahaya berputar (`::before` conic-gradient + `@keyframes navCtaSpin` 3.5s infinite, `::after` lapisan solid hijau `linear-gradient(160deg, #97dd97, #6fc06f)` inset 1.5px), atas permintaan user "tambahin style seperti menu bergabung". Klik `.nav-hamburger` **fungsinya TIDAK berubah** — tetap toggle `.nav-drawer` yang sama seperti sebelumnya (lihat `Layout.astro`, listener `.nav-hamburger` click), cuma tampilannya yang berubah total dari icon ke pill teks hijau ber-glow.
- Breakpoint mobile: `.nav-hamburger { display:flex; padding:9px 18px; font-size:12.5px; }` (ukuran disamakan sama `.nav-cta` mobile).

**⚠️ Kalau nanti mau ubah lagi salah satu dari dua tombol ini (Bergabung / Menu), inget mereka sekarang saling terkait secara visual (sama-sama pakai teknik glow-ring `navCtaSpin`) — perubahan warna/animasi di satu tombol sebaiknya dicek juga dampaknya ke tombol satunya biar tetap konsisten.**

### Hamburger drawer (mobile) — Apple-style floating glass card

**Desain:** floating card 270px dari pojok kanan atas, **bukan** full-width panel. Dibuka lewat tombol "Menu" (lihat di atas) — bukan lagi icon hamburger.

| Property | Nilai |
|---|---|
| Background | `rgba(18,32,18,0.86)` + `backdrop-filter: blur(40px) saturate(180%)` |
| Border | `0.5px solid rgba(255,255,255,0.14)` + green glow `0 0 0 0.5px rgba(126,200,126,0.12)` |
| Border radius | `18px` |
| Entrance animation | `scale(0.88) → scale(1)` + `opacity 0→1`, `transform-origin: top right` |
| Easing | `cubic-bezier(0.34,1.4,0.64,1)` (spring) |
| Posisi | `top: 68px; right: 16px;` (480px: `top:62px; right:12px; width:250px`) |

**Link items:** `padding: 12px 16px`, `border-radius: 12px`, divider antar item via `::before` (0.5px). Semua item — termasuk "Bergabung" (sekarang jadi satu-satunya tempat link Bergabung muncul di mobile) — menggunakan style yang sama, tidak ada tombol hijau khusus di dalam drawer.

**Hamburger button saat terbuka:** teks berubah jadi "Tutup" (lihat di atas), warna isian `::after`-nya ikut naik sedikit terang (`linear-gradient(160deg, #aef0ae, #7ec87e)`, sama seperti state hover/`.active` tombol Bergabung).

---

## CSS Architecture (`src/styles/global.css`)

Satu file untuk semua CSS Astro. Tidak ada Tailwind utility classes.

### Pola kelas penting:
| Kelas | Kegunaan |
|---|---|
| `.hero-slides` / `.hero-slide` / `.hero-slide.active` | Slideshow hero home |
| `.hero-glass-card` | Frosted glass wrapper teks hero |
| `.cards` | Horizontal scroll container highlight kegiatan (`display:flex; overflow-x:auto; scroll-snap-type:x mandatory`) |
| `.card` | Item highlight (`flex: 0 0 260px; scroll-snap-align:start`) |
| `.cards-see-all` / `.cards-see-all-btn` | Tombol bulat "→" di akhir scroll kegiatan |
| `.input-error` | Border merah field form invalid |
| `.error-msg` | Pesan error validasi form |
| `.filter-fab` / `.filter-panel` / `.filter-item` | Pola FAB — tombol bulat mengambang pojok kanan-bawah + panel yang cuma muncul setelah bar aslinya (`.filter-bar` di activities, `.page-nav` di about) discroll lewat. `.filter-panel` dapat efek cincin cahaya hijau berputar (`::before`/`::after` + `navCtaSpin`, sama teknik dengan `.nav-cta`). Dipakai di `activities/index.astro` (filter kategori) dan `about.astro` (page-nav) — lihat bagian masing-masing halaman. |
| `.section-card` | Container rounded besar (`border-radius:28px`, border + shadow lembut) buat bungkus blok konten — pola dari redesain About Us terinspirasi wealthclub.id, lihat bagian "Halaman About". |
| `.nav-cta` / `.nav-hamburger` | Tombol pill dengan cincin cahaya hijau berputar (`navCtaSpin`) — `.nav-cta` = Bergabung, `.nav-hamburger` = tombol "Menu"/"Tutup" mobile (sama style, lihat "Komponen Navbar"). |

### Animasi:
- `@keyframes kenburns` — zoom perlahan hero slide (`scale 1→1.06`)
- `@keyframes fadeIn` — fade in umum
- `[data-reveal]` + `IntersectionObserver` — scroll reveal (bukan AOS)
- `@keyframes navCtaSpin` — conic-gradient raksasa (220%) diputar 3.5s linear infinite di belakang tombol pill (`.nav-cta`, `.nav-hamburger`, `.filter-panel`) buat efek cincin cahaya berputar di border-nya. Pola: `::before` = conic-gradient yang spin, `::after` = lapisan solid isi (inset 1.5px) yang nyisain cuma garis tipis dari `::before` sebagai cincin cahaya. Elemen pemakai wajib `position:relative; isolation:isolate; overflow:hidden;` supaya conic-gradient raksasa ke-clip rapi ke bentuk rounded-nya.

**⚠️ Blok CSS `[data-reveal]`/`.revealed`/`[data-reveal-delay]` WAJIB tetap di paling atas `global.css`** (tepat setelah blok `body{}`, sebelum semua style komponen) — **jangan pindah ke bawah lagi.** Alasan: banyak kartu (`.card`, `.act-card`, `.tl-card`, `.pillar`, dll) punya `:hover { transform: translateY(...) }` sendiri. Selector `.foo:hover` dan `[data-reveal].revealed` sama-sama specificity (0,2,0) — kalau seri, CSS menang berdasarkan urutan sumber, BUKAN spesifisitas. Kalau blok reveal ada DI BAWAH (setelah) rule hover komponen, `[data-reveal].revealed { transform: translateY(0); }` diam-diam MENIMPA transform hover begitu elemen sudah revealed — hover jadi kelihatan "mati" (box-shadow tetap jalan, tapi efek naik/lift hilang). Taruh di atas supaya rule hover komponen (yang datang belakangan) selalu menang di cascade.

---

## Gambar — Astro Pages (`src/assets/images/`)

Semua gambar ini diproses Astro → WebP otomatis. Gunakan `<Image src={import} />`.

| File | Digunakan di |
|---|---|
| `logo.png` | Navbar (opsional) — **sudah tidak dipakai di index.astro/about.astro** sejak fitur Instagram dihapus permanen (2026-08-13, lihat bagian "Halaman Home") |
| `Landingpage(main).png` | Hero home slide 1, OG default Layout |
| `Landinpage (Event).jpg` | Hero home slide 2 |
| `children-sunset.jpg` | **Sudah tidak dipakai** sejak section sosmed dihapus (2026-08-13) — dibiarkan untuk referensi masa depan |
| `dance-bali.jpg` | ContentGrid "Penampilan" |
| `dance-kimono.jpg` | ContentGrid "MV & Music", OG image mv-music.astro (default, tiap album/video sekarang OG pakai thumbnail YouTube masing-masing) |
| `festival-stage.jpg` | ContentGrid "Kegiatan & Acara" |
| `hero-mountain.jpg` | OG image about.astro, ContentGrid "Artikel" |
| `wheat-field.jpg` | **Sudah tidak dipakai** sejak section sosmed dihapus (2026-08-13) — dibiarkan untuk referensi masa depan |

> Album grid di mv-music.astro **tidak lagi pakai gambar lokal ini** — cover-nya sekarang thumbnail asli playlist YouTube (lihat bagian "Halaman MV & Music").

## Gambar — Legacy & Kegiatan (`public/SRC/`)

Gambar ini dipakai langsung via path `/SRC/...` (tidak diproses Astro):

| File | Digunakan di |
|---|---|
| `logo-inla-sumut.png` | Legacy pages, navbar legacy |
| `silhouette-group-of-happy-children-...SBI-300996172.jpg` | Kartu IGTS |
| `p06.jpg` | Kartu IGT |
| `bg5.jpg` | Kartu MVOH |
| `bg2.jpg` | Kartu Pagelaran |
| `bg3.jpg` | Kartu Program Komunitas |
| `boy-running-through-wheat-field-...SBI-350099286.jpg` | Kartu Kegiatan Alam |
| `bg2.jpg`, `bg3.jpg`, `p02.jpg`, `p03.jpg` | Gallery Pagelaran |
| `About.jpg` | Legacy About Us hero |
| `hongkong.jpg` | Foto kolom kanan section Sejarah di about.astro (gradient mask fade) |
| `p01–p06.jpg` | Gallery activities legacy |
| `WhatsApp Image 2026-03-25 at 13.53.59.jpeg` | Gallery (ada spasi — selalu quote path) |
| `realistic-earth-closeup-render-SBI-301825525.jpg` | (tidak lagi dipakai album mv-music — sudah pakai thumbnail YouTube, file dibiarkan untuk referensi masa depan) |
| `a-tree-in-a-field-with-stunning-space-backdrop-SBI-301081197.jpg` | (tidak lagi dipakai album mv-music — sudah pakai thumbnail YouTube, file dibiarkan untuk referensi masa depan) |

---

## Legacy Pages (`public/Page/`)

`about.html` dan `activities.html` masih ada sebagai fallback. Path relatif dengan `../` prefix (dari `public/Page/`):
- `../style.css`, `../CSS/animations.css`, `../JS/main.js`
- `../SRC/image.jpg`

**Tidak aktif dikembangkan** — pengembangan baru dilakukan di stack Astro.

Libraries legacy (CDN):
- Bootstrap 5.3.8
- GSAP + ScrollTrigger 3.12.5
- AOS 2.3.4
- Typed.js 2.1.0

---

## Hal yang TIDAK BOLEH Dilakukan

- ❌ Tambah warna gold/amber tanpa konfirmasi klien
- ❌ Gunakan `_globalSetupDone` flag di JS
- ❌ Gunakan `DOMContentLoaded` atau `astro:after-swap` — gunakan `astro:page-load`
- ❌ Toggle modal/lightbox dengan class `.open` — gunakan `element.style.display = 'flex'/'none'` (khusus lightbox & video-modal *global* di `Layout.astro`; modal video di `mv-music.astro` sengaja dikecualikan dari aturan ini — lihat bagian "Halaman MV & Music")
- ❌ Install library eksternal baru (GSAP, Framer Motion, dll) tanpa konfirmasi
- ❌ Ubah z-index tombol modal/lightbox di bawah 10001
- ❌ Gunakan `ViewTransitions` — sudah diganti `ClientRouter` dari `astro:transitions`
- ❌ Tambah tombol CTA ke halaman detail di dalam section konten home (navigasi ke detail hanya via navbar dan footer)
- ❌ Pindah blok CSS `[data-reveal]`/`.revealed` di `global.css` ke bawah (keluar dari posisi awal file) — akan diam-diam mematikan efek hover `translateY` di semua kartu yang sudah revealed (lihat bagian "Animasi" di atas)
