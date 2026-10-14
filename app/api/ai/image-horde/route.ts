import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * Text-to-image UNLIMITED via Stable Horde (komunitas GPU crowd-source, keyless anonim).
 * Proses async: submit -> poll -> ambil hasil. Kita poll maksimal ~30 dtk.
 * Aman utk platform publik: nsfw dimatikan & censor diaktifkan.
 *
 * GET /api/ai/image-horde?prompt=kucing%20lucu&width=512&height=512&mode=raw
 */

const HORDE = 'https://stablehorde.net/api/v2';
const KEY = '0000000000'; // anonim (self-assigned, tanpa registrasi)
const UA = 'wanz-rest-api:1.0:(https://rest-api-wanz-codex.vercel.app)';

function json(d: unknown, status = 200) {
  return NextResponse.json(d, { status });
}
function clampNum(v: string | null, min: number, max: number, dflt: number): number {
  const n = v ? parseInt(v, 10) : NaN;
  if (!Number.isFinite(n)) return dflt;
  return Math.min(Math.max(n, min), max);
}
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function hordeHeaders(): Record<string, string> {
  return { apikey: KEY, 'Client-Agent': UA };
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const prompt = (sp.get('prompt') ?? '').trim();
  if (!prompt) return json({ success: false, error: 'Param wajib: ?prompt=' }, 400);
  if (prompt.length > 1000) return json({ success: false, error: 'Prompt terlalu panjang (maks 1000).' }, 400);

  const width = clampNum(sp.get('width'), 256, 768, 512);
  const height = clampNum(sp.get('height'), 256, 768, 512);
  const steps = clampNum(sp.get('steps'), 5, 30, 20);
  const mode = (sp.get('mode') ?? 'raw').toLowerCase();

  // 1) submit job
  let id: string;
  try {
    const sub = await fetch(`${HORDE}/generate/async`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...hordeHeaders() },
      body: JSON.stringify({
        prompt,
        params: { width, height, steps, n: 1, sampler_name: 'k_euler' },
        nsfw: false,
        unsafe: false,
        censor_nsfw: true,
        r2: true,
      }),
      signal: AbortSignal.timeout(15000),
    });
    if (!sub.ok) return json({ success: false, error: `Gagal submit Stable Horde (status ${sub.status}).` }, 502);
    const data = (await sub.json()) as { id?: string };
    if (!data.id) return json({ success: false, error: 'Stable Horde tidak mengembalikan id.' }, 502);
    id = data.id;
  } catch {
    return json({ success: false, error: 'Timeout submit ke Stable Horde.' }, 504);
  }

  // 2) poll sampai selesai (maks ~30 dtk)
  const deadline = Date.now() + 30000;
  let done = false;
  while (Date.now() < deadline) {
    await sleep(3000);
    try {
      const ck = await fetch(`${HORDE}/generate/check/${id}`, {
        headers: hordeHeaders(),
        signal: AbortSignal.timeout(10000),
      });
      if (ck.status === 404) break; // id kedaluwarsa
      if (ck.ok) {
        const d = (await ck.json()) as { done?: boolean };
        if (d.done) {
          done = true;
          break;
        }
      }
    } catch {
      /* lanjut poll */
    }
  }
  if (!done) {
    return json(
      { success: false, status: 'processing', id, error: 'Masih diproses/antri (timeout 30s). Coba lagi nanti.' },
      202,
    );
  }

  // 3) ambil hasil
  try {
    const st = await fetch(`${HORDE}/generate/status/${id}`, {
      headers: hordeHeaders(),
      signal: AbortSignal.timeout(15000),
    });
    const sd = (await st.json()) as { generations?: { img?: string; seed?: number }[] };
    const gen = sd.generations?.[0];
    if (!gen?.img) return json({ success: false, error: 'Hasil tidak ditemukan.' }, 502);

    if (mode === 'url') {
      return json({ success: true, source: 'stable-horde', prompt, seed: gen.seed, url: gen.img });
    }

    const r = await fetch(gen.img, { signal: AbortSignal.timeout(20000) });
    if (!r.ok) return json({ success: false, error: 'Gagal unduh hasil.' }, 502);
    const buf = Buffer.from(await r.arrayBuffer());
    return new NextResponse(buf, {
      status: 200,
      headers: {
        'content-type': r.headers.get('content-type') || 'image/webp',
        'cache-control': 'public, max-age=3600',
        'x-seed': String(gen.seed ?? ''),
      },
    });
  } catch {
    return json({ success: false, error: 'Gagal mengambil hasil.' }, 502);
  }
}
