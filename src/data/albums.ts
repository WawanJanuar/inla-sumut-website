// Sumber data album "Full Audio" — penyimpanan sementara sebelum ada database.
// File mp3 asli ada di public/audio/{slug}/, url di bawah relatif ke situ (di-prefix
// BASE saat dipakai di halaman). Kalau nanti pindah ke Supabase Storage, cukup ganti
// nilai `url`/`thumbnail` di sini jadi URL storage — komponen halaman tidak perlu diubah.

export interface AudioTrack {
  title: string;
  language: string;
  durationSeconds: number;
  url: string; // path public, contoh: /audio/{slug}/01-judul.mp3
}

export interface AudioAlbum {
  slug: string;
  title: string;
  tagline: string;
  language: string;
  year: number | null; // null = belum ditentukan
  thumbnail: string; // path public
  tracks: AudioTrack[];
}

export const audioAlbums: AudioAlbum[] = [
  {
    slug: 'kembali-terhubung-dengan-alam',
    title: 'Kembali Terhubung dengan Alam',
    tagline: 'Temukan ketenangan, pulihkan energi, dan hidup selaras bersama alam.',
    language: 'Indonesia',
    year: null,
    thumbnail: '/audio/kembali-terhubung-dengan-alam/thumbnail.png',
    tracks: [
      { title: 'Terlihat Seberkas Cahaya', language: 'Indonesia', durationSeconds: 230, url: '/audio/kembali-terhubung-dengan-alam/01-terlihat-seberkas-cahaya.mp3' },
      { title: 'Aroma Teh', language: 'Indonesia', durationSeconds: 172, url: '/audio/kembali-terhubung-dengan-alam/02-aroma-teh.mp3' },
      { title: 'Bahasa Bunga', language: 'Indonesia', durationSeconds: 170, url: '/audio/kembali-terhubung-dengan-alam/03-bahasa-bunga.mp3' },
      { title: 'Kembali Alami', language: 'Indonesia', durationSeconds: 228, url: '/audio/kembali-terhubung-dengan-alam/05-kembali-alami.mp3' },
      { title: 'Panggilan Kehidupan', language: 'Indonesia', durationSeconds: 205, url: '/audio/kembali-terhubung-dengan-alam/06-panggilan-kehidupan.mp3' },
      { title: 'Sang Pembersih', language: 'Indonesia', durationSeconds: 220, url: '/audio/kembali-terhubung-dengan-alam/07-sang-pembersih.mp3' },
      { title: 'Kafe Ceria', language: 'Indonesia', durationSeconds: 253, url: '/audio/kembali-terhubung-dengan-alam/08-kafe-ceria.mp3' },
      { title: 'Kemuliaan Hidup', language: 'Indonesia', durationSeconds: 226, url: '/audio/kembali-terhubung-dengan-alam/09-kemuliaan-hidup.mp3' },
      { title: 'Hati Bertaut Hati', language: 'Indonesia', durationSeconds: 236, url: '/audio/kembali-terhubung-dengan-alam/12-hati-bertaut-hati.mp3' },
      { title: 'Tembang Dataran Tinggi', language: 'Indonesia', durationSeconds: 233, url: '/audio/kembali-terhubung-dengan-alam/13-tembang-dataran-tinggi.mp3' },
      { title: 'Kekuatan Hidup', language: 'Indonesia', durationSeconds: 208, url: '/audio/kembali-terhubung-dengan-alam/14-kekuatan-hidup.mp3' },
      { title: 'Hargai Setiap Detik Kehidupan', language: 'Indonesia', durationSeconds: 241, url: '/audio/kembali-terhubung-dengan-alam/17-hargai-setiap-detik-kehidupan.mp3' },
      { title: 'Semerbak Kebahagiaan', language: 'Indonesia', durationSeconds: 197, url: '/audio/kembali-terhubung-dengan-alam/18-semerbak-kebahagiaan.mp3' },
      { title: 'Cahaya Dalam Hati', language: 'Indonesia', durationSeconds: 276, url: '/audio/kembali-terhubung-dengan-alam/21-cahaya-dalam-hati.mp3' },
      { title: 'Benih Kebahagiaan', language: 'Indonesia', durationSeconds: 214, url: '/audio/kembali-terhubung-dengan-alam/22-benih-kebahagiaan.mp3' },
      { title: 'Ladang Ceria', language: 'Indonesia', durationSeconds: 197, url: '/audio/kembali-terhubung-dengan-alam/25-ladang-ceria.mp3' },
      { title: 'Kasih Ada di Dalam Hati', language: 'Indonesia', durationSeconds: 240, url: '/audio/kembali-terhubung-dengan-alam/26-kasih-ada-di-dalam-hati.mp3' },
      { title: 'Bahagia Itu Indah', language: 'Indonesia', durationSeconds: 166, url: '/audio/kembali-terhubung-dengan-alam/27-bahagia-itu-indah.mp3' },
      { title: 'Bahagia Seketika', language: 'Indonesia', durationSeconds: 200, url: '/audio/kembali-terhubung-dengan-alam/28-bahagia-seketika.mp3' },
    ],
  },
];

export function getAudioAlbumBySlug(slug: string): AudioAlbum | undefined {
  return audioAlbums.find((a) => a.slug === slug);
}

export function formatDuration(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = Math.round(totalSeconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function formatTotalDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.round((totalSeconds % 3600) / 60);
  if (h > 0) return `${h} jam ${m} menit`;
  return `${m} menit`;
}
