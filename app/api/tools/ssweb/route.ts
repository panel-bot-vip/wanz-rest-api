import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

function normalizeUrl(raw: string): string | null {
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

/**
 * Screenshot Web — lempar URL ke layanan screenshot publik gratis (mshots),
 * lalu stream gambarnya balik. Tanpa API key.
 */
export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get('url')?.trim() || '';
  const width = Math.min(Math.max(parseInt(req.nextUrl.searchParams.get('w') || '1280', 10) || 1280, 320), 1920);

  if (!raw) {
    return NextResponse.json(
      { success: false, error: 'Parameter url wajib diisi. Contoh: /api/tools/ssweb?url=google.com' },
      { status: 400 }
    );
  }
  const url = normalizeUrl(raw);
  if (!url) {
    return NextResponse.json({ success: false, error: 'URL tidak valid.' }, { status: 400 });
  }

  const target = `https://s.wordpress.com/mshots/v1/${encodeURIComponent(url)}?w=${width}`;

  try {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 25000);
    const res = await fetch(target, { redirect: 'follow', signal: ctl.signal }).finally(() => clearTimeout(t));

    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: `Layanan screenshot gagal (kode ${res.status}). Coba lagi.` },
        { status: 502 }
      );
    }

    const bytes = await res.arrayBuffer();
    return new NextResponse(bytes, {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=3600',
        'X-Wanz-Origin': 'wanz-rest-api',
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil screenshot. Situs mungkin lambat atau timeout.' },
      { status: 502 }
    );
  }
}
