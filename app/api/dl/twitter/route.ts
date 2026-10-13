import { NextRequest, NextResponse } from 'next/server';
import zlib from 'zlib';

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';

// Token sindikasi X = CRC32(id + lang + "TWEET_RESULT_NO_COOKIES") (hex).
function syndicationToken(id: string, lang: string): string {
  return (zlib.crc32(Buffer.from(id + lang + 'TWEET_RESULT_NO_COOKIES')) >>> 0).toString(16);
}

function extractStatusId(input: string): string | null {
  const s = (input || '').trim();
  if (/^\d{5,25}$/.test(s)) return s;
  const m = s.match(/(?:twitter\.com|x\.com|fxtwitter\.com|vxtwitter\.com|mobile\.twitter\.com)\/[^/]+\/status\/(\d{5,25})/);
  return m ? m[1] : null;
}

export async function GET(req: NextRequest) {
  const start = Date.now();
  const input = req.nextUrl.searchParams.get('url')?.trim() || req.nextUrl.searchParams.get('id')?.trim();

  if (!input) {
    return NextResponse.json(
      { success: false, error: 'Parameter url wajib diisi. Contoh: /api/dl/twitter?url=https://x.com/user/status/123...' },
      { status: 400 }
    );
  }
  const id = extractStatusId(input);
  if (!id) {
    return NextResponse.json(
      { success: false, error: 'Link tweet tidak valid. Format: https://x.com/user/status/ID' },
      { status: 400 }
    );
  }

  try {
    const lang = 'en';
    const token = syndicationToken(id, lang);
    const api = `https://cdn.syndication.twimg.com/tweet-result?id=${id}&lang=${lang}&token=${token}`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);
    const res = await fetch(api, {
      signal: controller.signal,
      headers: { 'user-agent': UA, accept: 'application/json' },
    }).finally(() => clearTimeout(timer));

    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: res.status === 404 ? 'Tweet tidak ditemukan (dihapus/privat).' : 'X menolak permintaan. Coba lagi.' },
        { status: res.status === 404 ? 404 : 502 }
      );
    }
    const data: any = await res.json().catch(() => null);
    if (!data || !data.id_str) {
      return NextResponse.json({ success: false, error: 'Tweet tidak ditemukan (dihapus/privat).' }, { status: 404 });
    }

    const user = data.user || {};
    const media: any[] = Array.isArray(data.mediaDetails) ? data.mediaDetails : [];
    const photos: string[] = [];
    const videos: Array<{ quality: string; url: string }> = [];

    media.forEach((m) => {
      if (m.type === 'photo') {
        if (m.media_url_https && photos.indexOf(m.media_url_https) === -1) photos.push(m.media_url_https);
      } else {
        const vi = m.video_info || {};
        const variants: any[] = Array.isArray(vi.variants) ? vi.variants : [];
        variants.forEach((v) => {
          if (v.content_type === 'video/mp4' && v.url) {
            videos.push({ quality: v.bitrate ? `${v.bitrate}p` : 'mp4', url: String(v.url) });
          }
        });
      }
    });

    videos.sort((a, b) => parseInt(b.quality, 10) - parseInt(a.quality, 10));

    const videoUrl = videos.length > 0 ? videos[0].url : null;

    return NextResponse.json({
      success: true,
      id: data.id_str,
      url: data.url || `https://x.com/${user.screen_name}/status/${id}`,
      text: data.text || '',
      author: {
        name: user.name || null,
        username: user.screen_name || null,
        avatar: user.profile_image_url_https || null,
        verified: !!user.is_blue_verified,
      },
      created_at: data.created_at || null,
      likes: typeof data.favorite_count === 'number' ? data.favorite_count : null,
      photos,
      video: videoUrl,
      videos,
      ms: Date.now() - start,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    if (msg.indexOf('abort') !== -1) {
      return NextResponse.json({ success: false, error: 'X lambat merespons. Coba lagi.' }, { status: 504 });
    }
    return NextResponse.json({ success: false, error: 'Gagal mengambil tweet. Coba lagi.' }, { status: 502 });
  }
}
