import { NextRequest, NextResponse } from 'next/server';

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';

function extractOg(html: string, name: string): string | null {
  const patterns = [
    new RegExp(`property="og:${name}"[^>]*?content="([^"]*)"`, 'i'),
    new RegExp(`content="([^"]*)"[^>]*?property="og:${name}"`, 'i'),
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m) return m[1];
  }
  return null;
}

function extractVideos(html: string): string[] {
  const normalized = html.replace(/\\\//g, '/');
  const matches = normalized.match(/https:\/\/v\d\.pinimg\.com\/videos\/[^\s"'<>]+\.mp4[^\s"'<>]*/gi) || [];
  const unique = matches.filter((v, i, a) => a.indexOf(v) === i);

  const rank = (u: string): number => {
    const w = u.match(/_(\d+)w\.mp4/i);
    let score = w ? parseInt(w[1], 10) : 0;
    if (/_t\d+\.mp4/i.test(u)) score -= 500; // klip preview, kualitas rendah
    return score;
  };
  return unique.sort((a, b) => rank(b) - rank(a));
}

export async function GET(req: NextRequest) {
  const start = Date.now();
  const url = req.nextUrl.searchParams.get('url')?.trim();

  if (!url) {
    return NextResponse.json(
      { success: false, error: 'Parameter url wajib diisi. Contoh: /api/dl/pinterest?url=https://www.pinterest.com/pin/123/' },
      { status: 400 }
    );
  }
  if (!/pinterest\.com|pin\.it/i.test(url)) {
    return NextResponse.json(
      { success: false, error: 'URL harus link Pinterest/Pin yang valid.' },
      { status: 400 }
    );
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'user-agent': UA, accept: 'text/html' },
      redirect: 'follow',
    }).finally(() => clearTimeout(timer));

    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: `Pin tidak ditemukan atau privat (HTTP ${res.status}).` },
        { status: res.status === 404 ? 404 : 502 }
      );
    }

    const html = await res.text();
    if (!/\/pin\//i.test(res.url) && !/pinterest\.com/i.test(res.url)) {
      return NextResponse.json(
        { success: false, error: 'URL tidak mengarah ke halaman Pin.' },
        { status: 400 }
      );
    }

    const title = extractOg(html, 'title');
    const description = extractOg(html, 'description');
    const cover = extractOg(html, 'image');
    const videos = extractVideos(html);

    if (videos.length === 0) {
      // Pin gambar: tetap berguna, balikin info + gambar resolusi penuh
      if (cover) {
        return NextResponse.json({
          success: true,
          type: 'image',
          title,
          description,
          cover,
          image: cover.replace(/\/\d+x\//, '/originals/'),
          ms: Date.now() - start,
        });
      }
      return NextResponse.json(
        { success: false, error: 'Tidak ada media di Pin ini (mungkin privat atau dihapus).' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      type: 'video',
      title,
      description,
      cover,
      video: videos[0],
      videos,
      ms: Date.now() - start,
    });
  } catch (err) {
    const timeout = err instanceof Error && err.name === 'AbortError';
    return NextResponse.json(
      { success: false, error: timeout ? 'Upstream timeout. Coba lagi.' : 'Gagal menghubungi Pinterest. Coba lagi.' },
      { status: 502 }
    );
  }
}
