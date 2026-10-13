import { NextRequest, NextResponse } from 'next/server';
import {
  getMaintenance,
  getBlocklist,
  recordVisit,
  kvReady,
} from '@/lib/kv';

/**
 * Lapisan proteksi + admin:
 * 1. Blokir User-Agent scraper/pembuat clone di halaman web (API tetap terbuka).
 * 2. Rate limit per IP (in-memory, per instance).
 * 3. [admin] Block IP + mode maintenance (persisten via Upstash Redis).
 * 4. [admin] Catat IP pengunjung (log buat dilihat di panel).
 * 5. Security headers + watermark X-Wanz-Origin.
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

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isApi = pathname.startsWith('/api');
  const ua = request.headers.get('user-agent') || '';
  const ip = clientIp(request);

  // 1. Scraper otomatis dilarang masuk halaman web (API tetap boleh)
  if (!isApi && SCRAPING_UA.test(ua)) {
    return new NextResponse(
      '<!doctype html><html lang="id"><body style="font-family:sans-serif;background:#0f0f23;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;margin:0"><h1 style="border:3px solid #fff;padding:16px 24px">403 — Akses otomatis ditolak</h1></body></html>',
      { status: 403, headers: { 'content-type': 'text/html; charset=utf-8' } }
    );
  }

  // 2. [admin] Akses persisten (hanya kalau Upstash sudah dipasang)
  if (kvReady()) {
    // 2a. Catat IP pengunjung (throttled, tanpa error)
    await recordVisit(ip);

    // 2b. IP yang diblokir -> 403
    const blocklist = await getBlocklist();
    if (blocklist.has(ip)) {
      if (isApi) {
        return NextResponse.json(
          { success: false, error: 'IP Anda diblokir.' },
          { status: 403 }
        );
      }
      return new NextResponse(
        '<!doctype html><html lang="id"><body style="font-family:sans-serif;background:#0f0f23;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;margin:0"><h1 style="border:3px solid #fff;padding:16px 24px">403 — IP Anda diblokir</h1></body></html>',
        { status: 403, headers: { 'content-type': 'text/html; charset=utf-8' } }
      );
    }

    // 2c. Mode maintenance -> nonaktifkan situs untuk umum
    if (await getMaintenance()) {
      if (isApi) {
        return NextResponse.json(
          { success: false, error: 'Server sedang dalam mode perawatan. Coba lagi nanti.' },
          { status: 503, headers: { 'retry-after': '300' } }
        );
      }
      return new NextResponse(
        '<!doctype html><html lang="id"><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Perawatan — Wanz REST API</title></head><body style="font-family:sans-serif;background:#0f0f23;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;text-align:center"><div><div style="font-size:60px">🛠️</div><h1 style="border:3px solid #FACC15;color:#FACC15;padding:16px 24px">Sedang Perawatan</h1><p>Server sedang diperbarui. Coba lagi beberapa saat lagi.</p></div></body></html>',
        { status: 503, headers: { 'content-type': 'text/html; charset=utf-8', 'retry-after': '300' } }
      );
    }
  }

  // 3. Rate limit per IP
  if (rateLimited(ip, isApi ? LIMIT_API : LIMIT_WEB)) {
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

  // 4. Security headers + watermark asal-usul
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
