import { NextRequest, NextResponse } from 'next/server';
import {
  extractVideoId,
  getVideo,
  baseInfo,
  decipherFormat,
  pickProgressive,
} from '@/lib/yt';

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';
const CNV_FETCH = 'https://cnvmp3.com/fetch.php';

// Primer: scrape web konverter (MP3 beneran). Gagal → fallback MP4 itag 18.
async function tryConverter(videoUrl: string): Promise<{ url: string; filename: string } | null> {
  for (let attempt = 0; attempt < 4; attempt++) {
    if (attempt > 0) await new Promise((r) => setTimeout(r, 5000));
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 25000);
    try {
      const res = await fetch(CNV_FETCH, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'user-agent': UA,
          accept: 'application/json',
          'content-type': 'application/json',
          referer: 'https://cnvmp3.com/v55',
        },
        body: JSON.stringify({
          url: videoUrl,
          downloadMode: 'audio',
          filenameStyle: 'basic',
          audioBitrate: '96',
        }),
      });
      const json = await res.json().catch(() => null);
      if (json && json.status === 'tunnel' && json.url) {
        return { url: String(json.url), filename: String(json.filename || 'audio.mp3') };
      }
      // status rate-limit/processing → coba lagi; status lain → berhenti
      if (!json || (json.status !== 'rate-limit' && json.status !== 'processing' && json.status !== 'queued')) {
        return null;
      }
    } catch {
      return null;
    } finally {
      clearTimeout(timer);
    }
  }
  return null;
}

export async function GET(req: NextRequest) {
  const start = Date.now();
  const input = req.nextUrl.searchParams.get('url')?.trim();

  if (!input) {
    return NextResponse.json(
      { success: false, error: 'Parameter url wajib diisi. Contoh: /api/dl/ytmp3?url=https://youtu.be/xxxx' },
      { status: 400 }
    );
  }
  const id = extractVideoId(input);
  if (!id) {
    return NextResponse.json(
      { success: false, error: 'URL/ID YouTube tidak valid.' },
      { status: 400 }
    );
  }
  const watchUrl = `https://www.youtube.com/watch?v=${id}`;

  try {
    const { yt, info } = await getVideo(id);
    const basic = baseInfo(info, id);

    const conv = await tryConverter(watchUrl);
    if (conv) {
      return NextResponse.json({
        success: true,
        ...basic,
        format: 'mp3',
        mime: 'audio/mpeg',
        filename: conv.filename,
        url: conv.url,
        ms: Date.now() - start,
      });
    }

    // Fallback jujur: MP4 progresif yang memuat audio lengkap.
    const fmt = pickProgressive(info);
    if (!fmt) {
      return NextResponse.json(
        { success: false, error: 'Konverter sibuk dan tidak ada file fallback. Coba lagi nanti.' },
        { status: 502 }
      );
    }
    const url = await decipherFormat(yt, fmt);
    return NextResponse.json({
      success: true,
      ...basic,
      format: 'mp4',
      mime: String(fmt.mime_type || 'video/mp4').split(';')[0],
      quality: fmt.quality_label || null,
      url,
      note: 'Konverter MP3 sibuk; file MP4 ini memuat audio lengkap dan bisa diekstrak.',
      ms: Date.now() - start,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    if (msg === 'no_stream' || msg === 'no_info') {
      return NextResponse.json(
        { success: false, error: 'Video tidak ditemukan, privat, atau butuh login (umur/region).' },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil audio. Coba lagi.' },
      { status: 502 }
    );
  }
}
