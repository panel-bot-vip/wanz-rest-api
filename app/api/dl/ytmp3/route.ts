import { NextRequest, NextResponse } from 'next/server';
import {
  extractVideoId,
  getVideo,
  baseInfo,
  decipherFormat,
  pickProgressive,
} from '@/lib/yt';

// Catatan jujur: trek audio-only YouTube kini wajib PO Token (verifikasi
// login/BotGuard) sehingga tidak tersedia server-side. Endpoint ini
// mengembalikan file MP4 progresif (itag 18) yang MEMUAT trek audio lengkap.
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

  try {
    const { yt, info } = await getVideo(id);
    const fmt = pickProgressive(info);
    if (!fmt) {
      return NextResponse.json(
        { success: false, error: 'Tidak ada file yang bisa diunduh untuk video ini (live/premiere/privat).' },
        { status: 404 }
      );
    }
    const url = await decipherFormat(yt, fmt);
    const mime: string = String(fmt.mime_type || 'video/mp4').split(';')[0];
    return NextResponse.json({
      success: true,
      ...baseInfo(info, id),
      format: 'mp4',
      mime,
      quality: fmt.quality_label || null,
      url,
      note: 'Audio-only butuh login (PO Token) jadi tidak tersedia; file MP4 ini memuat audio lengkap dan bisa diekstrak.',
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
