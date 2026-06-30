# CLAUDE.md

Panduan untuk Claude Code saat bekerja di repo ini. File ini adalah **sumber kebenaran** — selalu baca ini sebelum membuat perubahan.

---

## Gambaran Proyek

Website **INLA SUMUT** (International Nature Loving Association — Sumatera Utara). Seluruh halaman kini dibangun dengan **Astro 7**, termasuk halaman detail kegiatan, About, dan Bergabung. Legacy static HTML (`public/Page/`) masih ada tapi hanya sebagai fallback — pengembangan aktif dilakukan di stack Astro.

> `aboutproject.md` (repo root) adalah snapshot dokumentasi lama sebelum migrasi Astro. Sudah **kadaluarsa** — gunakan file ini sebagai referensi.

---

## Cara Menjalankan

```bash
cd "/Users/wawanjanuar/Documents/INLA SUMUT/Project Web INLA"
npm install        # pertama kali saja
npm run dev        # dev server dengan HMR (hot reload)
npm run build      # output ke dist/
npm run preview    # serve dist/ secara lokal
```

Deploy: output ada di `dist/` (gitignored). Jalankan `npm run build` sebelum deploy.

---

## Struktur File

```
package.json, astro.config.mjs, tsconfig.json
src/
  pages/
    index.astro                  — Home (route: /)
    about.astro                  — About Us (route: /about)
    karir.astro                  — Bergabung / Join (route: /karir)
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
    Hero.astro                   — (legacy, tidak aktif digunakan)
    AboutGlimpse.astro           — (legacy, tidak aktif digunakan)
    ActivitiesGlimpse.astro      — (legacy, tidak aktif digunakan)
    ConnectBand.astro            — (legacy, tidak aktif digunakan)
  data/
    activities.ts                — Sumber data kegiatan (digunakan home + bisa dikembangkan)
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
| Scroll reveal | `[data-reveal]` + `IntersectionObserver`, delay via `data-reveal-delay` |
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

---

## Halaman Home (`src/pages/index.astro`)

### Sections (urutan dari atas):
1. **Hero** — 2-slide slideshow (fade 1.2s, interval 5s, Ken Burns `scale(1→1.06)`). Gambar: `Landingpage(main).png` + `Landinpage (Event).jpg`. Di atas slides ada frosted glass card (`hero-glass-card`: `backdrop-filter: blur(4px)`, `background: rgba(255,255,255,0.03)`).
2. **About** — Grid 2 kolom: teks + 4 pillar icon.
3. **Highlight Kegiatan** (`#aktivitas`) — Horizontal scroll 6 kartu. Data diambil dari `src/data/activities.ts`, di-sort by `publishedAt` terbaru. Di akhir scroll ada tombol bulat `→` link ke `/activities`.
4. **Konten Media Sosial** — Horizontal scroll 6 kartu Instagram. Logo INLA muncul saat hover via `<Image src={imgLogo}>`. Tombol bawah: "Follow" → Instagram.

### Navbar nav item: "Home" (bukan "Dashboard" — sudah direname semua)

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

**Lightbox GalleryGrid:** setiap item `data-gallery` harus punya nilai unik per halaman (`"igts"`, `"igt"`, `"mvoh"`, `"pagelaran"`). Lightbox dikelompokkan berdasarkan nilai ini.

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

Versi Astro dari About Us. Berisi:
- Hero section
- Konten tentang INLA
- Section **Recent** — horizontal scroll 6 kartu konten Instagram (sama seperti di home, menggunakan logo Astro `<Image>`)
- CTA bergabung

---

## Komponen Navbar (`src/components/Navbar.astro`)

- Nav items: Home `/`, About Us `/about`, Kegiatan `/activities`, Bergabung `/karir`
- `activePage` prop menentukan item aktif
- Hamburger toggle via `#navToggle` + `.nav-drawer` — **tidak ada Bootstrap collapse**
- Tidak ada `data-bs-toggle`

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
| `.sosmed-grid` | Horizontal scroll container kartu Instagram (`display:flex; overflow-x:auto`) |
| `.sosmed-card` | Item kartu Instagram (`flex: 0 0 240px`) |
| `.sosmed-overlay-logo` | Logo INLA di overlay hover kartu Instagram |
| `.input-error` | Border merah field form invalid |
| `.error-msg` | Pesan error validasi form |

### Animasi:
- `@keyframes kenburns` — zoom perlahan hero slide (`scale 1→1.06`)
- `@keyframes fadeIn` — fade in umum
- `[data-reveal]` + `IntersectionObserver` — scroll reveal (bukan AOS)

---

## Gambar — Astro Pages (`src/assets/images/`)

Semua gambar ini diproses Astro → WebP otomatis. Gunakan `<Image src={import} />`.

| File | Digunakan di |
|---|---|
| `logo.png` | Overlay kartu sosmed (home + about), navbar (opsional) |
| `Landingpage(main).png` | Hero home slide 1 |
| `Landinpage (Event).jpg` | Hero home slide 2 |
| `children-sunset.jpg` | Kartu sosmed home + about |
| `dance-bali.jpg` | Kartu sosmed |
| `dance-kimono.jpg` | Kartu sosmed |
| `festival-stage.jpg` | Kartu sosmed |
| `hero-mountain.jpg` | Kartu sosmed |
| `wheat-field.jpg` | Kartu sosmed |

## Gambar — Legacy & Kegiatan (`public/SRC/`)

Gambar ini dipakai langsung via path `/SRC/...` (tidak diproses Astro):

| File | Digunakan di |
|---|---|
| `logo inla sumut.png` | Legacy pages, navbar legacy |
| `silhouette-group-of-happy-children-...SBI-300996172.jpg` | Kartu IGTS |
| `p06.jpg` | Kartu IGT |
| `bg5.jpg` | Kartu MVOH |
| `bg2.jpg` | Kartu Pagelaran |
| `bg3.jpg` | Kartu Program Komunitas |
| `boy-running-through-wheat-field-...SBI-350099286.jpg` | Kartu Kegiatan Alam |
| `bg2.jpg`, `bg3.jpg`, `p02.jpg`, `p03.jpg` | Gallery Pagelaran |
| `About.jpg` | Legacy About Us hero |
| `hongkong.jpg` | Legacy About origin strip |
| `p01–p06.jpg` | Gallery activities legacy |
| `WhatsApp Image 2026-03-25 at 13.53.59.jpeg` | Gallery (ada spasi — selalu quote path) |

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
- ❌ Toggle modal/lightbox dengan class `.open` — gunakan `element.style.display = 'flex'/'none'`
- ❌ Install library eksternal baru (GSAP, Framer Motion, dll) tanpa konfirmasi
- ❌ Ubah z-index tombol modal/lightbox di bawah 10001
- ❌ Gunakan `ViewTransitions` — sudah diganti `ClientRouter` dari `astro:transitions`
- ❌ Tambah tombol CTA ke halaman detail di dalam section konten home (navigasi ke detail hanya via navbar dan footer)
