// Katalog anime via AniList GraphQL (API publik resmi, TANPA key).
// Endpoint: POST https://graphql.anilist.co  (public query, no auth).
// Kembalikan METADATA: judul, format, episode, skor, genre, cover, sinopsis, studio,
//   + streamingEpisodes (tautan nonton LEGAL: Crunchyroll/Netflix/dst) & externalLinks.
// TIDAK scrape stream bajakan — app tinggal link-out ke platform resmi.

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0 Safari/537.36';

const AL = 'https://graphql.anilist.co';

export interface AnimeItem {
  id: number; // AniList id
  idMal: number | null; // MyAnimeList id (utk link MAL)
  title: { romaji: string | null; english: string | null; native: string | null };
  displayTitle: string;
  format: string | null;
  status: string | null;
  episodes: number | null;
  duration: number | null;
  score: number | null; // averageScore (0-100)
  genres: string[];
  season: string | null;
  year: number | null;
  cover: string | null;
  banner: string | null;
  isAdult: boolean;
}

async function al(query: string, variables: Record<string, unknown>): Promise<any> {
  const res = await fetch(AL, {
    method: 'POST',
    cache: 'no-store',
    signal: AbortSignal.timeout(20000),
    headers: {
      'user-agent': UA,
      'content-type': 'application/json',
      accept: 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) {
    const e = new Error(`HTTP ${res.status} dari AniList`) as Error & { status?: number };
    e.status = res.status;
    throw e;
  }
  const data = await res.json();
  if (data?.errors) throw new Error(data.errors[0]?.message || 'AniList error');
  return data?.data;
}

const FIELDS = `
  id
  idMal
  title { romaji english native }
  format
  status
  episodes
  duration
  averageScore
  popularity
  genres
  season
  seasonYear
  coverImage { large extraLarge color }
  bannerImage
  isAdult
`;

const SEARCH_QUERY = `
query ($search: String, $page: Int, $perPage: Int, $sort: [MediaSort], $isAdult: Boolean) {
  Page(page: $page, perPage: $perPage) {
    pageInfo { currentPage hasNextPage lastPage total }
    media(search: $search, type: ANIME, sort: $sort, isAdult: $isAdult) {
      ${FIELDS}
      startDate { year }
    }
  }
}
`;

function norm(m: any): AnimeItem {
  const t = m?.title ?? {};
  return {
    id: m.id,
    idMal: m.idMal ?? null,
    title: { romaji: t.romaji ?? null, english: t.english ?? null, native: t.native ?? null },
    displayTitle: t.english || t.romaji || t.native || 'Untitled',
    format: m.format ?? null,
    status: m.status ?? null,
    episodes: m.episodes ?? null,
    duration: m.duration ?? null,
    score: m.averageScore ?? null,
    genres: m.genres ?? [],
    season: m.season ?? null,
    year: m.seasonYear ?? m.startDate?.year ?? null,
    cover: m.coverImage?.large ?? m.coverImage?.extraLarge ?? null,
    banner: m.bannerImage ?? null,
    isAdult: !!m.isAdult,
  };
}

export async function searchAnime(
  q: string,
  limit: number,
  page: number,
  sort: string,
  isAdult: boolean,
): Promise<{ results: AnimeItem[]; pageInfo: any }> {
  const data = await al(SEARCH_QUERY, {
    search: q,
    page,
    perPage: limit,
    sort: [sort],
    isAdult,
  });
  const media = data?.Page?.media ?? [];
  return { results: media.map(norm), pageInfo: data?.Page?.pageInfo ?? {} };
}

const DETAIL_QUERY = `
query ($id: Int) {
  Media(id: $id, type: ANIME) {
    ${FIELDS}
    meanScore
    description(asHtml: false)
    synonyms
    startDate { year month day }
    endDate { year month day }
    studios(isMain: true) { nodes { name } }
    source
    countryOfOrigin
    externalLinks { url site }
    streamingEpisodes { title thumbnail url site }
  }
}
`;

export interface AnimeDetail extends AnimeItem {
  description: string | null;
  meanScore: number | null;
  synonyms: string[];
  studios: string[];
  source: string | null;
  country: string | null;
  start: { year: number | null; month: number | null; day: number | null } | null;
  end: { year: number | null; month: number | null; day: number | null } | null;
  externalLinks: { url: string; site: string | null }[];
  streamingEpisodes: {
    title: string | null;
    thumbnail: string | null;
    url: string | null;
    site: string | null;
  }[];
}

export async function detailAnime(id: number): Promise<AnimeDetail> {
  const data = await al(DETAIL_QUERY, { id });
  const m = data?.Media;
  if (!m) throw new Error('Anime tidak ditemukan.');
  const base = norm(m);
  const episodes = (m.streamingEpisodes ?? []).map((e: any) => ({
    title: e.title || null,
    thumbnail: e.thumbnail ?? null,
    url: e.url ?? null,
    site: e.site ?? null,
  }));
  return {
    ...base,
    description: m.description ?? null,
    meanScore: m.meanScore ?? null,
    synonyms: m.synonyms ?? [],
    studios: (m.studios?.nodes ?? []).map((n: any) => n.name),
    source: m.source ?? null,
    country: m.countryOfOrigin ?? null,
    start: m.startDate ?? null,
    end: m.endDate ?? null,
    externalLinks: (m.externalLinks ?? []).map((l: any) => ({ url: l.url, site: l.site })),
    streamingEpisodes: episodes,
  };
}
