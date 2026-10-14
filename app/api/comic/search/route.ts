import { NextRequest, NextResponse } from 'next/server';
import { searchWebtoon, searchKomiku, type ComicItem } from '@/lib/comic';

export const runtime = 'nodejs';
export const maxDuration = 30;

function json(d: unknown, status = 200) {
  return NextResponse.json(d, { status });
}

/**
 * Pencarian judul komik: Webtoons + Komiku.
 *
 * GET /api/comic/search?q=lookism&site=webtoon|komiku|all&limit=10
 *   webtoon: &searchType=ALL|WEBTOON|CHALLENGE (default ALL), &start=1 (halaman), &lang=en|id
 *   komiku : hasil via WP REST (judul + link; cover ada di /episodes)
 */
export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const q = (sp.get('q') ?? '').trim();
    if (!q) return json({ success: false, error: 'Param wajib: ?q=' }, 400);
    if (q.length > 100) return json({ success: false, error: 'Query terlalu panjang (maks 100).' }, 400);

    const site = (sp.get('site') ?? 'webtoon').toLowerCase();
    const limit = Math.min(Math.max(parseInt(sp.get('limit') ?? '10', 10) || 10, 1), 50);

    const valid = ['webtoon', 'komiku', 'all'];
    if (!valid.includes(site)) {
      return json({ success: false, error: `site harus salah satu: ${valid.join(', ')}` }, 400);
    }

    const lang = (sp.get('lang') ?? 'en').toLowerCase();
    const searchTypeRaw = (sp.get('searchType') ?? 'ALL').toUpperCase();
    const searchType = ['ALL', 'WEBTOON', 'CHALLENGE'].includes(searchTypeRaw)
      ? searchTypeRaw
      : 'ALL';
    const start = Math.max(parseInt(sp.get('start') ?? '1', 10) || 1, 1);

    const runWebtoon = site === 'webtoon' || site === 'all';
    const runKomiku = site === 'komiku' || site === 'all';

    const results: ComicItem[] = [];
    const errors: string[] = [];

    if (runWebtoon) {
      try {
        results.push(...(await searchWebtoon(q, searchType, start, limit, lang)));
      } catch (e) {
        errors.push(`webtoon: ${(e as Error).message}`);
      }
    }
    if (runKomiku) {
      try {
        results.push(...(await searchKomiku(q, limit)));
      } catch (e) {
        errors.push(`komiku: ${(e as Error).message}`);
      }
    }

    if (!results.length && errors.length) {
      return json({ success: false, error: 'Gagal mencari.', detail: errors }, 502);
    }

    return json({
      success: true,
      q,
      site,
      count: results.length,
      results: results.slice(0, limit),
      ...(errors.length ? { partialErrors: errors } : {}),
    });
  } catch (e) {
    return json({ success: false, error: (e as Error).message || 'Gagal mencari.' }, 500);
  }
}
