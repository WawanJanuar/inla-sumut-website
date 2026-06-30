export interface Activity {
  slug: string;
  title: string;
  tag: string;
  description: string;
  image: string;
  href: string;
  publishedAt: string; // ISO date — urutkan berdasarkan ini (terbaru tampil duluan)
}

export const activities: Activity[] = [
  {
    slug: 'igts',
    title: 'INLA Goes To School',
    tag: 'Pendidikan',
    description: 'Program inspirasi ke sekolah-sekolah untuk membangun karakter dan kepedulian lingkungan.',
    image: '/SRC/silhouette-group-of-happy-children-playing-on-meadow-sunset-summertime-SBI-300996172.jpg',
    href: '/activities/igts',
    publishedAt: '2026-06-20',
  },
  {
    slug: 'komunitas',
    title: 'Program Komunitas',
    tag: 'Komunitas',
    description: 'Kegiatan sosial dan budaya yang mempererat hubungan antar anggota lintas bangsa.',
    image: '/SRC/bg3.jpg',
    href: '/activities',
    publishedAt: '2025-11-18',
  },
  {
    slug: 'pagelaran',
    title: 'Pagelaran SKS',
    tag: 'Pagelaran',
    description: 'Pertunjukan seni dan budaya berskala internasional — puncak perayaan INLA setiap tahunnya.',
    image: '/SRC/bg2.jpg',
    href: '/activities/pagelaran',
    publishedAt: '2025-06-01',
  },
  {
    slug: 'kegiatan-alam',
    title: 'Kegiatan Alam',
    tag: 'Alam',
    description: 'Eksplorasi alam terbuka bersama anggota INLA dari berbagai kota dan negara.',
    image: '/SRC/boy-running-through-wheat-field-on-sunset-SBI-350099286.jpg',
    href: '/activities',
    publishedAt: '2023-09-07',
  },
  {
    slug: 'mvoh',
    title: 'Musical Voice of Harmony',
    tag: 'Konser',
    description: 'Konser vokal dan musik yang merayakan keharmonisan antara manusia dan alam semesta.',
    image: '/SRC/bg5.jpg',
    href: '/activities/mvoh',
    publishedAt: '2024-12-14',
  },
  {
    slug: 'igt',
    title: 'INLA Got Talent',
    tag: 'Kompetisi',
    description: 'Kompetisi bakat terbuka untuk vokal, tari, dan pertunjukan seni dari berbagai kota.',
    image: '/SRC/p06.jpg',
    href: '/activities/igt',
    publishedAt: '2024-07-22',
  },
];

export function getHighlights(limit = 6): Activity[] {
  return [...activities]
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, limit);
}
