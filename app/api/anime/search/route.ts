import { NextRequest, NextResponse } from 'next/server';
import { searchAnime } from '@/lib/anime';

export const runtime = 'nodejs';
export const maxDuration = 30;

function json(d: unknown, status = 200) {
  return NextResponse.json(d, { status });
}

const SORTS = ['SEARCH_MATCH', 'POPULARITY', 'SCORE', 'START_DATE', 'FAVOURITES', 'EPISODES'];

/**
 * Pencarian anime via AniList (publik, tanpa key).
 * GET /api/anime/search?q=naruto&limit=10&page=1&sort=SEARCH_MATCH&adult=0
 *   sort: SEARCH_MATCH|POPULARITY|SCORE|START_DATE|FAVOURITES|EPISODES
 *   adult: set "1" utk ikutkan konten dewasa (default: difilter)
 */
export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const q = (sp.get('q') ?? '').trim();
    if (!q) return json({ success: false, error: 'Param wajib: ?q=' }, 400);
    if (q.length > 100) return json({ success: false, error: 'Query terlalu panjang (maks 100).' }, 400);

    const limit = Math.min(Math.max(parseInt(sp.get('limit') ?? '10', 10) || 10, 1), 25);
    const page = Math.max(parseInt(sp.get('page') ?? '1', 10) || 1, 1);
    const sortRaw = (sp.get('sort') ?? 'SEARCH_MATCH').toUpperCase();
    const sort = SORTS.includes(sortRaw) ? sortRaw : 'SEARCH_MATCH';
    const isAdult = sp.get('adult') === '1'; // default false (filter NSFW)

    const { results, pageInfo } = await searchAnime(q, limit, page, sort, isAdult);

    return json({ success: true, q, count: results.length, page: pageInfo, results });
  } catch (e) {
    return json({ success: false, error: (e as Error).message || 'Gagal mencari anime.' }, 502);
  }
}
