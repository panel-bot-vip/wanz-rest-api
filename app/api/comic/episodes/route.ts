import { NextRequest, NextResponse } from 'next/server';
import { episodesWebtoon, episodesKomiku, type ComicEpisode } from '@/lib/comic';

export const runtime = 'nodejs';
export const maxDuration = 30;

function json(d: unknown, status = 200) {
  return NextResponse.json(d, { status });
}

/**
 * Daftar episode/chapter sebuah judul.
 *
 * GET /api/comic/episodes?site=webtoon&id=2159          (id = titleNo)
 * GET /api/comic/episodes?site=komiku&id=one-piece       (id = manga slug)
 *   webtoon: &pageSize=50 (1-200), &cursor=0 (offset), &lang=en|id  -> nextCursor utk lanjut
 *   komiku : kembalikan series{title,cover} + episodes urut naik
 *
 * Tiap episode punya `ref` -> dikirim balik ke /api/comic/read?ref=
 *   webtoon: ref = viewerLink (ada ? & -> WAJIB di-encode pakai encodeURIComponent)
 *   komiku : ref = path chapter (aman, tanpa encoding)
 */
export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const site = (sp.get('site') ?? '').toLowerCase();
    const id = (sp.get('id') ?? '').trim();
    if (!id) return json({ success: false, error: 'Param wajib: ?id=' }, 400);
    if (!['webtoon', 'komiku'].includes(site)) {
      return json({ success: false, error: 'site harus webtoon atau komiku' }, 400);
    }

    if (site === 'webtoon') {
      if (!/^\d+$/.test(id)) {
        return json({ success: false, error: 'id webtoon = titleNo (angka), mis. 2159' }, 400);
      }
      const pageSize = Math.min(Math.max(parseInt(sp.get('pageSize') ?? '50', 10) || 50, 1), 200);
      const cursor = Math.max(parseInt(sp.get('cursor') ?? '0', 10) || 0, 0);
      const lang = (sp.get('lang') ?? 'en').toLowerCase();
      const { episodes, nextCursor } = await episodesWebtoon(id, pageSize, cursor, lang);
      if (!episodes.length) return json({ success: false, error: 'Episode tidak ditemukan.' }, 404);
      return json({
        success: true,
        site,
        id,
        count: episodes.length,
        nextCursor,
        episodes,
      });
    }

    // komiku
    if (!/^[a-z0-9][a-z0-9-]*$/i.test(id)) {
      return json({ success: false, error: 'id komiku = slug manga (huruf/angka/dash).' }, 400);
    }
    const { series, episodes } = await episodesKomiku(id);
    if (!episodes.length) return json({ success: false, error: 'Chapter tidak ditemukan.' }, 404);
    return json({
      success: true,
      site,
      id,
      series,
      count: episodes.length,
      episodes: episodes as ComicEpisode[],
    });
  } catch (e) {
    const err = e as Error & { status?: number };
    const status = err.status === 404 ? 404 : 502;
    return json({ success: false, error: err.message || 'Gagal memuat episode.' }, status);
  }
}
