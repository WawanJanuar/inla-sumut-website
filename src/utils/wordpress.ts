export interface Article {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  contentHtml: string;
  featuredImage: string | null;
  publishedAt: string;
  author: string;
  categories: string[];
}

let cache: Article[] | null = null;

// Beda dengan YOUTUBE_API_KEY (yang throw keras kalau kosong, karena section video
// gak punya fallback yang masuk akal) — WORDPRESS_API_URL sengaja TIDAK throw kalau
// kosong. Alasan: WordPress-nya baru mau di-setup, belum live. Kalau throw, build
// production langsung rusak total begitu kode ini di-push, padahal halaman /artikel
// sendiri MEMANG sudah didesain untuk nampilin state "belum ada artikel" secara wajar.
// Jadi "WORDPRESS_API_URL belum di-set" diperlakukan sama seperti "belum ada artikel".
function apiBase(): string | null {
  const url = import.meta.env.WORDPRESS_API_URL as string | undefined;
  if (!url) return null;
  return url.replace(/\/$/, '');
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&#8217;/g, '’')
    .replace(/&#8216;/g, '‘')
    .replace(/&#8220;/g, '“')
    .replace(/&#8221;/g, '”')
    .replace(/&#8211;/g, '–')
    .replace(/&#8212;/g, '—')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#0?39;/g, "'")
    .replace(/&quot;/g, '"');
}

function stripTags(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}

function mapWpPostToArticle(post: any): Article {
  const media = post._embedded?.['wp:featuredmedia']?.[0];
  const authorObj = post._embedded?.author?.[0];
  const terms: any[] = post._embedded?.['wp:term']?.flat() ?? [];
  const categories = terms.filter((t) => t.taxonomy === 'category').map((t) => t.name);

  return {
    id: post.id,
    slug: post.slug,
    title: decodeHtmlEntities(post.title?.rendered ?? ''),
    excerpt: stripTags(decodeHtmlEntities(post.excerpt?.rendered ?? '')).trim(),
    contentHtml: post.content?.rendered ?? '',
    featuredImage: media && !media.code ? (media.source_url ?? null) : null,
    publishedAt: post.date_gmt ?? post.date,
    author: authorObj && !authorObj.code ? (authorObj.name ?? 'INLA SUMUT') : 'INLA SUMUT',
    categories,
  };
}

/**
 * Semua artikel published, di-cache in-memory per build. Pakai `_embed=1` supaya
 * featured image (wp:featuredmedia), author, dan kategori/tag (wp:term) ikut dalam
 * satu request — hindari N+1 request per artikel ke endpoint media/author terpisah.
 *
 * Paginasi pakai `page`/`per_page` (bukan pageToken seperti YouTube) — WordPress
 * REST API balas HTTP 400 (rest_post_invalid_page_number) begitu `page` melewati
 * halaman terakhir, jadi itu dipakai sebagai sinyal berhenti.
 */
export async function getAllArticles(): Promise<Article[]> {
  if (cache) return cache;

  const base = apiBase();
  if (!base) {
    cache = [];
    return cache;
  }

  const articles: Article[] = [];
  let page = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const res = await fetch(`${base}/posts?per_page=100&page=${page}&_embed=1`);
    if (res.status === 400) break;
    if (!res.ok) throw new Error(`WordPress API error ${res.status}: ${await res.text()}`);
    const batch = await res.json();
    if (!Array.isArray(batch) || batch.length === 0) break;
    articles.push(...batch.map(mapWpPostToArticle));
    page++;
  }

  cache = articles.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  return cache;
}
