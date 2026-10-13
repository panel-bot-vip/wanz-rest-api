import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 20;

/**
 * Arti nama — query database nama berinama.com lewat REST publik WP-nya
 * (wp/v2/baby_name?search=...). Direct query, TANPA lewat endpoint /llm mereka.
 *
 * GET /api/artinama?nama=ahmad
 */

const BASE = 'https://berinama.com/wp-json/wp/v2/baby_name';
const GENDER: Record<string, string> = {
  '4': 'Laki-Laki', '5': 'Perempuan', '114': 'Boy', '115': 'Girl', '116': 'Unisex',
};

function stripHtml(h: string): string {
  return h
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&#8217;|&rsquo;/gi, "'")
    .replace(/&#8220;|&#8221;|&ldquo;|&rdquo;/gi, '"')
    .replace(/&amp;/gi, '&')
    .replace(/&#8230;|&hellip;/gi, '...')
    .replace(/&#038;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const q = (sp.get('nama') ?? sp.get('q') ?? '').trim();
  if (!q) return NextResponse.json({ success: false, error: 'Param nama wajib diisi.' }, { status: 400 });
  if (q.length > 60) return NextResponse.json({ success: false, error: 'Nama terlalu panjang (maks 60).' }, { status: 400 });

  try {
    const res = await fetch(`${BASE}?search=${encodeURIComponent(q)}&per_page=20`, {
      headers: { accept: 'application/json', 'user-agent': 'wanz-rest-api/1.0' },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return NextResponse.json({ success: false, error: 'Gagal mengambil data berinama.' }, { status: 502 });

    const items: unknown = await res.json();
    const arr = Array.isArray(items) ? items : [];

    const results = arr
      .map((raw) => {
        const p = raw as Record<string, any>;
        const nama = stripHtml(String(p?.title?.rendered ?? ''));
        const arti = stripHtml(String(p?.content?.rendered ?? ''));
        const jk = Array.isArray(p?.baby_gender)
          ? (p.baby_gender as unknown[]).map((id) => GENDER[String(id)]).filter(Boolean)
          : [];
        return { nama, arti, jenisKelamin: jk, slug: p?.slug, link: p?.link };
      })
      .filter((r) => r.nama && r.arti);

    // prioritas: exact match judul dulu, lalu yang paling pendek/pekatan
    const lower = q.toLowerCase();
    results.sort((a, b) => {
      const ax = a.nama.toLowerCase() === lower ? 0 : 1;
      const bx = b.nama.toLowerCase() === lower ? 0 : 1;
      if (ax !== bx) return ax - bx;
      return a.nama.length - b.nama.length;
    });

    return NextResponse.json({
      success: true,
      query: q,
      count: results.length,
      results: results.slice(0, 15),
    });
  } catch (e) {
    const msg = e instanceof Error && e.name === 'TimeoutError' ? 'Timeout mengambil data.' : 'Kesalahan server arti nama.';
    return NextResponse.json({ success: false, error: msg }, { status: 504 });
  }
}
