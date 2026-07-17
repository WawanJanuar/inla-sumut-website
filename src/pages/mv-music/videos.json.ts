import type { APIRoute } from 'astro';
import { getChannelVideosNotInPlaylists } from '../../utils/youtube';

// Static JSON (di-generate sekali saat build) berisi SEMUA video "di luar playlist" —
// dipakai search di mv-music.astro supaya HTML halaman itu sendiri cukup render 20
// kartu pertama saja, bukan 341-an sekaligus (lihat CLAUDE.md bagian "Video — YouTube
// Data API" untuk alasan lengkapnya).
export const GET: APIRoute = async () => {
  const videos = await getChannelVideosNotInPlaylists('inlasumut');

  const payload = videos.map((v) => ({
    id: v.id,
    title: v.title,
    thumbnail: v.thumbnail,
    author: v.author,
    aspectRatio: v.aspectRatio,
  }));

  return new Response(JSON.stringify(payload), {
    headers: { 'Content-Type': 'application/json' },
  });
};
