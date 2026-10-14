// Music search via YouTube Music (innertube WEB_REMIX), TANPA API key.
// Ambil config runtime dari music.youtube.com (cache 1 jam) + fallback hardcoded.
// Parse respons utk: judul, artis, album, tahun, durasi, videoId, icon, iconBig.
// TIDAK download/stream — metadata saja (app link-out ke YouTube Music).

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0 Safari/537.36';

export interface Track {
  videoId: string | null;
  title: string;
  artist: string | null;
  album: string | null;
  year: string | null;
  duration: string | null;
  views: string | null;
  icon: string | null;
  iconBig: string | null;
  url: string | null;
}

interface Cfg {
  key: string;
  version: string;
  at: number;
}

const CFG_TTL = 60 * 60 * 1000;
let cfgCache: Cfg | null = null;
const FALLBACK = {
  key: 'AIzaSyC9XL3ZjWddXya6X74dJoCTL-WEYFDNX30',
  version: '1.20261011.16.00',
};

async function getConfig(): Promise<{ key: string; version: string }> {
  if (cfgCache && Date.now() - cfgCache.at < CFG_TTL) {
    return { key: cfgCache.key, version: cfgCache.version };
  }
  try {
    const res = await fetch('https://music.youtube.com', {
      cache: 'no-store',
      signal: AbortSignal.timeout(15000),
      headers: { 'user-agent': UA, 'accept-language': 'en-US,en;q=0.9' },
    });
    const html = await res.text();
    const key = html.match(/"INNERTUBE_API_KEY":"([^"]+)"/)?.[1];
    const version = html.match(/"INNERTUBE_CLIENT_VERSION":"([^"]+)"/)?.[1];
    if (key && version) {
      cfgCache = { key, version, at: Date.now() };
      return { key, version };
    }
  } catch {
    /* pakai fallback */
  }
  return FALLBACK;
}

const FILTERS: Record<string, string | null> = {
  songs: 'EgWKAQIIAWoKEAoQAxAEEAkQBQ==',
  all: null,
};

function collect(obj: unknown, key: string): any[] {
  const out: any[] = [];
  const walk = (o: any) => {
    if (!o || typeof o !== 'object') return;
    if (Array.isArray(o)) {
      for (const v of o) walk(v);
      return;
    }
    for (const [k, v] of Object.entries(o)) {
      if (k === key && v && typeof v === 'object') out.push(v);
      walk(v);
    }
  };
  walk(obj);
  return out;
}

function colText(col: any): string {
  const runs =
    col?.musicResponsiveListItemFlexColumnRenderer?.text?.runs ?? col?.text?.runs ?? [];
  return runs.map((r: any) => (typeof r?.text === 'string' ? r.text : '')).join('');
}

function findVideoId(o: any): string | null {
  if (!o || typeof o !== 'object') return null;
  if (Array.isArray(o)) {
    for (const v of o) {
      const r = findVideoId(v);
      if (r) return r;
    }
    return null;
  }
  if (typeof o.videoId === 'string' && o.videoId) return o.videoId;
  for (const v of Object.values(o)) {
    const r = findVideoId(v);
    if (r) return r;
  }
  return null;
}

function findThumbs(o: any): any[] {
  if (!o || typeof o !== 'object') return [];
  if (Array.isArray(o)) {
    for (const v of o) {
      const r = findThumbs(v);
      if (r.length) return r;
    }
    return [];
  }
  if (Array.isArray(o.thumbnails)) return o.thumbnails;
  for (const v of Object.values(o)) {
    const r = findThumbs(v);
    if (r.length) return r;
  }
  return [];
}

function largestThumb(item: any): string | null {
  const thumbs =
    item?.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails ?? findThumbs(item);
  if (!Array.isArray(thumbs) || !thumbs.length) return null;
  let best = thumbs[0];
  for (const t of thumbs) {
    if ((t?.width ?? 0) > (best?.width ?? 0)) best = t;
  }
  return typeof best?.url === 'string' ? best.url : null;
}

function toBig(url: string): string {
  if (/=[sw][\d-]/.test(url)) return url.replace(/=[sw][\d-][^&]*$/, '=s544-h544');
  return url + '=s544-h544';
}

function parseItem(item: any): Track | null {
  const flex = item?.flexColumns ?? [];
  const title = (colText(flex[0]) || '').trim();
  if (!title) return null;

  // Layout songs: flex[1] = "artist • album • durasi" (satu kolom), flex[2] = "123M plays"
  const sub = (colText(flex[1]) || '')
    .split('•')
    .map((s: string) => s.trim())
    .filter(Boolean);
  const artist = sub[0] ?? null;
  const duration = sub.find((p: string) => /^\d+:\d{2}(:\d{2})?$/.test(p)) ?? null;
  const year = sub.find((p: string) => /^\d{4}$/.test(p)) ?? null;
  const album =
    sub.find(
      (p: string) => p !== artist && p !== duration && p !== year && !/^\d+:\d{2}/.test(p),
    ) ?? null;
  const views = (colText(flex[2]) || colText(flex[3]) || '').trim() || null;

  const videoId = item?.playlistItemData?.videoId ?? findVideoId(item);
  const icon = largestThumb(item);
  const iconBig = icon ? toBig(icon) : null;

  return {
    videoId,
    title,
    artist,
    album,
    year,
    duration,
    views,
    icon,
    iconBig,
    url: videoId ? 'https://music.youtube.com/watch?v=' + videoId : null,
  };
}

export async function searchMusic(
  q: string,
  limit: number,
  filter: string,
  lang: string,
  gl: string,
): Promise<{ results: Track[] }> {
  const { key, version } = await getConfig();
  const params = FILTERS[filter] ?? null;
  const body: Record<string, unknown> = {
    context: { client: { clientName: 'WEB_REMIX', clientVersion: version, hl: lang, gl } },
    query: q,
  };
  if (params) body.params = params;

  const res = await fetch('https://music.youtube.com/youtubei/v1/search?key=' + key, {
    method: 'POST',
    cache: 'no-store',
    signal: AbortSignal.timeout(20000),
    headers: {
      'user-agent': UA,
      'content-type': 'application/json',
      'x-youtube-client-name': '67',
      'x-youtube-client-version': version,
      origin: 'https://music.youtube.com',
      referer: 'https://music.youtube.com/',
      'accept-language': lang + ';q=0.9',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error('YouTube Music HTTP ' + res.status);
  const data = await res.json();

  const items = collect(data, 'musicResponsiveListItemRenderer');
  const results: Track[] = [];
  for (const it of items) {
    const t = parseItem(it);
    if (t) results.push(t);
    if (results.length >= limit) break;
  }
  return { results };
}
