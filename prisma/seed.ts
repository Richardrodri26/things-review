import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

const SEED_ITEMS: Array<{
  contentType: string
  title: string
  coverImageUrl?: string
  backdropImageUrl?: string
  year?: number
  metadata?: Record<string, unknown>
}> = [
  // ── Movies ──────────────────────────────────────────────
  {
    contentType: 'movie',
    title: 'Inception',
    year: 2010,
    coverImageUrl: 'https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg',
    backdropImageUrl: 'https://image.tmdb.org/t/p/w1280/s3TBrRGB1iav7gFOCNx3H31MoES.jpg',
    metadata: { runtime: 148, originalLanguage: 'en' },
  },
  {
    contentType: 'movie',
    title: 'The Dark Knight',
    year: 2008,
    coverImageUrl: 'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
    backdropImageUrl: 'https://image.tmdb.org/t/p/w1280/hkBaDkMWbLaf8B1lsWsNprs3Dg.jpg',
    metadata: { runtime: 152, originalLanguage: 'en' },
  },
  {
    contentType: 'movie',
    title: 'Interstellar',
    year: 2014,
    coverImageUrl: 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
    backdropImageUrl: 'https://image.tmdb.org/t/p/w1280/xJHokMbljvjADYdit5fK5VQsXEG.jpg',
    metadata: { runtime: 169, originalLanguage: 'en' },
  },
  {
    contentType: 'movie',
    title: 'Pulp Fiction',
    year: 1994,
    coverImageUrl: 'https://image.tmdb.org/t/p/w500/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg',
    backdropImageUrl: 'https://image.tmdb.org/t/p/w1280/suaEOtk1N1sgg2MTM7oZd2cfVp3.jpg',
    metadata: { runtime: 154, originalLanguage: 'en' },
  },
  {
    contentType: 'movie',
    title: 'The Matrix',
    year: 1999,
    coverImageUrl: 'https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg',
    backdropImageUrl: 'https://image.tmdb.org/t/p/w1280/fFexlkjJxs29MzKJo9mY9RWLLVS.jpg',
    metadata: { runtime: 136, originalLanguage: 'en' },
  },
  {
    contentType: 'movie',
    title: 'Parasite',
    year: 2019,
    coverImageUrl: 'https://image.tmdb.org/t/p/w500/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg',
    backdropImageUrl: 'https://image.tmdb.org/t/p/w1280/TU9NIjwzjoKPwQHoHshkFcQUCG.jpg',
    metadata: { runtime: 132, originalLanguage: 'ko' },
  },
  {
    contentType: 'movie',
    title: 'Everything Everywhere All at Once',
    year: 2022,
    coverImageUrl: 'https://image.tmdb.org/t/p/w500/w3LxiVYdWWRvEVdn5RYq6jIqkb1.jpg',
    backdropImageUrl: 'https://image.tmdb.org/t/p/w1280/fFexlkjJxs29MzKJo9mY9RWLLVS.jpg',
    metadata: { runtime: 139, originalLanguage: 'en' },
  },
  {
    contentType: 'movie',
    title: 'Dune: Part One',
    year: 2021,
    coverImageUrl: 'https://image.tmdb.org/t/p/w500/d5NXSklpcvwE3HP2SmWeqwwVsW.jpg',
    backdropImageUrl: 'https://image.tmdb.org/t/p/w1280/jYEW5xZkZk2WTrdbMGAPFuBqbDc.jpg',
    metadata: { runtime: 155, originalLanguage: 'en' },
  },
  // ── Series ──────────────────────────────────────────────
  {
    contentType: 'series',
    title: 'Breaking Bad',
    year: 2008,
    coverImageUrl: 'https://image.tmdb.org/t/p/w500/ggFHVNu6YYI5L9pCfOacjizRGt.jpg',
    backdropImageUrl: 'https://image.tmdb.org/t/p/w1280/tsRy63Mu5cu8etL1X7ZLyf7UP1M.jpg',
    metadata: { numberOfSeasons: 5, numberOfEpisodes: 62, status: 'ended' },
  },
  {
    contentType: 'series',
    title: 'Succession',
    year: 2018,
    coverImageUrl: 'https://image.tmdb.org/t/p/w500/e2X8NpiN9sMoqnZKBNhS7bGFSBc.jpg',
    backdropImageUrl: 'https://image.tmdb.org/t/p/w1280/1Fh8jLGMiPRlsJVa9GEdnFMURZb.jpg',
    metadata: { numberOfSeasons: 4, numberOfEpisodes: 39, status: 'ended' },
  },
  {
    contentType: 'series',
    title: 'The Bear',
    year: 2022,
    coverImageUrl: 'https://image.tmdb.org/t/p/w500/sHFlbKS3WLqMnp9t2ghADIJFnuQ.jpg',
    backdropImageUrl: 'https://image.tmdb.org/t/p/w1280/xNi4KKMRR79LPnQS3PjBkqt9Fdt.jpg',
    metadata: { numberOfSeasons: 3, status: 'returning' },
  },
  {
    contentType: 'series',
    title: 'Severance',
    year: 2022,
    coverImageUrl: 'https://image.tmdb.org/t/p/w500/oFRFm77LHWaUCQ8V9sRc7R4AQEP.jpg',
    backdropImageUrl: 'https://image.tmdb.org/t/p/w1280/3pTwMUEavTzVOh9yFCPqvhJfUOG.jpg',
    metadata: { numberOfSeasons: 2, status: 'returning' },
  },
  {
    contentType: 'series',
    title: 'The Last of Us',
    year: 2023,
    coverImageUrl: 'https://image.tmdb.org/t/p/w500/uKvVjHNqB5VmOrdxqAt2F7J78ED.jpg',
    backdropImageUrl: 'https://image.tmdb.org/t/p/w1280/uDgy6hyPd82kOHh6I95iiG8ffnW.jpg',
    metadata: { numberOfSeasons: 2, status: 'returning' },
  },
  // ── Music ───────────────────────────────────────────────
  {
    contentType: 'music',
    title: 'To Pimp a Butterfly',
    year: 2015,
    coverImageUrl: 'https://upload.wikimedia.org/wikipedia/en/f/f6/Kendrick_Lamar_-_To_Pimp_a_Butterfly.png',
    metadata: { artist: 'Kendrick Lamar', totalTracks: 16 },
  },
  {
    contentType: 'music',
    title: 'OK Computer',
    year: 1997,
    coverImageUrl: 'https://upload.wikimedia.org/wikipedia/en/b/ba/Radioheadokcomputer.png',
    metadata: { artist: 'Radiohead', totalTracks: 12 },
  },
  {
    contentType: 'music',
    title: 'Blonde',
    year: 2016,
    coverImageUrl: 'https://upload.wikimedia.org/wikipedia/en/a/a0/Frank_Ocean_-_Blonde.png',
    metadata: { artist: 'Frank Ocean', totalTracks: 17 },
  },
  {
    contentType: 'music',
    title: 'Random Access Memories',
    year: 2013,
    coverImageUrl: 'https://upload.wikimedia.org/wikipedia/en/a/a7/Random_Access_Memories.jpg',
    metadata: { artist: 'Daft Punk', totalTracks: 13 },
  },
  // ── Games ───────────────────────────────────────────────
  {
    contentType: 'game',
    title: 'The Last of Us Part I',
    year: 2022,
    coverImageUrl: 'https://image.api.playstation.com/vulcan/ap/rnd/202207/1210/4xJ8XB3bi888QTLZYdl7Oi0s.png',
    metadata: { developer: 'Naughty Dog' },
  },
  {
    contentType: 'game',
    title: 'Elden Ring',
    year: 2022,
    coverImageUrl: 'https://image.api.playstation.com/vulcan/ap/rnd/202110/2000/phvVT0qZfcRms5qDAk0SI3CM.png',
    metadata: { developer: 'FromSoftware' },
  },
  {
    contentType: 'game',
    title: 'Disco Elysium',
    year: 2019,
    coverImageUrl: 'https://upload.wikimedia.org/wikipedia/en/7/7e/Disco_Elysium_cover_art.jpg',
    metadata: { developer: 'ZA/UM' },
  },
  {
    contentType: 'game',
    title: 'Hollow Knight',
    year: 2017,
    coverImageUrl: 'https://upload.wikimedia.org/wikipedia/en/3/3a/Hollow_Knight.png',
    metadata: { developer: 'Team Cherry' },
  },
  // ── Books ───────────────────────────────────────────────
  {
    contentType: 'book',
    title: 'The Name of the Wind',
    year: 2007,
    coverImageUrl: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1270352123i/186074.jpg',
    metadata: { author: ['Patrick Rothfuss'], pageCount: 662 },
  },
  {
    contentType: 'book',
    title: 'Dune',
    year: 1965,
    coverImageUrl: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1555447414i/44767458.jpg',
    metadata: { author: ['Frank Herbert'], pageCount: 412 },
  },
  {
    contentType: 'book',
    title: 'The Pragmatic Programmer',
    year: 1999,
    coverImageUrl: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1401432508i/4099.jpg',
    metadata: { author: ['David Thomas', 'Andrew Hunt'], pageCount: 352 },
  },
  {
    contentType: 'book',
    title: '100 años de soledad',
    year: 1967,
    coverImageUrl: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1327881361i/320.jpg',
    metadata: { author: ['Gabriel García Márquez'], pageCount: 417 },
  },
  // ── Podcasts ────────────────────────────────────────────
  {
    contentType: 'podcast',
    title: 'Lex Fridman Podcast',
    year: 2018,
    metadata: { host: ['Lex Fridman'], isActive: true },
  },
  {
    contentType: 'podcast',
    title: 'Syntax',
    year: 2017,
    metadata: { host: ['Wes Bos', 'Scott Tolinski'], isActive: true },
  },
  {
    contentType: 'podcast',
    title: 'Darknet Diaries',
    year: 2017,
    metadata: { host: ['Jack Rhysider'], isActive: true },
  },
]

async function main() {
  console.log('Seeding CatalogItem...')

  for (const item of SEED_ITEMS) {
    await prisma.catalogItem.upsert({
      where: {
        externalId_provider: {
          externalId: `seed:${item.contentType}:${item.title.toLowerCase().replace(/\s+/g, '-')}`,
          provider: 'seed',
        },
      },
      update: {
        title: item.title,
        coverImageUrl: item.coverImageUrl,
        backdropImageUrl: item.backdropImageUrl,
        year: item.year,
        metadata: item.metadata as object,
      },
      create: {
        contentType: item.contentType,
        title: item.title,
        coverImageUrl: item.coverImageUrl,
        backdropImageUrl: item.backdropImageUrl,
        year: item.year,
        metadata: item.metadata as object,
        externalId: `seed:${item.contentType}:${item.title.toLowerCase().replace(/\s+/g, '-')}`,
        provider: 'seed',
      },
    })
  }

  console.log(`Seeded ${SEED_ITEMS.length} catalog items.`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
