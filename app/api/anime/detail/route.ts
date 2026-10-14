import { NextRequest, NextResponse } from 'next/server';
import { detailAnime } from '@/lib/anime';

export const runtime = 'nodejs';
export const maxDuration = 30;

function json(d: unknown, status = 200) {
  return NextResponse.json(d, { status });
}

/**
 * Detail anime via AniList (publik, tanpa key).
 * GET /api/anime/detail?id=20          (id = AniList id, dpt dari /anime/search)
 *
 * Kembali: judul, format, status, episode, skor, genre, cover, banner, sinopsis,
 *   studio, + streamingEpisodes (tautan nonton LEGAL per episode) & externalLinks.
 */
export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const id = (sp.get('id') ?? '').trim();
    if (!/^\d+$/.test(id)) {
      return json({ success: false, error: 'Param wajib: ?id= (angka AniList id).' }, 400);
    }
    const anime = await detailAnime(parseInt(id, 10));
    return json({ success: true, anime });
  } catch (e) {
    const err = e as Error & { status?: number };
    const status = err.status === 404 ? 404 : 502;
    return json({ success: false, error: err.message || 'Gagal memuat anime.' }, status);
  }
}
