import { NextRequest, NextResponse } from 'next/server';

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';

const HOSTS = [
  'facebook.com',
  'www.facebook.com',
  'm.facebook.com',
  'web.facebook.com',
  'fb.watch',
  'fb.com',
  'fb.me',
  'www.fb.watch',
];

function normalize(input: string): string | null {
  const s = (input || '').trim();
  if (!s) return null;
  try {
    const u = new URL(s);
    if (HOSTS.indexOf(u.hostname.toLowerCase()) === -1) return null;
    return u.toString();
  } catch {
    return /(?:facebook\.com|fb\.watch|fb\.com|fb\.me)\//.test(s) ? s : null;
  }
}

export async function GET(req: NextRequest) {
  const start = Date.now();
  const input = req.nextUrl.searchParams.get('url')?.trim();
  if (!input) {
    return NextResponse.json(
      { success: false, error: 'Parameter url wajib diisi. Contoh: /api/dl/facebook?url=https://www.facebook.com/watch/?v=xxx' },
      { status: 400 }
    );
  }
  const target = normalize(input);
  if (!target) {
    return NextResponse.json(
      { success: false, error: 'Link tidak didukung. Format: link video/facebook.com, fb.watch, atau fb.me.' },
      { status: 400 }
    );
  }

  try {
    // 1) Halaman downloader (scrape web, tanpa API pihak ketiga)
    const pageUrl = 'https://dlpanda.com/facebook';
    const c1 = new AbortController();
    const t1 = setTimeout(() => c1.abort(), 20000);
    const page = await fetch(pageUrl, {
      signal: c1.signal,
      headers: { 'user-agent': UA, accept: 'text/html' },
      redirect: 'follow',
    }).finally(() => clearTimeout(t1));
    if (!page.ok) throw new Error('page_' + page.status);
    const html = await page.text();

    const csrf = (html.match(/name="_token" value="([^"]+)"/) || [])[1];
    if (!csrf) throw new Error('token');

    // Cookie sesi wajib ikut saat POST (Laravel XSRF).
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

    const c2 = new AbortController();
    const t2 = setTimeout(() => c2.abort(), 45000);
    const res = await fetch(pageUrl, {
      method: 'POST',
      signal: c2.signal,
      headers: {
        'user-agent': UA,
        referer: pageUrl,
        'x-requested-with': 'XMLHttpRequest',
        accept: 'text/html,application/json',
        ...(cookie ? { cookie } : {}),
      },
      body: form,
      redirect: 'follow',
    }).finally(() => clearTimeout(t2));
    const out = await res.text();

    // 2) Ambil URL video fbcdn asli (tanpa header tambahan saat diakses —
    //    kirim Referer justru bikin 403)
    const candidates = out.match(/https?:\/\/[^\s"'<>\\]{20,1500}/g) || [];
    let videoUrl: string | null = null;
    for (const raw of candidates) {
      const u = raw.replace(/&amp;/g, '&');
      if (u.indexOf('fbcdn.net') !== -1 && u.indexOf('.mp4') !== -1) {
        videoUrl = u;
        break;
      }
    }

    if (!videoUrl) {
      return NextResponse.json(
        { success: false, error: 'Video tidak ditemukan, privat, atau butuh login. Pastikan link video publik.' },
        { status: 404 }
      );
    }

    const c3 = new AbortController();
    const t3 = setTimeout(() => c3.abort(), 25000);
    const probe = await fetch(videoUrl, {
      method: 'HEAD',
      signal: c3.signal,
      headers: { 'user-agent': UA },
    }).finally(() => clearTimeout(t3));

    if (!probe.ok && probe.status !== 206) {
      return NextResponse.json(
        { success: false, error: 'Link video ditolak server. Coba lagi nanti.' },
        { status: 502 }
      );
    }

    const size = probe.headers.get('content-length');
    return NextResponse.json({
      success: true,
      url: videoUrl,
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
      return NextResponse.json({ success: false, error: 'Downloader sedang bermasalah. Coba lagi nanti.' }, { status: 502 });
    }
    return NextResponse.json({ success: false, error: 'Gagal mengambil video. Coba lagi.' }, { status: 502 });
  }
}
