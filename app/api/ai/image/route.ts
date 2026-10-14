import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * Text-to-image via Pollinations (exception resmi platform, keyless).
 * Catatan: Pollinions punya kuota per-IP -> pakai ?mode=url agar tiap
 * klien generate dari IP sendiri (lebih tahan batas).
 *
 * GET /api/ai/image?prompt=kucing%20lucu&width=1024&height=1024&mode=raw
 */

function json(d: unknown, status = 200) {
  return NextResponse.json(d, { status });
}
function clampNum(v: string | null, min: number, max: number, dflt: number): number {
  const n = v ? parseInt(v, 10) : NaN;
  if (!Number.isFinite(n)) return dflt;
  return Math.min(Math.max(n, min), max);
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const prompt = (sp.get('prompt') ?? '').trim();
  if (!prompt) return json({ success: false, error: 'Param wajib: ?prompt=' }, 400);
  if (prompt.length > 1000) return json({ success: false, error: 'Prompt terlalu panjang (maks 1000).' }, 400);

  const width = clampNum(sp.get('width'), 256, 2048, 1024);
  const height = clampNum(sp.get('height'), 256, 2048, 1024);
  const seed = sp.get('seed') ? clampNum(sp.get('seed'), 0, 2 ** 31 - 1, 0) : Math.floor(Math.random() * 1e9);
  const nologo = sp.get('nologo') !== 'false';
  const mode = (sp.get('mode') ?? 'raw').toLowerCase();

  const url = new URL(`https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}`);
  url.searchParams.set('width', String(width));
  url.searchParams.set('height', String(height));
  url.searchParams.set('seed', String(seed));
  url.searchParams.set('nologo', nologo ? 'true' : 'false');
  url.searchParams.set('referrer', 'wanz-rest-api');

  if (mode === 'url') {
    return json({ success: true, source: 'pollinations', prompt, seed, width, height, url: url.toString() });
  }

  try {
    const t0 = Date.now();
    const res = await fetch(url.toString(), {
      headers: { 'user-agent': 'Mozilla/5.0' },
      redirect: 'follow',
      signal: AbortSignal.timeout(50000),
    });
    if (res.status === 402) {
      return json(
        {
          success: false,
          error: 'Kuota Pollinations utk IP ini habis. Coba lagi nanti, pakai ?mode=url, atau pakai /api/ai/image-horde.',
        },
        402,
      );
    }
    if (!res.ok) return json({ success: false, error: `Pollinations error (status ${res.status}).` }, 502);

    const buf = Buffer.from(await res.arrayBuffer());
    return new NextResponse(buf, {
      status: 200,
      headers: {
        'content-type': res.headers.get('content-type') || 'image/jpeg',
        'cache-control': 'public, max-age=3600',
        'x-seed': String(seed),
        'x-generation-ms': String(Date.now() - t0),
      },
    });
  } catch {
    return json({ success: false, error: 'Timeout/gagal generate gambar.' }, 504);
  }
}
