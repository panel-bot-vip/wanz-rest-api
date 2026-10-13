import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';

export const runtime = 'nodejs';
export const maxDuration = 30;

const FORMATS = ['png', 'jpeg', 'jpg', 'webp', 'avif', 'tiff', 'gif'] as const;
type Fmt = (typeof FORMATS)[number];

const CONTENT: Record<string, string> = {
  png: 'image/png',
  jpeg: 'image/jpeg',
  jpg: 'image/jpeg',
  webp: 'image/webp',
  avif: 'image/avif',
  tiff: 'image/tiff',
  gif: 'image/gif',
};

// tolak URL internal/private (SSRF) — cuma boleh http/https publik
function isSafeUrl(raw: string): boolean {
  try {
    const u = new URL(raw);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return false;
    const host = u.hostname.toLowerCase();
    if (
      host === 'localhost' ||
      host === '0.0.0.0' ||
      host.endsWith('.local') ||
      host.endsWith('.internal') ||
      /^127\./.test(host) ||
      /^10\./.test(host) ||
      /^192\.168\./.test(host) ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(host) ||
      /^169\.254\./.test(host) ||
      /^0\./.test(host)
    )
      return false;
    return true;
  } catch {
    return false;
  }
}

function err(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status });
}

export async function GET(req: NextRequest) {
  try {
    const p = req.nextUrl.searchParams;
    const src = p.get('url')?.trim();
    if (!src) return err('Parameter wajib: ?url=<url-gambar>');

    let to = (p.get('to') || 'webp').toLowerCase() as Fmt;
    if (to === 'jpg') to = 'jpeg';
    if (!FORMATS.includes(to)) return err(`Format tidak didukung. Pilihan: ${FORMATS.join(', ')}`);

    if (!isSafeUrl(src)) return err('URL tidak valid atau ditolak (harus http/https publik).');

    const w = p.get('w') ? parseInt(p.get('w')!, 10) : undefined;
    const h = p.get('h') ? parseInt(p.get('h')!, 10) : undefined;
    const q = p.get('q') ? parseInt(p.get('q')!, 10) : 80;
    if (w !== undefined && (!Number.isFinite(w) || w < 1 || w > 8000)) return err('Param w tidak valid (1-8000).');
    if (h !== undefined && (!Number.isFinite(h) || h < 1 || h > 8000)) return err('Param h tidak valid (1-8000).');
    if (!Number.isFinite(q) || q < 1 || q > 100) return err('Param q tidak valid (1-100).');
    const fit = (p.get('fit') || 'cover') as 'cover' | 'contain' | 'fill' | 'inside' | 'outside';

    // ambil gambar dari URL (timeout + batas ukuran)
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 15_000);
    const res = await fetch(src, { signal: ctrl.signal, redirect: 'follow' });
    clearTimeout(timer);
    if (!res.ok) return err(`Gagal mengunduh gambar (status ${res.status}).`, 502);

    const len = Number(res.headers.get('content-length') || 0);
    if (len > 25 * 1024 * 1024) return err('Gambar terlalu besar (maks 25MB).', 413);
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > 25 * 1024 * 1024) return err('Gambar terlalu besar (maks 25MB).', 413);

    let pipeline = sharp(buf, { failOn: 'none' }).rotate(); // auto-orient EXIF
    const meta = await sharp(buf, { failOn: 'none' }).metadata();
    if (w !== undefined || h !== undefined) {
      pipeline = pipeline.resize({ width: w, height: h, fit, withoutEnlargement: true });
    }

    switch (to) {
      case 'png':
        pipeline = pipeline.png({ compressionLevel: 9 });
        break;
      case 'jpeg':
        pipeline = pipeline.jpeg({ quality: q, mozjpeg: true });
        break;
      case 'webp':
        pipeline = pipeline.webp({ quality: q });
        break;
      case 'avif':
        pipeline = pipeline.avif({ quality: Math.min(q, 60) });
        break;
      case 'tiff':
        pipeline = pipeline.tiff({ quality: q });
        break;
      case 'gif':
        pipeline = pipeline.gif();
        break;
    }

    const out = await pipeline.toBuffer();
    const ext = to === 'jpeg' ? 'jpg' : to;
    return new NextResponse(new Uint8Array(out), {
      headers: {
        'content-type': CONTENT[to],
        'content-length': String(out.length),
        'x-original-format': meta.format || 'unknown',
        'x-original-size': String(buf.length),
        'cache-control': 'public, max-age=86400, immutable',
      },
    });
  } catch (e) {
    const msg = e instanceof Error && e.name === 'AbortError' ? 'Timeout mengunduh gambar.' : 'Gagal memproses gambar.';
    return err(msg, 500);
  }
}
