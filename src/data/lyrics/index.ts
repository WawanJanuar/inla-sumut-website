// Registry lirik per album audio — satu file per slug album di folder ini
// (lihat kembali-terhubung-dengan-alam.ts), didaftarkan di sini supaya halaman
// mv-music/audio/[slug].astro cukup panggil getAlbumLyrics(album.slug) tanpa
// tahu file mana yang harus di-import.

import { lyricsByTrack as kembaliTerhubungDenganAlam } from './kembali-terhubung-dengan-alam';

const registry: Record<string, Record<string, string[]>> = {
  'kembali-terhubung-dengan-alam': kembaliTerhubungDenganAlam,
};

export function getAlbumLyrics(albumSlug: string): Record<string, string[]> {
  return registry[albumSlug] ?? {};
}
