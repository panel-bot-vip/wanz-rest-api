// Shared scraper untuk komik: Webtoons (m.webtoons.com) + Komiku (komiku.org).
// Konten publik, scrape langsung tanpa bypass login/paywall/daily-pass.
// Endpoint yang dipakai:
//   Webtoons search : GET /{lang}/search/result?keyword=&searchType=&start=
//   Webtoons episode: GET /api/v1/webtoon/{titleNo}/episodes?pageSize=&cursor=&readingLanguageCode=
//   Webtoons viewer : GET {viewerLink}  -> parse `var imageList = [{url,...}]`
//   Komiku search   : GET /wp-json/wp/v2/manga?search=   (WP REST, JSON)
//   Komiku chapter  : GET /manga/{slug}/  dan  /{chapter-slug}/  -> gambar image*.komiku.to/uploadN/

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0 Safari/537.36';

export const WT = 'https://m.webtoons.com';
export const WT_IMG = 'https://webtoon-phinf.pstatic.net';
export const KM = 'https://komiku.org';

export type Site = 'webtoon' | 'komiku';

export interface ComicItem {
  site: Site;
  kind?: string; // webtoon: original | canvas
  id: string; // webtoon: titleNo | komiku: manga slug
  title: string;
  author?: string | null;
  genre?: string | null;
  thumb?: string | null;
  views?: number | null;
  url?: string | null;
}

export interface ComicEpisode {
  no: number | string;
  title?: string | null;
  date?: number | null;
  up?: boolean;
  ref: string; // path utk /read (sudah termasuk query utk webtoon)
  url: string;
}

// ---- dasar ----
async function fetchText(url: string, referer?: string): Promise<string> {
  const res = await fetch(url, {
    cache: 'no-store',
    signal: AbortSignal.timeout(25000),
    headers: {
      'user-agent': UA,
      accept: 'text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8',
      'accept-language': 'id-ID,id;q=0.9,en;q=0.8',
      ...(referer ? { referer } : {}),
    },
  });
  if (!res.ok) {
    const e = new Error(`HTTP ${res.status}`) as Error & { status?: number };
    e.status = res.status;
    throw e;
  }
  return res.text();
}

function decodeEntities(s: string): string {
  return s
    .replace(/&#0?39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => safeChar(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => safeChar(parseInt(d, 10)))
    .trim();
}

function safeChar(n: number): string {
  try {
    return Number.isFinite(n) && n > 0 && n < 0x110000 ? String.fromCodePoint(n) : '';
  } catch {
    return '';
  }
}

// Guard SSRF: ref harus path relatif di domain tepercaya (kita prepend domain sendiri).
export function safeRef(ref: string): string | null {
  if (!ref) return null;
  if (!ref.startsWith('/')) return null;
  if (ref.startsWith('//')) return null; // protocol-relative
  if (/^[a-z][a-z0-9+.-]*:/i.test(ref)) return null; // ada scheme (http:, data:, dll)
  if (ref.includes('..')) return null;
  if (/[@\\]/.test(ref)) return null;
  return ref;
}

function parseJson(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error('Respons bukan JSON valid.');
  }
}

// ================= WEBTOONS =================

export async function searchWebtoon(
  q: string,
  searchType: string,
  start: number,
  limit: number,
  lang = 'en',
): Promise<ComicItem[]> {
  const url = `${WT}/${lang}/search/result?keyword=${encodeURIComponent(q)}&searchType=${searchType}&start=${start}`;
  const raw = await fetchText(url, `${WT}/${lang}/search?keyword=${encodeURIComponent(q)}`);
  const data = parseJson(raw) as {
    result?: {
      webtoonResult?: { titleList?: any[] };
      challengeResult?: { titleList?: any[] };
    };
  };
  const r = data?.result ?? {};
  const out: ComicItem[] = [];
  const push = (list: any[] | undefined, kind: string) => {
    for (const t of list ?? []) {
      if (t?.titleNo == null) continue;
      out.push({
        site: 'webtoon',
        kind,
        id: String(t.titleNo),
        title: decodeEntities(String(t.title ?? '').trim()),
        author: t.writingAuthorName ?? t.pictureAuthorName ?? null,
        genre: t.representGenre ?? null,
        thumb: t.thumbnailMobile ? WT_IMG + t.thumbnailMobile : null,
        views: typeof t.readCount === 'number' ? t.readCount : null,
        url: null, // list butuh genre+slug (tak disediakan search) -> pakai id utk /episodes
      });
    }
  };
  push(r.webtoonResult?.titleList, 'original');
  push(r.challengeResult?.titleList, 'canvas');
  return out.slice(0, limit);
}

export async function episodesWebtoon(
  titleNo: string,
  pageSize: number,
  cursor: number,
  lang = 'en',
): Promise<{ episodes: ComicEpisode[]; nextCursor: number | null }> {
  const url = `${WT}/api/v1/webtoon/${titleNo}/episodes?pageSize=${pageSize}&cursor=${cursor}&readingLanguageCode=${lang}`;
  const raw = await fetchText(url, `${WT}/${lang}/`);
  const data = parseJson(raw) as {
    result?: { episodeList?: any[]; nextCursor?: number | null };
  };
  const r = data?.result ?? {};
  const episodes: ComicEpisode[] = (r.episodeList ?? []).map((e) => ({
    no: e.episodeNo,
    title: e.episodeTitle ?? null,
    date: e.exposureDateMillis ?? null,
    up: !!e.displayUp,
    ref: e.viewerLink, // path + query, di-encode saat dikirim ke /read
    url: WT + e.viewerLink,
  }));
  const nc = r.nextCursor;
  return { episodes, nextCursor: typeof nc === 'number' ? nc : null };
}

// Cari viewerLink utk (titleNo, epNo) — paginate via cursor (max 5 halaman).
async function resolveWebtoonViewer(titleNo: string, epNo: number, lang: string): Promise<string> {
  let cursor = 0;
  for (let i = 0; i < 5; i++) {
    const { episodes, nextCursor } = await episodesWebtoon(titleNo, 200, cursor, lang);
    const hit = episodes.find((e) => Number(e.no) === epNo);
    if (hit) return hit.ref;
    if (nextCursor == null || nextCursor === cursor || episodes.length === 0) break;
    cursor = nextCursor;
  }
  throw new Error(`Episode ${epNo} tidak ditemukan di titleNo ${titleNo}.`);
}

export async function readWebtoon(ref: string): Promise<{
  title: string | null;
  episode: number | null;
  images: string[];
}> {
  const raw = await fetchText(WT + ref, `${WT}/en/`);
  const key = raw.indexOf('var imageList');
  if (key < 0) {
    throw new Error(
      'Gambar tidak tersedia (episode mungkin daily-pass / butuh login / belum tayang).',
    );
  }
  const open = raw.indexOf('[', key);
  const close = raw.indexOf(']', open);
  if (open < 0 || close < 0) throw new Error('imageList tidak ditemukan.');
  const block = raw.slice(open, close + 1);
  const images: string[] = [];
  const re = /url:\s*"([^"]+)"/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(block))) {
    const u = m[1];
    images.push(u.startsWith('/') ? WT_IMG + u : u);
  }
  if (!images.length) throw new Error('Tidak ada gambar pada episode ini.');
  const tn = raw.match(/titleName:\s*"([^"]*)"/);
  const ep = raw.match(/episodeNo:\s*(\d+)/);
  return {
    title: tn ? decodeEntities(tn[1]) : null,
    episode: ep ? parseInt(ep[1], 10) : null,
    images,
  };
}

export { resolveWebtoonViewer };

// ================= KOMIKU =================

function kmUrl(link: string): string {
  try {
    const u = new URL(link);
    return KM + u.pathname; // komikid.org -> komiku.org, ambil path saja
  } catch {
    return link;
  }
}

export async function searchKomiku(q: string, limit: number): Promise<ComicItem[]> {
  const url = `${KM}/wp-json/wp/v2/manga?search=${encodeURIComponent(q)}&per_page=${Math.min(limit, 50)}`;
  const raw = await fetchText(url, `${KM}/`);
  const data = parseJson(raw);
  if (!Array.isArray(data)) return [];
  return (data as any[]).slice(0, limit).map((m) => ({
    site: 'komiku' as const,
    id: String(m.slug ?? ''),
    title: decodeEntities(String(m.title?.rendered ?? m.slug ?? '')),
    url: kmUrl(String(m.link ?? '')),
    thumb: null, // cover tidak ada di WP REST -> ambil di /episodes
  }));
}

export async function episodesKomiku(slug: string): Promise<{
  series: { title: string; cover: string | null };
  episodes: ComicEpisode[];
}> {
  const raw = await fetchText(`${KM}/manga/${slug}/`, `${KM}/`);
  const t = raw.match(/<title>([\s\S]*?)<\/title>/i)?.[1] ?? '';
  const title = decodeEntities(t.replace(/\s*[-–|]\s*Komiku.*$/i, '').replace(/^Komik\s+/i, ''));
  const cover = raw.match(/<img[^>]*src="(https:\/\/thumbnail\.komiku\.[a-z]+\/[^"]+)"/i)?.[1] ?? null;

  // link chapter: /{slug}-chapter-{n}/  (boleh ada .5 / -5 utk bonus)
  const map = new Map<string, ComicEpisode>();
  const re = /href="(\/[a-z0-9][a-z0-9-]*-chapter-\d+(?:[.-]\d+)?\/)"/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw))) {
    const path = m[1];
    if (map.has(path)) continue;
    const num = path.match(/chapter-(\d+)/i);
    map.set(path, {
      no: num ? parseInt(num[1], 10) : path,
      title: null,
      ref: path,
      url: KM + path,
    });
  }
  const episodes = Array.from(map.values()).sort(
    (a, b) => Number(a.no) - Number(b.no),
  );
  if (!episodes.length) throw new Error('Daftar chapter tidak ditemukan.');
  return { series: { title, cover }, episodes };
}

// gambar komik komiku = host image*.komiku.* + path /uploadN/ (mengecualikan promo & cover)
const isComicImg = (u: string) =>
  /^https:\/\/image\d*\.komiku\./i.test(u) && /\/upload\d*\//i.test(u);

export async function readKomiku(ref: string): Promise<{
  title: string | null;
  images: string[];
}> {
  const raw = await fetchText(KM + ref, `${KM}/`);
  const t = raw.match(/<title>([\s\S]*?)<\/title>/i)?.[1] ?? '';
  const title = decodeEntities(t.replace(/\s*[-–|]\s*Komiku.*$/i, ''));

  const images: string[] = [];
  const seen = new Set<string>();
  const tagRe = /<img[^>]+>/g;
  let m: RegExpExecArray | null;
  while ((m = tagRe.exec(raw))) {
    const tag = m[0];
    const dm = tag.match(/\bdata-src="([^"]+)"/i)?.[1];
    const sm = tag.match(/\bsrc="([^"]+)"/i)?.[1];
    const pick = [dm, sm].filter((u): u is string => !!u && isComicImg(u));
    if (pick.length && !seen.has(pick[0])) {
      seen.add(pick[0]);
      images.push(pick[0]);
    }
  }
  if (!images.length) throw new Error('Tidak ada gambar chapter ini.');
  return { title, images };
}
