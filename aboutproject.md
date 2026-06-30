# INLA SUMUT — Dokumentasi Project Lengkap

> Dibuat untuk keperluan analisis lanjutan bersama Claude / ChatGPT mengenai arah pengembangan website INLA SUMUT.
> Tanggal dokumentasi: 2026-06-24

---

## 1. Ringkasan Project

**INLA SUMUT** (International Nature Loving Association — Sumatera Utara) adalah website statis **3 halaman** untuk organisasi nirlaba yang menyebarkan nilai cinta alam, harmoni, dan moral melalui seni budaya.

- **Tipe**: Static site, **tanpa build tool, tanpa package manager** (no npm/webpack/vite).
- **Cara jalan**: Buka file `.html` langsung di browser, atau pakai local server (`python3 -m http.server 8080`).
- **Bahasa konten**: Bahasa Indonesia (`lang="id"`), beberapa istilah Inggris dipakai sebagai judul/badge.
- **Status saat ini**: 2 commit di git — "Initial commit: 3-page static site" dan "Add optimized source images". Belum ada CI/CD, belum ada backend, belum ada CMS.

---

## 2. Struktur File

```
Project Web INLA/
├── index.html              ← Dashboard (halaman utama)
├── style.css                ← Shared styles (1362 baris) — dipakai di SEMUA halaman
├── CLAUDE.md                 ← Dokumentasi panduan untuk AI assistant
├── CSS/
│   └── animations.css       ← Keyframes, loader, marquee, back-to-top, cursor glow (329 baris)
├── JS/
│   └── main.js               ← SATU file JS untuk SEMUA halaman (307 baris)
├── Page/
│   ├── about.html            ← Halaman About Us (728 baris, termasuk inline <style>)
│   └── activities.html       ← Halaman Activities (669 baris, termasuk inline <style>)
└── SRC/                       ← Semua aset gambar (~4.9 MB total)
    ├── .DS_Store
    ├── About.jpg                                                    (400K)
    ├── Discover awal.jpg                                            (736K)  ← terbesar
    ├── WhatsApp Image 2026-03-25 at 13.53.59.jpeg                    (184K) ⚠️ nama file ada spasi
    ├── a-tree-in-a-field-with-stunning-space-backdrop-SBI-301081197.jpg (440K)
    ├── bg2.jpg / bg3.jpg / bg5.jpg                                   (140K/140K/108K)
    ├── boy-running-through-wheat-field...SBI-350099286.jpg           (448K)
    ├── collage-of-half-faces...SBI-349501584.jpg                     (448K)
    ├── flowers watercolor wallpaper backgrounds...                    ⚠️ tidak terpakai di HTML manapun
    ├── hongkong.jpg                                                  (272K)
    ├── light-soft-white-marble-texture-SBI-303742593.jpg             (188K)
    ├── logo inla sumut.png                                          (300K)
    ├── p01.jpg / p02.jpg / p03.jpg / p05.jpg / p06.jpg               (48K–128K)
    ├── realistic-earth-closeup-render-SBI-301825525.jpg              (508K)
    └── silhouette-group-of-happy-children...SBI-300996172.jpg        (304K)
```

**Catatan ukuran**: Total aset gambar ~4.9 MB, tidak ada satupun yang format WebP/AVIF, tidak ada `srcset`/responsive image, dan tidak ada lazy-loading kecuali `loading="lazy"` native HTML (sudah dipakai konsisten).

---

## 3. Path Convention

| Lokasi file | Prefix path |
|---|---|
| `index.html` (root) | `./SRC/...`, `./CSS/...`, `./JS/...` |
| `Page/about.html`, `Page/activities.html` | `../SRC/...`, `../CSS/...`, `../JS/...` |

Navigasi antar halaman:
- Dari root → `./Page/about.html`, `./Page/activities.html`
- Dari `Page/` → `../index.html` (balik ke root), `./about.html`, `./activities.html` (antar sesama subpage)

---

## 4. Teknologi & Library (semua via CDN, tidak ada instalasi lokal)

| Library | Versi | CDN Source | Fungsi |
|---|---|---|---|
| **Bootstrap** | 5.3.8 | jsdelivr | Grid system, navbar collapse, utility classes |
| **GSAP** | 3.12.5 | cdnjs | Animasi hero entrance, parallax background |
| **ScrollTrigger** (plugin GSAP) | 3.12.5 | cdnjs | Trigger animasi berbasis scroll position |
| **Typed.js** | 2.1.0 | jsdelivr | Animasi teks mengetik bergilir (hanya di Dashboard) |
| **AOS** (Animate On Scroll) | 2.3.4 | unpkg | Fade/zoom-in saat elemen masuk viewport |

Tidak ada framework JS (React/Vue/dll), tidak ada TypeScript, tidak ada bundler. Semua logic JS murni vanilla, terkonsentrasi di satu file `JS/main.js` dengan pattern **feature detection** (`if (document.querySelector(...))`) sebelum menjalankan kode spesifik halaman.

---

## 5. Arsitektur CSS

### 5.1 File Global
- **`style.css`** (1362 baris) — semua style bersama: navbar, hero, button, footer, section umum, grid, dll. Dipakai oleh ketiga halaman.
- **`CSS/animations.css`** (329 baris) — keyframes animasi: loader, marquee scroll, back-to-top button, cursor glow, particle floating, dll.

### 5.2 Inline `<style>` per Halaman
- `about.html` punya blok `<style>` sendiri di `<head>` (baris 14–328) untuk komponen unik: hero banner dengan overlay gradient, flip card (`.fc-wrap`/`.fc-inner` 3D rotate), stat pills, vision block, country badge grid, community gallery grid.
- `activities.html` punya blok `<style>` sendiri (baris 17–167) untuk: filter button gallery, activity card, light CTA box.
- Pola ini **disengaja** — komponen page-specific tidak masuk ke `style.css` global.

### 5.3 Dua Kelas Background Utama
- `.main-content` — tekstur marble untuk `index.html` (pakai `./SRC/...`)
- `.main-content-sub` — tekstur marble untuk halaman di `Page/` (pakai `../SRC/...`) — **namun saat ini `about.html` dan `activities.html` memakai `page-white`/`background:#ffffff` murni, bukan tekstur marble**
- `.dark-page` — **kelas mati/tidak terpakai**, sisa dari desain lama (dark theme). Jangan dipakai lagi di `<main>`.

### 5.4 Breakpoint Responsif (konsisten di semua file)
| Breakpoint | Target device |
|---|---|
| ≤1199px | Laptop kecil / tablet besar |
| ≤991px | Tablet |
| ≤767px | Phone besar / tablet kecil |
| ≤575px | Mobile |
| ≤390px | Phone sangat kecil (iPhone SE) |

---

## 6. Halaman: Dashboard (`index.html`)

**Tujuan**: Landing page utama, ringkasan organisasi + entry point ke 2 halaman lain.

### Struktur Section (top → bottom)
1. **Scroll progress bar** — bar tipis di top viewport, lebar = persentase scroll.
2. **Loader overlay** — logo + bar loading, hilang otomatis 1100ms setelah DOM ready (`JS/main.js` baris 7-11). Tidak menunggu aset benar-benar load, hanya timer fixed.
3. **Cursor glow** — efek glow mengikuti cursor mouse (desktop only, dicek via `matchMedia('(pointer: fine)')`).
4. **Back-to-top button** — muncul setelah scroll > 500px.
5. **Lightbox overlay** — modal galeri foto (dipakai di section Activity Preview).
6. **Navbar** — transparan → gelap (`.scrolled`) saat `scrollY > 80`. Active link diset otomatis berdasarkan `window.location.pathname` (JS, bukan hardcode HTML, kecuali Dashboard yang manual `active`).
7. **Hero Section** (`#home`)
   - Floating particles (12 elemen `<span>` dekoratif)
   - Badge "Organisasi Nirlaba Global"
   - Judul besar "INLA SUMUT" + subtitle **Typed.js** (4 string looping bahasa Inggris/Indonesia)
   - Deskripsi singkat
   - 2 CTA button: "Explore Activities" → activities.html, "Learn More" → about.html
   - Scroll indicator (mouse icon animasi)
   - **GSAP timeline** entrance animation (badge → title → subtitle → desc → buttons → scroll indicator), delay 1.0s
   - **GSAP ScrollTrigger** parallax pada background hero
8. **Marquee banner** — teks berjalan infinite loop (7 frasa, di-duplikasi 2x untuk seamless loop), pause on hover.
9. **Stats Section** — 4 counter angka (Negara: 10+, Tahun: 18+, Anggota: 1000+, Program: 50+). Animasi count-up dipicu **IntersectionObserver** saat elemen masuk viewport (ease-out cubic, durasi 2000ms). AOS fade-up dengan delay staggered.
10. **Main content** (class `.main-content` — tekstur marble):
    - **Intro Section** (`#intro`) — teks "Siapa Kami" + gambar bumi + badge tahun 2006, CTA "Selengkapnya" → about.html
    - **About Preview Section** (`#about`) — 2 card: "Origin of The Founding" (gambar Hong Kong) & "Missions and Tasks" (gambar anak-anak), CTA → about.html
    - **Activity Preview Section** (`#activity`) — galeri foto grid (6 foto: p06, bg5, p02, p05, bg2, bg3) dengan **lightbox** trigger, CTA → activities.html
11. **Footer** — logo, brand, nav link, 4 social icon (WhatsApp/Instagram/YouTube/Facebook — **href masih `#`, belum diisi link asli**), copyright 2026.

### Teknologi Spesifik Dashboard
- **Typed.js** hanya aktif di sini (cek `#typed-text` exists)
- **GSAP hero timeline** hanya aktif di sini (cek `.hero-badge` exists)
- **Counter animation** + **lightbox** dipakai (shared logic dengan activities.html)

---

## 7. Halaman: About Us (`Page/about.html`)

**Tujuan**: Profil organisasi — sejarah, misi/visi, nilai, jangkauan global, galeri komunitas.

### Struktur Section
1. Loader, cursor glow, back-to-top, navbar — sama seperti Dashboard (tanpa lightbox/scroll-progress di file ini — **catatan: tidak ada `#lightbox` overlay maupun scroll-progress div di about.html**, jadi fitur lightbox/scroll-progress JS akan idle/no-op di halaman ini).
2. **Hero Banner** (`.about-hero-section`) — background image `About.jpg` dengan gradient overlay + efek zoom-in saat load (`.loaded` class ditambahkan via inline `<script>` di akhir file saat `window.load`). Particle dekoratif. CTA: "Pelajari Kami ↓" (scroll ke `#tentang`) & "Lihat Kegiatan" → activities.html.
3. **Marquee** — 7 frasa berbeda dari Dashboard (lebih fokus ke identitas: Cinta Alam, Love & Harmony, dll — sama persis sebenarnya dengan Dashboard).
4. **Main content** (`page-white` — background putih solid, BUKAN tekstur marble):
   - **Section "Tentang"** (`#tentang`) — 2 kolom: teks profil INLA + 3 stat pill (2006/10+/1000+) + gambar collage wajah. CTA → activities.html.
   - **Origin Strip** — full-width image strip (hongkong.jpg) dengan overlay teks "Lahir dari Kota Hong Kong, 2006" + angka besar dekoratif "2006" di kanan (disembunyikan di tablet/mobile).
   - **Section "Misi & Visi"** (`#misi`) — 3 mission card (🌿 Cinta Alam, 🎭 Seni & Budaya, 🤝 Harmoni Global) + vision block (blockquote quote besar).
   - **Section Nilai-Nilai** — 4 **flip card 3D** (CSS `rotateY(180deg)` on hover): Alam 🌍, Manusia ❤️, Seni 🎨, Harmoni ☮️. **Hover-only — tidak ada fallback untuk touch device**, jadi di mobile konten "back" flip card tidak bisa diakses secara native (perlu dicek UX-nya).
   - **Section Jangkauan Global** — gambar bumi + grid 11 badge negara (Hong Kong, Taipei, Indonesia, Malaysia, USA, Kanada, Filipina, Australia, Singapura, Korea Selatan, Nepal) dengan emoji bendera.
   - **Section Galeri Komunitas** — 3 gambar grid (zoom on hover), CTA → activities.html.
5. Footer — identik dengan Dashboard.

### CSS Khusus (inline, tidak di style.css global)
`.about-hero-section`, `.intro-two-col`, `.stat-pill`, `.full-img-strip`/`.origin-strip`, `.m-card` (mission card), `.vision-block`, `.fc-wrap`/`.fc-inner`/`.fc-front`/`.fc-back` (flip card), `.country-grid`/`.c-badge`, `.com-gallery` (community gallery).

### Catatan Teknis
- Tidak memuat Typed.js (tidak perlu, tidak ada `#typed-text`)
- GSAP banner animation aktif (cek `.banner-title` exists) — animasi tag/title/subtitle/buttons dengan delay berurutan (0.3s–0.85s)
- **Tidak ada lightbox di halaman ini** meskipun ada galeri foto (community gallery TIDAK clickable/zoomable, beda dengan Dashboard & Activities)

---

## 8. Halaman: Activities (`Page/activities.html`)

**Tujuan**: Dokumentasi kegiatan — galeri foto, program unggulan, timeline sejarah, CTA bergabung.

### Struktur Section
1. Loader, cursor glow, back-to-top, **scroll progress**, **lightbox overlay** — SEMUA fitur ada di sini (lebih lengkap dari about.html).
2. **Hero Banner** (`.hero-banner`) — background `a-tree-in-a-field...SBI-301081197.jpg`. CTA: "Lihat Galeri ↓" (scroll ke `#gallery`) & "Tentang Kami" → about.html.
3. **Marquee** — 7 frasa berbeda lagi, fokus tema kegiatan (Kegiatan Alam, Seni Pertunjukan, Pendidikan Moral, Komunitas, Lingkungan Hidup, Budaya & Tradisi, Kesehatan).
4. **Main content** (background putih solid via inline style):
   - **Gallery Section** (`#gallery`) — **fitur filter kategori** (`.filter-btn[data-filter]`): Semua / 🌿 Alam / 🎭 Seni & Budaya / 👥 Komunitas. 9 foto grid dengan atribut `data-category` (alam/seni/komunitas), semua punya `data-lightbox` + `data-caption` untuk modal viewer. Filter via JS toggle `display:none` + animasi `fadeInUp`.
   - **Activity Cards Section** — 6 card program unggulan (masing-masing: gambar, tag kategori, judul, deskripsi, jadwal):
     1. 🌿 Program Pelestarian Alam — Rutin Bulanan
     2. 🎭 Festival Seni & Budaya — Tahunan
     3. 📚 Pendidikan Moral Anak — Setiap Minggu
     4. 👥 Pemberdayaan Komunitas — Dua Kali Sebulan
     5. 🏃 Kesehatan Holistik — Mingguan
     6. 🌍 Pertukaran Budaya Global — Tahunan
   - **Timeline Section** — 7 milestone histori zig-zag kiri-kanan (`.timeline-item` / `.timeline-item.right`):
     2006 (Hong Kong, lahirnya INLA) → 2010 (Indonesia) → 2015 (INLA SUMUT berdiri) → 2019 (Program Alam) → 2022 (Festival Budaya pertama) → 2024 (Ekspansi) → **2026 — Sekarang** (dot berpulsasi/`animation: pulseDot`, menandakan "current state").
   - **CTA Section** — `light-cta-box` dengan 2 button: "Kenali Kami" → about.html, "Kembali ke Dashboard" → index.html (style inline dengan `onmouseover`/`onmouseout` — **bukan via CSS class**, ini satu-satunya tempat di codebase yang pakai inline JS event handler langsung di HTML).
5. Footer — identik.

### CSS Khusus (inline)
`.filter-wrap`/`.filter-btn`, `.activity-card`/`.activity-card-img`/`.activity-card-tag`/`.activity-card-meta`, `.light-cta-box`.

### Data Galeri vs Kategori (untuk referensi filter)
| File | Kategori |
|---|---|
| p06.jpg | alam (featured/besar) |
| bg5.jpg | komunitas |
| p01.jpg | seni |
| p02.jpg | komunitas |
| p03.jpg | seni |
| bg3.jpg | alam |
| p05.jpg | komunitas |
| bg2.jpg | alam |
| WhatsApp Image...jpeg | seni |

---

## 9. JavaScript — Detail Fungsi (`JS/main.js`, 307 baris, semua dalam satu `DOMContentLoaded` listener)

| Fungsi | Trigger/Cek | Berlaku di halaman |
|---|---|---|
| Loader hide | `setTimeout` 1100ms fixed | Semua (jika ada `#loaderOverlay`) |
| Scroll progress bar | `scroll` event, hitung % dari `scrollHeight` | Dashboard, Activities (tidak ada di About) |
| Navbar scroll state + active link | `scrollY > 80` → `.scrolled`; deteksi `pathname` untuk active nav | Semua |
| Back to top | `scrollY > 500` → visible; smooth scroll on click | Semua |
| AOS init | duration 800, easing ease-out-cubic, once:true, offset:70 | Semua |
| Typed.js init | cek `#typed-text` | **Hanya Dashboard** |
| GSAP hero timeline + parallax | cek `.hero-badge` | **Hanya Dashboard** |
| GSAP banner entrance | cek `.banner-title` | About, Activities |
| Counter animation | `IntersectionObserver`, threshold 0.5, ease-out cubic 2000ms | **Hanya Dashboard** (stats section) |
| Lightbox (open/close/navigate, keyboard ←→/Esc) | cek `#lightbox` | Dashboard, Activities (tidak ada di About) |
| Page transition | semua `<a href>` internal → `.page-leaving` + delay 380ms sebelum navigasi. Exclude: `#hash`, `http://`, `mailto:`, `tel:` | Semua |
| Cursor glow | `matchMedia('(pointer: fine)')` — desktop only | Semua |
| Gallery filter | cek `.filter-btn` + `.filterable` | **Hanya Activities** |
| Smooth scroll hash link | semua `a[href^="#"]` | Semua |
| Marquee pause on hover | cek `.marquee-track` | Semua |
| Animated underline on scroll | `IntersectionObserver` threshold 0.6, `.animated-underline` | Dashboard (`.section-title.animated-underline` di Intro section) |

---

## 10. Observasi Teknis & Potensi Area Pengembangan

Bagian ini murni observasi struktural untuk bahan diskusi lanjutan — bukan rekomendasi final.

1. **Tidak ada build process** — semua CDN, semua manual edit. Plus: simple, zero-dependency-install. Minus: tidak ada minifikasi, tree-shaking, atau bundling — tiap halaman load 5 library CDN penuh + 2 file CSS + 1 file JS.
2. **Ukuran gambar besar & tidak optimal** — `Discover awal.jpg` 736KB, beberapa file >400KB. Tidak ada WebP/AVIF, tidak ada `srcset` responsif. Total aset ~4.9MB untuk situs 3 halaman.
3. **File gambar tak terpakai** — `flowers watercolor wallpaper backgrounds...` tidak direferensikan di HTML manapun (cross-check via grep).
4. **Social media link placeholder** — semua href footer (WhatsApp/Instagram/YouTube/Facebook) masih `#`, belum diisi URL asli, di ketiga halaman.
5. **Inkonsistensi fitur antar halaman**:
   - `about.html` tidak punya `#lightbox` overlay & `#scrollProgress` div meski JS-nya generic-check (tidak error, hanya silently skip).
   - `about.html` punya galeri komunitas yang TIDAK clickable, padahal galeri serupa di Dashboard & Activities punya lightbox.
6. **Flip card hover-only** (about.html nilai-nilai section) — tidak ada interaksi tap/click fallback untuk mobile/touch, sehingga konten "back" card mungkin tidak terjangkau di perangkat sentuh murni.
7. **Class CSS mati** — `.dark-page` dan child override-nya di `style.css` sudah tidak dipakai (sisa desain lama, sesuai catatan di CLAUDE.md).
8. **Inline style besar-besaran** — banyak elemen pakai `style="..."` inline langsung di HTML (terutama heading di about.html & activities.html) daripada class CSS terpusat — memperbesar duplikasi & mempersulit maintenance konsisten.
9. **Satu-satunya inline JS event handler** — CTA button "Kembali ke Dashboard" di activities.html pakai `onmouseover`/`onmouseout` inline, bukan CSS `:hover` atau JS terpusat (inkonsisten dengan pendekatan lain di codebase).
10. **Tidak ada backend/CMS** — semua teks/statistik (jumlah negara, tahun, anggota) hardcoded di HTML. Update konten = edit HTML manual.
11. **Tidak ada SEO lanjutan** — hanya `<meta name="description">` dasar per halaman, tidak ada Open Graph tags, tidak ada sitemap.xml/robots.txt, tidak ada structured data (JSON-LD).
12. **Tidak ada analytics** — tidak ditemukan Google Analytics/Meta Pixel/dll di ketiga file.
13. **Aksesibilitas sebagian sudah baik** (aria-label di navbar/svg icon, alt text di gambar) tapi flip card hover-only (poin 6) jadi pengecualian.
14. **Tidak ada `.gitignore`** maupun dokumentasi deployment (belum diketahui platform hosting target — Netlify/Vercel/shared hosting/dll).

---

## 11. Ringkasan Cepat (TL;DR untuk AI lain)

- 3 halaman statis HTML+CSS+JS vanilla, CDN-only (Bootstrap, GSAP, Typed.js, AOS), tanpa build tool.
- `style.css` + `CSS/animations.css` global, `JS/main.js` satu file dengan feature-detection pattern.
- Dashboard = hero+stats+preview 3 section; About = profil+misi/visi+flip card+jangkauan global; Activities = galeri+filter+card program+timeline.
- ~4.9MB aset gambar belum dioptimasi, beberapa fitur (lightbox/scroll-progress) tidak konsisten dipasang di About.html, social link placeholder, tidak ada backend/CMS/analytics/SEO lanjutan.
