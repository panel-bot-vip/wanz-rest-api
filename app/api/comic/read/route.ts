import { NextRequest, NextResponse } from 'next/server';
import {
  safeRef,
  readWebtoon,
  readKomiku,
  resolveWebtoonViewer,
} from '@/lib/comic';

export const runtime = 'nodejs';
export const maxDuration = 40;

function json(d: unknown, status = 200) {
  return NextResponse.json(d, { status });
}

/**
 * Ambil gambar sebuah episode/chapter (urut baca).
 *
 * Komiku (ref aman, tanpa encoding):
 *   GET /api/comic/read?site=komiku&ref=/the-magic-towers-problem-child-chapter-66/
 *
 * Webtoons — pilih salah satu:
 *   A) ref dari /episodes (viewerLink, berisi ? & -> encode dulu):
 *      GET /api/comic/read?site=webtoon&ref=%2Fen%2F...%2Fviewer%3Ftitle_no%3D2159%26episode_no%3D1
 *   B) id + ep (praktis, resolve viewerLink otomatis):
 *      GET /api/comic/read?site=webtoon&id=2159&ep=1
 *
 * Guard SSRF: ref harus path relatif (kita prepend domain tepercaya).
 */
export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const site = (sp.get('site') ?? '').toLowerCase();
    if (!['webtoon', 'komiku'].includes(site)) {
      return json({ success: false, error: 'site harus webtoon atau komiku' }, 400);
    }

    if (site === 'komiku') {
      const ref = safeRef((sp.get('ref') ?? '').trim());
      if (!ref) return json({ success: false, error: 'Param ref tidak valid (harus path /...).' }, 400);
      const { title, images } = await readKomiku(ref);
      return json({ success: true, site, title, count: images.length, images });
    }

    // webtoon
    const refParam = (sp.get('ref') ?? '').trim();
    const id = (sp.get('id') ?? '').trim();
    const epRaw = (sp.get('ep') ?? '').trim();
    const lang = (sp.get('lang') ?? 'en').toLowerCase();

    let ref: string | null = null;
    if (refParam) {
      ref = safeRef(refParam);
      if (!ref) return json({ success: false, error: 'Param ref tidak valid (harus path /...).' }, 400);
    } else if (id && epRaw) {
      if (!/^\d+$/.test(id) || !/^\d+$/.test(epRaw)) {
        return json({ success: false, error: 'id & ep harus angka (titleNo & episodeNo).' }, 400);
      }
      ref = await resolveWebtoonViewer(id, parseInt(epRaw, 10), lang);
    } else {
      return json(
        { success: false, error: 'Butuh ?ref= atau ?id=&ep= untuk webtoon.' },
        400,
      );
    }

    const { title, episode, images } = await readWebtoon(ref);
    return json({ success: true, site, title, episode, count: images.length, images });
  } catch (e) {
    const err = e as Error & { status?: number };
    const status = err.status === 404 ? 404 : 502;
    return json({ success: false, error: err.message || 'Gagal memuat gambar.' }, status);
  }
}
