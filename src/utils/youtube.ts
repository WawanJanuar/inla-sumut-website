const API_BASE = 'https://www.googleapis.com/youtube/v3';

export interface ChannelVideo {
  id: string;
  title: string;
  thumbnail: string;
  author: string;
  publishedAt: string;
  aspectRatio: number; // width / height video asli (dari oEmbed) — dipakai resize modal untuk video vertikal/4:3
}

let cache: ChannelVideo[] | null = null;

function apiKey(): string {
  const key = import.meta.env.YOUTUBE_API_KEY as string | undefined;
  if (!key) {
    throw new Error('YOUTUBE_API_KEY tidak ditemukan. Tambahkan ke file .env di root project.');
  }
  return key;
}

async function fetchJson(url: string): Promise<any> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`YouTube API error ${res.status}: ${await res.text()}`);
  }
  return res.json();
}

async function getChannelUploadsInfo(handle: string, key: string): Promise<{ channelId: string; uploadsPlaylistId: string }> {
  const data = await fetchJson(
    `${API_BASE}/channels?part=id,contentDetails&forHandle=${handle}&key=${key}`
  );
  const item = data.items?.[0];
  if (!item) throw new Error(`Channel @${handle} tidak ditemukan.`);
  return {
    channelId: item.id,
    uploadsPlaylistId: item.contentDetails.relatedPlaylists.uploads,
  };
}

interface PlaylistMeta {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  videoCount: number;
}

async function getAllPlaylistsMeta(channelId: string, key: string): Promise<PlaylistMeta[]> {
  const items: PlaylistMeta[] = [];
  let pageToken = '';
  do {
    const data = await fetchJson(
      `${API_BASE}/playlists?part=snippet,contentDetails&channelId=${channelId}&maxResults=50&key=${key}${pageToken ? `&pageToken=${pageToken}` : ''}`
    );
    for (const it of data.items) {
      const thumb = it.snippet?.thumbnails?.high ?? it.snippet?.thumbnails?.medium ?? it.snippet?.thumbnails?.default;
      items.push({
        id: it.id,
        title: it.snippet.title,
        description: it.snippet.description ?? '',
        thumbnail: thumb?.url ?? '',
        videoCount: it.contentDetails?.itemCount ?? 0,
      });
    }
    pageToken = data.nextPageToken ?? '';
  } while (pageToken);
  return items;
}

async function getPlaylistVideoIds(playlistId: string, key: string): Promise<string[]> {
  const ids: string[] = [];
  let pageToken = '';
  do {
    const data = await fetchJson(
      `${API_BASE}/playlistItems?part=contentDetails&playlistId=${playlistId}&maxResults=50&key=${key}${pageToken ? `&pageToken=${pageToken}` : ''}`
    );
    ids.push(...data.items.map((it: any) => it.contentDetails.videoId));
    pageToken = data.nextPageToken ?? '';
  } while (pageToken);
  return ids;
}

async function getAllUploads(uploadsPlaylistId: string, key: string): Promise<Omit<ChannelVideo, 'aspectRatio'>[]> {
  const videos: Omit<ChannelVideo, 'aspectRatio'>[] = [];
  let pageToken = '';
  do {
    const data = await fetchJson(
      `${API_BASE}/playlistItems?part=snippet,contentDetails&playlistId=${uploadsPlaylistId}&maxResults=50&key=${key}${pageToken ? `&pageToken=${pageToken}` : ''}`
    );
    for (const it of data.items) {
      const snippet = it.snippet;
      const thumb = snippet?.thumbnails?.high ?? snippet?.thumbnails?.medium ?? snippet?.thumbnails?.default;
      if (!thumb) continue; // video dihapus/private, tidak punya thumbnail
      videos.push({
        id: it.contentDetails.videoId,
        title: snippet.title,
        thumbnail: thumb.url,
        author: snippet.channelTitle,
        publishedAt: it.contentDetails.videoPublishedAt ?? snippet.publishedAt,
      });
    }
    pageToken = data.nextPageToken ?? '';
  } while (pageToken);
  return videos;
}

/**
 * Aspect ratio video asli (bukan thumbnail — thumbnail YouTube selalu dipotong 4:3/16:9
 * apapun bentuk videonya). oEmbed lewat URL bentuk `/watch` atau `youtu.be` juga cuma
 * mengembalikan dua preset (16:9 atau 4:3), tidak pernah portrait — tapi lewat URL
 * `/shorts/{id}` YouTube mengembalikan width/height asli video (termasuk video vertikal
 * beneran, w < h). Aman dipanggil untuk video non-Shorts juga (tetap balik 16:9/4:3 normal).
 */
async function getOembedAspectRatio(id: string): Promise<number> {
  try {
    const res = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/shorts/${id}&format=json`);
    if (!res.ok) return 16 / 9;
    const data = await res.json();
    return data.width && data.height ? data.width / data.height : 16 / 9;
  } catch {
    return 16 / 9;
  }
}

async function mapWithConcurrency<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;
  async function worker() {
    while (cursor < items.length) {
      const i = cursor++;
      results[i] = await fn(items[i]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

/**
 * Video milik channel yang tidak masuk playlist manapun, terurut dari yang terbaru.
 * Hasil di-cache in-memory karena butuh banyak request (paginasi upload + tiap playlist).
 */
export async function getChannelVideosNotInPlaylists(handle: string): Promise<ChannelVideo[]> {
  if (cache) return cache;

  const key = apiKey();
  const { channelId, uploadsPlaylistId } = await getChannelUploadsInfo(handle, key);
  const playlists = await getAllPlaylistsMeta(channelId, key);
  const playlistVideoIdLists = await Promise.all(playlists.map((p) => getPlaylistVideoIds(p.id, key)));
  const idsInPlaylists = new Set(playlistVideoIdLists.flat());

  const uploads = await getAllUploads(uploadsPlaylistId, key);
  const filtered = uploads
    .filter((v) => !idsInPlaylists.has(v.id))
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  const aspectRatios = await mapWithConcurrency(filtered, 20, (v) => getOembedAspectRatio(v.id));
  const result = filtered.map((v, i) => ({ ...v, aspectRatio: aspectRatios[i] }));

  cache = result;
  return result;
}

// ============================================================
// ALBUM (PLAYLIST) — halaman detail /mv-music/[slug]
// ============================================================

export interface PlaylistVideo {
  id: string;
  title: string;
  thumbnail: string;
  publishedAt: string;
  durationSeconds: number;
  durationLabel: string;
  aspectRatio: number;
  viewCount?: number;
  embeddable: boolean; // false = pemilik video matikan "Playback on other websites" di YouTube Studio
}

export interface PlaylistAlbum {
  id: string;
  slug: string;
  title: string;
  description: string;
  thumbnail: string;
  videoCount: number;
  totalDurationSeconds: number;
  totalDurationLabel: string;
  videos: PlaylistVideo[];
}

function parseISODuration(iso: string): number {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return 0;
  const h = parseInt(m[1] ?? '0', 10);
  const min = parseInt(m[2] ?? '0', 10);
  const s = parseInt(m[3] ?? '0', 10);
  return h * 3600 + min * 60 + s;
}

function formatDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function formatTotalDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.round((totalSeconds % 3600) / 60);
  if (h > 0) return `${h} jam ${m} menit`;
  return `${m} menit`;
}

const COMBINING_DIACRITICS = /[̀-ͯ]/g;

function slugify(title: string): string {
  return (
    title
      .toLowerCase()
      .normalize('NFKD')
      .replace(COMBINING_DIACRITICS, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'album'
  );
}

async function getPlaylistItemsBasic(playlistId: string, key: string): Promise<Omit<PlaylistVideo, 'durationSeconds' | 'durationLabel' | 'aspectRatio' | 'viewCount'>[]> {
  const items: Omit<PlaylistVideo, 'durationSeconds' | 'durationLabel' | 'aspectRatio' | 'viewCount'>[] = [];
  let pageToken = '';
  do {
    const data = await fetchJson(
      `${API_BASE}/playlistItems?part=snippet,contentDetails&playlistId=${playlistId}&maxResults=50&key=${key}${pageToken ? `&pageToken=${pageToken}` : ''}`
    );
    for (const it of data.items) {
      const snippet = it.snippet;
      const thumb = snippet?.thumbnails?.high ?? snippet?.thumbnails?.medium ?? snippet?.thumbnails?.default;
      if (!thumb || !it.contentDetails?.videoId) continue; // video dihapus/private
      items.push({
        id: it.contentDetails.videoId,
        title: snippet.title,
        thumbnail: thumb.url,
        publishedAt: it.contentDetails.videoPublishedAt ?? snippet.publishedAt,
      });
    }
    pageToken = data.nextPageToken ?? '';
  } while (pageToken);
  return items;
}

async function getVideosDetails(ids: string[], key: string): Promise<Map<string, { durationSeconds: number; viewCount: number; embeddable: boolean }>> {
  const map = new Map<string, { durationSeconds: number; viewCount: number; embeddable: boolean }>();
  for (let i = 0; i < ids.length; i += 50) {
    const batch = ids.slice(i, i + 50);
    const data = await fetchJson(`${API_BASE}/videos?part=contentDetails,statistics,status&id=${batch.join(',')}&key=${key}`);
    for (const it of data.items) {
      map.set(it.id, {
        durationSeconds: parseISODuration(it.contentDetails.duration),
        viewCount: parseInt(it.statistics?.viewCount ?? '0', 10),
        embeddable: it.status?.embeddable !== false,
      });
    }
  }
  return map;
}

let albumsCache: PlaylistAlbum[] | null = null;

/**
 * Semua playlist channel sebagai "album", lengkap dengan daftar video
 * (durasi asli, view count, aspect ratio). Dipakai grid album di mv-music.astro
 * DAN halaman detail mv-music/[slug].astro — supaya cuma fetch sekali per build.
 */
export async function getChannelAlbums(handle: string): Promise<PlaylistAlbum[]> {
  if (albumsCache) return albumsCache;

  const key = apiKey();
  const { channelId } = await getChannelUploadsInfo(handle, key);
  const playlists = await getAllPlaylistsMeta(channelId, key);

  const resolved = await Promise.all(
    playlists.map(async (meta): Promise<PlaylistAlbum | null> => {
      const items = await getPlaylistItemsBasic(meta.id, key);
      if (items.length === 0) return null;

      const [details, aspectRatios] = await Promise.all([
        getVideosDetails(items.map((i) => i.id), key),
        mapWithConcurrency(items, 20, (i) => getOembedAspectRatio(i.id)),
      ]);

      const videos: PlaylistVideo[] = items.map((item, i) => {
        const d = details.get(item.id);
        const durationSeconds = d?.durationSeconds ?? 0;
        return {
          ...item,
          durationSeconds,
          durationLabel: formatDuration(durationSeconds),
          aspectRatio: aspectRatios[i],
          viewCount: d?.viewCount,
          embeddable: d?.embeddable ?? true,
        };
      });

      const totalDurationSeconds = videos.reduce((sum, v) => sum + v.durationSeconds, 0);

      return {
        id: meta.id,
        slug: slugify(meta.title),
        title: meta.title,
        description: meta.description,
        thumbnail: meta.thumbnail || videos[0]?.thumbnail || '',
        videoCount: videos.length,
        totalDurationSeconds,
        totalDurationLabel: formatTotalDuration(totalDurationSeconds),
        videos,
      };
    })
  );

  const albums = resolved.filter((a): a is PlaylistAlbum => a !== null);

  // Dedupe slug kalau ada judul playlist yang sama (misal beda bahasa)
  const usedSlugs = new Set<string>();
  for (const album of albums) {
    if (usedSlugs.has(album.slug)) {
      album.slug = `${album.slug}-${album.id.slice(-6).toLowerCase()}`;
    }
    usedSlugs.add(album.slug);
  }

  albumsCache = albums;
  return albums;
}
