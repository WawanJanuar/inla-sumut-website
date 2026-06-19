# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Static 3-page website for INLA SUMUT (International Nature Loving Association — Sumatera Utara). No build tools, no package manager — everything runs by opening HTML files in a browser.

**To preview:** Open `index.html` directly in a browser, or use a local server:
```bash
cd "/Users/wawanjanuar/Documents/INLA SUMUT/Project Web INLA"
python3 -m http.server 8080
# then open http://localhost:8080
```

## File Structure

```
index.html          — Dashboard (root, main page)
style.css           — Shared styles for all 3 pages
CSS/animations.css  — Keyframes, loader, marquee, back-to-top, cursor glow
JS/main.js          — All JavaScript (shared across pages)
Page/about.html     — About Us page
Page/activities.html — Activities page
SRC/                — All images (logos, photos, backgrounds)
```

## Path Conventions

Pages in `Page/` use relative paths with `../` prefix:
- `../style.css`, `../CSS/animations.css`, `../JS/main.js`
- `../SRC/image.jpg` for images

`index.html` (root) uses `./` prefix:
- `./SRC/image.jpg`, `./CSS/animations.css`

## Libraries (CDN only, no local install)

| Library | Version | Purpose |
|---|---|---|
| Bootstrap | 5.3.8 | Grid, navbar, collapse |
| GSAP + ScrollTrigger | 3.12.5 | Hero entrance animation, parallax |
| Typed.js | 2.1.0 | Cycling text in hero (Dashboard only) |
| AOS | 2.3.4 | Scroll-triggered fade/zoom animations |

## JavaScript Patterns

**Feature detection before init** — JS checks for element existence before running page-specific code:
- GSAP hero timeline only runs when `.hero-badge` exists (Dashboard only)
- GSAP banner animation only runs when `.banner-title` exists (sub-pages only)
- Typed.js only runs when `#typed-text` exists

**Counter animation** — uses `data-target` and `data-suffix` attributes on `.counter-number` elements. IntersectionObserver triggers ease-out cubic count-up on first scroll into view.

**Lightbox** — any element with `[data-lightbox]`, `data-src`, and `data-caption` attributes becomes a gallery trigger. The `#lightbox` overlay must be present in the HTML. Keyboard: Esc closes, ←/→ navigates.

**Gallery filter** — `.filter-btn[data-filter]` buttons toggle `.filterable[data-category]` items. `data-filter="all"` shows everything.

**Page transitions** — all internal `<a href>` clicks add `.page-leaving` to `body` and wait 380ms before navigating. Excluded: `#hash`, `http://`, `mailto:`, `tel:`.

## CSS Architecture

**Two background classes:**
- `.main-content` — marble texture for `index.html` (uses `./SRC/...`)
- `.main-content-sub` — marble texture for `Page/*.html` (uses `../SRC/...`)
- `page-white` / inline `background:#ffffff` — pure white, used on `about.html` and `activities.html`

**Navbar behavior:** `.custom-navbar` transitions from transparent → `.scrolled` (dark glass) at `window.scrollY > 80`.

**Responsive breakpoints** (all 4 files use the same 5 tiers):
- `≤1199px` large tablet/small laptop
- `≤991px` tablet
- `≤767px` large phone / small tablet
- `≤575px` mobile
- `≤390px` very small phones (iPhone SE)

**Dark theme remnants** — `.dark-page` and its child overrides (`.dark-page .dark-cta-box`, etc.) exist in `style.css` but are no longer used by any page. Do not add `class="dark-page"` to any `<main>` — backgrounds are now white.

## Image Assignments

| Image file | Used in |
|---|---|
| `Discover awal.jpg` | Dashboard hero background |
| `About.jpg` | About Us hero background |
| `a-tree-in-a-field-with-stunning-space-backdrop-SBI-301081197.jpg` | Activities hero background |
| `light-soft-white-marble-texture-SBI-303742593.jpg` | Page background texture (`.main-content`, `.main-content-sub`) |
| `logo inla sumut.png` | Navbar brand, loader, footer |
| `hongkong.jpg` | About page origin full-width strip |
| `realistic-earth-closeup-render-SBI-301825525.jpg` | About page global reach section |
| `collage-of-half-faces-...SBI-349501584.jpg` | About page intro image |
| `silhouette-group-of-happy-children-...SBI-300996172.jpg` | About community gallery, Activities card |
| `boy-running-through-wheat-field-...SBI-350099286.jpg` | About community gallery, Activities card |
| `p01–p06.jpg`, `bg2.jpg`, `bg3.jpg`, `bg5.jpg` | Activity gallery grid |
| `WhatsApp Image 2026-03-25 at 13.53.59.jpeg` | Activities gallery (has spaces in filename — quote paths) |

## Page-Specific Inline Styles

`about.html` and `activities.html` each have an inline `<style>` block in `<head>` for components unique to that page (flip cards, portrait strip, CTA box, etc.). Responsive `@media` rules for those components live in the same inline block, not in `style.css`.
