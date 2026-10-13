import { NextRequest, NextResponse } from 'next/server';

/**
 * Lapisan proteksi anti-clone:
 * 1. Blokir User-Agent scraper/pembuat clone (HTTrack, wget, WebCopier, dsb) di halaman web.
 *    API TETAP terbuka untuk semua — pengguna bebas panggil via curl/http.
 * 2. Rate limit per IP (in-memory, per instance) — memperlambat perayapan massal.
 * 3. Security headers + watermark X-Wanz-Origin di setiap respons.
 */

const SCRAPING_UA =
  /(httrack|webcopier|teleport|webzip|sitebulb|screaming.?frog|wget|libwww|perl\/|python-requests|scrapy|httpclient|okhttp|go-http-client|java\/|masscan|nikto|sqlmap|dirbuster|gobuster|feroxbuster)/i;

const WINDOW_MS = 60_000;
const LIMIT_API = 60; // request API / IP / menit
const LIMIT_WEB = 120; // halaman web / IP / menit

const HITS = new Map<string, { count: number; reset: number }>();

function clientIp(req: NextRequest): string {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return req.headers.get('x-real-ip') || '0.0.0.0';
}

function rateLimited(ip: string, limit: number): boolean {
  const now = Date.now();
  if (HITS.size > 5000) {
    // buang entri kedaluwarsa supaya peta tidak membengkak
    const stale: string[] = [];
    HITS.forEach((v, k) => {
      if (now > v.reset) stale.push(k);
    });
    stale.forEach((k) => HITS.delete(k));
  }
  const entry = HITS.get(ip);
  if (!entry || now > entry.reset) {
    HITS.set(ip, { count: 1, reset: now + WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > limit;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isApi = pathname.startsWith('/api');
  const ua = request.headers.get('user-agent') || '';

  // 1. Scraper otomatis dilarang masuk halaman web (API tetap boleh)
  if (!isApi && SCRAPING_UA.test(ua)) {
    return new NextResponse(
      '<!doctype html><html lang="id"><body style="font-family:sans-serif;background:#0f0f23;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;margin:0"><h1 style="border:3px solid #fff;padding:16px 24px">403 — Akses otomatis ditolak</h1></body></html>',
      { status: 403, headers: { 'content-type': 'text/html; charset=utf-8' } }
    );
  }

  // 2. Rate limit per IP
  if (rateLimited(clientIp(request), isApi ? LIMIT_API : LIMIT_WEB)) {
    if (isApi) {
      return NextResponse.json(
        { success: false, error: 'Terlalu banyak request. Coba lagi dalam satu menit.' },
        { status: 429, headers: { 'retry-after': '60' } }
      );
    }
    return new NextResponse('Terlalu banyak request. Coba lagi sebentar.', {
      status: 429,
      headers: { 'content-type': 'text/plain; charset=utf-8' },
    });
  }

  // 3. Security headers + watermark asal-usul
  const res = NextResponse.next();
  res.headers.set('X-Wanz-Origin', 'wanz-rest-api');
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  if (!isApi) {
    // halaman web tidak boleh di-embed di iframe (anti-klikjacking / tiruan)
    res.headers.set('X-Frame-Options', 'DENY');
    res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  }
  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)'],
};
