import { NextRequest, NextResponse } from 'next/server';

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';

// Scrape langsung halaman TikTok (tanpa API pihak ketiga).
// Video publik menyertakan JSON __UNIVERSAL_DATA_FOR_REHYDRATION__ di HTML.
function extractItem(html: string): Record<string, any> | null {
  const m = html.match(
    /<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__" type="application\/json">([\s\S]*?)<\/script>/
  );
  if (!m) return null;
  try {
    const data = JSON.parse(m[1]);
    const item = data?.__DEFAULT_SCOPE__?.['webapp.video-detail']?.itemInfo?.itemStruct;
    return item && item.id ? item : null;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const start = Date.now();
  const url = req.nextUrl.searchParams.get('url')?.trim();

  if (!url) {
    return NextResponse.json(
      { success: false, error: 'Parameter url wajib diisi. Contoh: /api/dl/tiktok?url=https://www.tiktok.com/@user/video/123' },
      { status: 400 }
    );
  }
  if (!/tiktok\.com\/@[^/]+\/video\/\d+|tiktok\.com\/t\/[A-Za-z0-9]+|vt\.tiktok\.com\/[A-Za-z0-9]+/i.test(url)) {
    return NextResponse.json(
      { success: false, error: 'URL harus link video TikTok yang valid.' },
      { status: 400 }
    );
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'user-agent': UA,
        accept: 'text/html,application/xhtml+xml',
        'accept-language': 'en-US,en;q=0.9',
      },
      redirect: 'follow',
    }).finally(() => clearTimeout(timer));

    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: `Video tidak ditemukan atau privat (HTTP ${res.status}).` },
        { status: res.status === 404 ? 404 : 502 }
      );
    }

    const html = await res.text();
    const item = extractItem(html);

    if (!item) {
      const blocked = /captcha|verify-page|loginRequired/i.test(html);
      return NextResponse.json(
        {
          success: false,
          error: blocked
            ? 'TikTok memblokir request server saat ini. Coba lagi nanti.'
            : 'Gagal membaca data video. Pastikan video publik dan URL benar.',
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      id: String(item.id),
      title: item.desc ?? null,
      author: item.author?.nickname ?? item.author?.uniqueId ?? null,
      author_avatar: item.author?.avatarLarger || item.author?.avatarMedium || null,
      duration: item.video?.duration ?? null,
      cover: item.video?.originCover || item.video?.cover || null,
      play: item.video?.playAddr || null,
      play_watermark: item.video?.downloadAddr || null,
      music: item.music?.playUrl || null,
      music_title: item.music?.title || null,
      play_count: item.stats?.playCount ?? null,
      like_count: item.stats?.diggCount ?? null,
      comment_count: item.stats?.commentCount ?? null,
      share_count: item.stats?.shareCount ?? null,
      ms: Date.now() - start,
    });
  } catch (err) {
    const timeout = err instanceof Error && err.name === 'AbortError';
    return NextResponse.json(
      { success: false, error: timeout ? 'Upstream timeout. Coba lagi.' : 'Gagal menghubungi TikTok. Coba lagi.' },
      { status: 502 }
    );
  }
}
