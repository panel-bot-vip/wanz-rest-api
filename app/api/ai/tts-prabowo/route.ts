import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * TTS suara Prabowo via Fish Audio API resmi (free tier s2.1-pro-free).
 * Butuh env FISH_API_KEY (server-side) -> pengguna tetap keyless.
 *
 * GET /api/ai/tts-prabowo?text=Halo%20dunia&format=mp3
 * (voice bisa di-override: &voice=<reference_id lain>)
 */

const API = 'https://api.fish.audio/v1/tts';
const PRABOWO = 'dd9f87ddfb434571a3f302bf686f1132'; // fish.audio/m/dd9f87ddfb434571a3f302bf686f1132/

function json(d: unknown, status = 200) {
  return NextResponse.json(d, { status });
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const text = (sp.get('text') ?? '').trim();
  if (!text) return json({ success: false, error: 'Param wajib: ?text=' }, 400);
  if (text.length > 2000) return json({ success: false, error: 'Teks terlalu panjang (maks 2000).' }, 400);

  const key = process.env.FISH_API_KEY;
  if (!key) return json({ success: false, error: 'FISH_API_KEY belum diatur di env Vercel.' }, 501);

  const voice = (sp.get('voice') ?? '').trim() || PRABOWO;
  const fmtParam = (sp.get('format') ?? 'mp3').toLowerCase();
  const format = fmtParam === 'wav' || fmtParam === 'opus' ? fmtParam : 'mp3';

  try {
    const res = await fetch(API, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        model: 's2.1-pro-free',
      },
      body: JSON.stringify({ text, reference_id: voice, format, latency: 'normal' }),
      signal: AbortSignal.timeout(55000),
    });

    if (res.status === 401) return json({ success: false, error: 'FISH_API_KEY tidak valid.' }, 401);
    if (res.status === 402) return json({ success: false, error: 'Kuota free tier fish.audio habis.' }, 402);
    if (res.status === 503) return json({ success: false, error: 'fish.audio load tinggi, coba lagi.' }, 503);
    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      return json({ success: false, error: `fish.audio error ${res.status}`, detail: detail.slice(0, 300) }, 502);
    }

    const buf = Buffer.from(await res.arrayBuffer());
    const ct = format === 'mp3' ? 'audio/mpeg' : format === 'wav' ? 'audio/wav' : 'audio/ogg';
    return new NextResponse(buf, {
      status: 200,
      headers: {
        'content-type': ct,
        'cache-control': 'public, max-age=86400',
        'x-voice': voice === PRABOWO ? 'prabowo' : 'custom',
      },
    });
  } catch {
    return json({ success: false, error: 'Timeout/gagal generate suara.' }, 504);
  }
}
