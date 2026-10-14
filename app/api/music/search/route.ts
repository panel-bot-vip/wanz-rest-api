import { NextRequest, NextResponse } from 'next/server';
import { searchMusic } from '@/lib/music';

export const runtime = 'nodejs';
export const maxDuration = 30;

function json(d: unknown, status = 200) {
  return NextResponse.json(d, { status });
}

/**
 * Pencarian lagu via YouTube Music (innertube, tanpa API key).
 * GET /api/music/search?q=tulus&limit=10&filter=songs&lang=en&gl=US
 */
export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const q = (sp.get('q') ?? '').trim();
    if (!q) return json({ success: false, error: 'Param wajib: ?q=' }, 400);
    if (q.length > 150) return json({ success: false, error: 'Query terlalu panjang (maks 150).' }, 400);

    const limit = Math.min(Math.max(parseInt(sp.get('limit') ?? '10', 10) || 10, 1), 50);
    const f = sp.get('filter') ?? '';
    const filter = f === 'all' ? 'all' : 'songs';
    const l = sp.get('lang') ?? '';
    const lang = l === 'id' ? 'id' : 'en';
    const glRaw = (sp.get('gl') ?? 'US').toUpperCase();
    const gl = /^[A-Z]{2}$/.test(glRaw) ? glRaw : 'US';

    const { results } = await searchMusic(q, limit, filter, lang, gl);
    return json({ success: true, q, count: results.length, results });
  } catch (e) {
    return json({ success: false, error: (e as Error).message || 'Gagal mencari lagu.' }, 502);
  }
}
