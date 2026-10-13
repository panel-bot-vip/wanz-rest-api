/**
 * Utilitas info web: scrape langsung HTML target (tanpa API key, tanpa wrapper).
 * Dipakai endpoint /api/tools/webdesc dan /api/tools/webicon.
 */

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

export interface WebMeta {
  url: string;
  finalUrl: string;
  status: number;
  title?: string;
  description?: string;
  siteName?: string;
  keywords?: string;
  image?: string;
  icon?: string;
  themeColor?: string;
  language?: string;
  generator?: string;
}

function fetchWithTimeout(url: string, init: RequestInit, ms: number): Promise<Response> {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), ms);
  return fetch(url, { ...init, signal: ctl.signal }).finally(() => clearTimeout(t));
}

/** Normalisasi URL: tambah https:// bila protocol kosong. */
export function normalizeUrl(raw: string): string | null {
  let s = raw.trim();
  if (!s) return null;
  if (!/^https?:\/\//i.test(s)) s = 'https://' + s.replace(/^\/+/, '');
  try {
    const u = new URL(s);
    if (!u.hostname.includes('.')) return null;
    return u.toString();
  } catch {
    return null;
  }
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#x27;|&#39;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .trim();
}

function absolutize(base: string, maybe?: string): string | undefined {
  if (!maybe) return undefined;
  try {
    return new URL(maybe, base).toString();
  } catch {
    return undefined;
  }
}

/** Ambil konten <meta> berdasarkan property/name, tahan urutan atribut. */
function metaContent(html: string, key: string): string | undefined {
  const esc = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(
    `<meta[^>]*(?:property|name)=["']${esc}["'][^>]*content=["']([^"']*)["']` +
      `|<meta[^>]*content=["']([^"']*)["'][^>]*(?:property|name)=["']${esc}["']`,
    'i'
  );
  const m = html.match(re);
  const val = (m && (m[1] || m[2])) || '';
  return val ? decodeEntities(val) : undefined;
}

function findIcon(html: string, base: string): string | undefined {
  const tags = html.match(/<link\b[^>]*>/gi) || [];
  let best: { href: string; score: number } | undefined;
  for (const tag of tags) {
    const relM = tag.match(/rel=["']([^"']*)["']/i);
    const rel = (relM ? relM[1] : '').toLowerCase();
    if (!rel.includes('icon')) continue;
    const hrefM = tag.match(/href=["']([^"']*)["']/i);
    const href = hrefM ? hrefM[1] : '';
    if (!href) continue;
    let score = 1;
    if (rel.includes('apple-touch-icon')) score += 3;
    if (rel.includes('shortcut')) score += 1;
    const sizesM = tag.match(/sizes=["'](\d+)/i);
    if (sizesM) score += parseInt(sizesM[1], 10) / 100;
    if (!best || score > best.score) best = { href, score };
  }
  return best ? absolutize(base, best.href) : undefined;
}

/** Scrape metadata HTML sebuah situs (title, deskripsi, og, icon, dll). */
export async function fetchWebMeta(rawUrl: string): Promise<WebMeta> {
  const url = normalizeUrl(rawUrl);
  if (!url) throw new Error('URL tidak valid');

  const res = await fetchWithTimeout(
    url,
    { redirect: 'follow', headers: { 'User-Agent': UA, Accept: 'text/html,application/xhtml+xml' } },
    12000
  );
  const finalUrl = res.url || url;
  const ct = res.headers.get('content-type') || '';
  const html = ct.includes('html') ? await res.text() : '';

  const title =
    metaContent(html, 'og:title') ||
    metaContent(html, 'twitter:title') ||
    (() => {
      const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
      return m ? decodeEntities(m[1]) : undefined;
    })();

  const langM = html.match(/<html[^>]*\slang=["']([^"']+)["']/i);

  return {
    url,
    finalUrl,
    status: res.status,
    title,
    description:
      metaContent(html, 'description') ||
      metaContent(html, 'og:description') ||
      metaContent(html, 'twitter:description'),
    siteName: metaContent(html, 'og:site_name') || metaContent(html, 'application-name'),
    keywords: metaContent(html, 'keywords'),
    image: absolutize(finalUrl, metaContent(html, 'og:image') || metaContent(html, 'twitter:image')),
    icon: absolutize(finalUrl, findIcon(html, finalUrl)),
    themeColor: metaContent(html, 'theme-color'),
    language: langM ? langM[1] : undefined,
    generator: metaContent(html, 'generator'),
  };
}

/** Cari favicon situs lalu unduh byte-nya (fallback: /favicon.ico lalu Google S2). */
export async function fetchWebIcon(
  rawUrl: string
): Promise<{ source: string; bytes: ArrayBuffer; contentType: string }> {
  const url = normalizeUrl(rawUrl);
  if (!url) throw new Error('URL tidak valid');

  let iconUrl: string | undefined;
  try {
    const res = await fetchWithTimeout(
      url,
      { redirect: 'follow', headers: { 'User-Agent': UA, Accept: 'text/html,application/xhtml+xml' } },
      12000
    );
    const finalUrl = res.url || url;
    const ct = res.headers.get('content-type') || '';
    if (res.ok && ct.includes('html')) {
      const html = await res.text();
      iconUrl = findIcon(html, finalUrl);
    }
    if (!iconUrl) iconUrl = new URL(finalUrl).origin + '/favicon.ico';
  } catch {
    iconUrl = new URL(url).origin + '/favicon.ico';
  }

  // Coba ambil ikon langsung; bila gagal, pakai Google S2 (tanpa key).
  const candidates = [iconUrl, `https://www.google.com/s2/favicons?sz=128&domain=${new URL(url).hostname}`];
  for (const cand of candidates) {
    if (!cand) continue;
    try {
      const ico = await fetchWithTimeout(cand, { headers: { 'User-Agent': UA }, redirect: 'follow' }, 12000);
      if (ico.ok) {
        const bytes = await ico.arrayBuffer();
        if (bytes.byteLength > 0) {
          return {
            source: cand,
            bytes,
            contentType: ico.headers.get('content-type') || 'image/x-icon',
          };
        }
      }
    } catch {
      /* coba kandidat berikutnya */
    }
  }
  throw new Error('Ikon tidak ditemukan');
}
