import { NextRequest, NextResponse } from 'next/server';

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';

const HOSTS = [
  'douyin.com',
  'www.douyin.com',
  'v.douyin.com',
  'm.douyin.com',
  'www.iesdouyin.com',
  'tiktok.com',
  'www.tiktok.com',
];

function normalize(input: string): string | null {
  const s = (input || '').trim();
  if (!s) return null;
  try {
    const u = new URL(s);
    if (HOSTS.indexOf(u.hostname.toLowerCase()) === -1) return null;
    return u.toString();
  } catch {
    return /douyin\.com|tiktok\.com/.test(s) ? s : null;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Scrape halaman downloader: GET (token+cookie) -> POST link -> ambil URL video asli.
async function scrapeOnce(target: string): Promise<string | null> {
  const c1 = new AbortController();
  const t1 = setTimeout(() => c1.abort(), 20000);
  const page = await fetch('https://dlpanda.com/', {
    signal: c1.signal,
    headers: { 'user-agent': UA, accept: 'text/html' },
    redirect: 'follow',
  }).finally(() => clearTimeout(t1));
  if (!page.ok) throw new Error('page_' + page.status);
  const html = await page.text();

  const csrf = (html.match(/name="_token" value="([^"]+)"/) || [])[1];
  const t0ken = (html.match(/name="t0ken"[^>]*value="([^"]+)"/) || [])[1];
  if (!csrf) throw new Error('token');

  // Cookie sesi wajib ikut saat POST (Laravel XSRF) — tanpa ini POST gagal diam-diam.
  const anyHeaders = page.headers as any;
  const setCookies: string[] =
    typeof anyHeaders.getSetCookie === 'function'
      ? anyHeaders.getSetCookie()
      : page.headers.get('set-cookie')
      ? [page.headers.get('set-cookie') as string]
      : [];
  const cookie = setCookies
    .map((c) => c.split(';')[0])
    .filter((c) => c.indexOf('=') !== -1)
    .join('; ');

  const form = new FormData();
  form.append('url', target);
  form.append('_token', csrf);
  if (t0ken) form.append('t0ken', t0ken);

  const c2 = new AbortController();
  const t2 = setTimeout(() => c2.abort(), 40000);
  const res = await fetch('https://dlpanda.com/', {
    method: 'POST',
    signal: c2.signal,
    headers: {
      'user-agent': UA,
      referer: 'https://dlpanda.com/',
      'x-requested-with': 'XMLHttpRequest',
      accept: 'text/html,application/json',
      ...(cookie ? { cookie } : {}),
    },
    body: form,
    redirect: 'follow',
  }).finally(() => clearTimeout(t2));
  const out = await res.text();

  const m = out.match(/https:\/\/dl\.dlpanda\.com\/download\?url=([^"'\s<]+)/);
  if (!m) return null;
  return decodeURIComponent(m[1].replace(/&amp;/g, '&'));
}

export async function GET(req: NextRequest) {
  const start = Date.now();
  const input = req.nextUrl.searchParams.get('url')?.trim();
  if (!input) {
    return NextResponse.json(
      { success: false, error: 'Parameter url wajib diisi. Contoh: /api/dl/douyin?url=https://www.douyin.com/video/xxx' },
      { status: 400 }
    );
  }
  const target = normalize(input);
  if (!target) {
    return NextResponse.json(
      { success: false, error: 'Link tidak didukung. Format: link video douyin.com / tiktok.com.' },
      { status: 400 }
    );
  }

  try {
    // Downloader sering bolak-balik "sibuk" tanpa link -> coba sampai 4 kali.
    let inner: string | null = null;
    for (let attempt = 0; attempt < 4 && !inner; attempt++) {
      if (attempt > 0) await sleep(4000);
      try {
        inner = await scrapeOnce(target);
      } catch (err) {
        const msg = err instanceof Error ? err.message : '';
        if (msg.indexOf('token') !== -1 || msg.indexOf('page_') === 0) {
          if (attempt === 3) throw err;
        } else if (attempt === 3) {
          throw err;
        }
      }
    }

    if (!inner) {
      return NextResponse.json(
        { success: false, error: 'Video tidak ditemukan, privat, atau downloader sedang sibuk. Coba lagi nanti.' },
        { status: 404 }
      );
    }

    // Verifikasi link video asli benar-benar bisa diunduh
    const c3 = new AbortController();
    const t3 = setTimeout(() => c3.abort(), 25000);
    const probe = await fetch(inner, {
      method: 'HEAD',
      signal: c3.signal,
      headers: { 'user-agent': UA, referer: 'https://www.douyin.com/' },
    }).finally(() => clearTimeout(t3));

    if (!probe.ok && probe.status !== 206) {
      return NextResponse.json(
        { success: false, error: 'Link video kedaluwarsa atau ditolak server. Coba lagi.' },
        { status: 502 }
      );
    }

    const size = probe.headers.get('content-length');
    return NextResponse.json({
      success: true,
      url: inner,
      mime: probe.headers.get('content-type') || 'video/mp4',
      size_bytes: size ? parseInt(size, 10) : null,
      source: 'dlpanda',
      ms: Date.now() - start,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    if (msg.indexOf('abort') !== -1) {
      return NextResponse.json({ success: false, error: 'Downloader lambat merespons. Coba lagi.' }, { status: 504 });
    }
    if (msg.indexOf('token') !== -1 || msg.indexOf('page_') === 0) {
      return NextResponse.json({ success: false, error: 'Downloader sedang berubah/bermasalah. Coba lagi nanti.' }, { status: 502 });
    }
    return NextResponse.json({ success: false, error: 'Gagal mengambil video. Coba lagi.' }, { status: 502 });
  }
}
