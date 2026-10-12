import { NextRequest, NextResponse } from 'next/server';

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';

interface FoundLink {
  url: string;
  source: 'description' | 'bio' | 'bioLink';
  likely_preset: boolean;
}

function extractUniversal(html: string): any | null {
  const m = html.match(
    /<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__" type="application\/json">([\s\S]*?)<\/script>/
  );
  if (!m) return null;
  try {
    return JSON.parse(m[1]).__DEFAULT_SCOPE__ || null;
  } catch {
    return null;
  }
}

function extractUrls(text: string): string[] {
  const raw = text.match(/https?:\/\/[^\s"'<>()\]]+/gi) || [];
  const clean = raw
    .map((u) => u.replace(/[.,;!?'"`]+$/, ''))
    .filter((u) => u.length > 12);
  return clean.filter((u, i, a) => a.indexOf(u) === i);
}

function isPresetLink(url: string): boolean {
  return /alight|preset|\.pproj|effek|xml|template/i.test(url);
}

async function fetchHtml(url: string, timeoutMs: number): Promise<{ finalUrl: string; html: string } | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'user-agent': UA,
        accept: 'text/html,application/xhtml+xml',
        'accept-language': 'en-US,en;q=0.9',
      },
      redirect: 'follow',
    });
    if (!res.ok) return null;
    return { finalUrl: res.url, html: await res.text() };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function videoIdFromUrl(url: string): string | null {
  const m = url.match(/\/video\/(\d+)/);
  return m ? m[1] : null;
}

export async function GET(req: NextRequest) {
  const start = Date.now();
  const input = req.nextUrl.searchParams.get('url')?.trim();

  if (!input) {
    return NextResponse.json(
      { success: false, error: 'Parameter url wajib diisi. Contoh: /api/tools/amfinder?url=https://www.tiktok.com/@user/video/123' },
      { status: 400 }
    );
  }
  if (!/tiktok\.com/i.test(input)) {
    return NextResponse.json(
      { success: false, error: 'URL harus link TikTok yang valid.' },
      { status: 400 }
    );
  }

  // 1. Resolve short link (vt/vm/t) ke URL video penuh
  let videoUrl = input;
  if (!videoIdFromUrl(input)) {
    const resolved = await fetchHtml(input, 15000);
    if (resolved && videoIdFromUrl(resolved.finalUrl)) {
      videoUrl = resolved.finalUrl;
    } else {
      return NextResponse.json(
        { success: false, error: 'Gagal membaca link TikTok. Pastikan link video publik.' },
        { status: 400 }
      );
    }
  }
  const videoId = videoIdFromUrl(videoUrl);

  // 2. Scrape halaman video: deskripsi + author
  const videoPage = await fetchHtml(videoUrl, 20000);
  if (!videoPage) {
    return NextResponse.json(
      { success: false, error: 'Gagal membuka halaman video (mungkin privat/dihapus).' },
      { status: 502 }
    );
  }
  const scope = extractUniversal(videoPage.html);
  const item = scope?.['webapp.video-detail']?.itemInfo?.itemStruct;
  if (!item) {
    return NextResponse.json(
      { success: false, error: 'Gagal membaca data video. Pastikan video publik.' },
      { status: 502 }
    );
  }

  const links: FoundLink[] = [];
  const desc: string = item.desc || '';
  for (const u of extractUrls(desc)) {
    links.push({ url: u, source: 'description', likely_preset: isPresetLink(u) });
  }

  // 3. Scrape halaman author: bio + bioLink
  let bio: string | null = null;
  const uniqueId: string | null = item.author?.uniqueId || null;
  if (uniqueId) {
    const userPage = await fetchHtml(`https://www.tiktok.com/@${uniqueId}`, 20000);
    const userScope = userPage ? extractUniversal(userPage.html) : null;
    const user = userScope?.['webapp.user-detail']?.userInfo?.user;
    if (user) {
      bio = user.signature || null;
      if (bio) {
        for (const u of extractUrls(bio)) {
          links.push({ url: u, source: 'bio', likely_preset: isPresetLink(u) });
        }
      }
      const bioLink =
        typeof user.bioLink === 'string'
          ? user.bioLink
          : user.bioLink?.link || null;
      if (bioLink) {
        const clean = String(bioLink).replace(/[.,;!?'"`]+$/, '');
        if (clean.indexOf('http') === 0 && links.every((l) => l.url !== clean)) {
          links.push({ url: clean, source: 'bioLink', likely_preset: isPresetLink(clean) });
        }
      }
    }
  }

  const presets = links.filter((l) => l.likely_preset);
  const others = links.filter((l) => !l.likely_preset);

  return NextResponse.json({
    success: true,
    video: {
      id: videoId,
      author: item.author?.nickname || uniqueId || null,
      username: uniqueId,
      title: desc || null,
    },
    bio,
    sources: ['description', 'bio'],
    presets,
    other_links: others,
    total_links: links.length,
    ms: Date.now() - start,
  });
}
