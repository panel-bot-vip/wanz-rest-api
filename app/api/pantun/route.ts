import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 30;

/**
 * Pantun Indonesia acak dari dataset "Sampiran" (ir-nlp-csui/sampiran, AGPL/CC).
 * Dataset di-fetch SAAT RUNTIME dari repo aslinya — TIDAK disalin ke repo kita
 * (mematuhi syarat lisensi: "no copy of this dataset in your repository").
 * Sumber: https://github.com/ir-nlp-csui/sampiran (cite: Siallagan & Alfina, 2023).
 *
 * GET /api/pantun?n=3&q=jodoh
 */

const SRC = 'https://raw.githubusercontent.com/ir-nlp-csui/sampiran/main/sampiran.txt';
type Pantun = [string, string, string, string];

const RE =
  /<BOS>\s*([\s\S]*?)\s*<CLS>\s*([\s\S]*?)\s*<CONTENT>\s*([\s\S]*?)\s*<CLS>\s*([\s\S]*?)\s*<EOS>/;

let cache: { data: Pantun[]; at: number } | null = null;
const TTL = 60 * 60 * 1000; // cache in-memory 1 jam per instance

async function load(): Promise<Pantun[]> {
  if (cache && Date.now() - cache.at < TTL) return cache.data;
  const res = await fetch(SRC, {
    signal: AbortSignal.timeout(20000),
    headers: { 'user-agent': 'wanz-rest-api/1.0' },
  });
  if (!res.ok) throw new Error('Gagal memuat dataset pantun.');
  const text = await res.text();
  const out: Pantun[] = [];
  for (const line of text.split('\n')) {
    const m = line.match(RE);
    if (m) out.push([m[1].trim(), m[2].trim(), m[3].trim(), m[4].trim()]);
  }
  if (!out.length) throw new Error('Dataset pantun kosong.');
  cache = { data: out, at: Date.now() };
  return out;
}

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const n = Math.min(Math.max(parseInt(sp.get('n') ?? '1', 10) || 1, 1), 20);
    const q = (sp.get('q') ?? '').trim().toLowerCase();

    let data = await load();
    if (q) data = data.filter((t) => t.join(' ').toLowerCase().includes(q));
    if (!data.length) {
      return NextResponse.json({ success: false, error: 'Pantun tidak ditemukan.' }, { status: 404 });
    }

    const picked: Pantun[] = [];
    const used = new Set<number>();
    while (picked.length < n && used.size < data.length) {
      const i = Math.floor(Math.random() * data.length);
      if (used.has(i)) continue;
      used.add(i);
      picked.push(data[i]);
    }

    const toObj = (t: Pantun) => ({ sampiran: [t[0], t[1]], isi: [t[2], t[3]], lines: t });
    return NextResponse.json({
      success: true,
      count: picked.length,
      total: data.length,
      source: 'github.com/ir-nlp-csui/sampiran',
      cite: 'Siallagan & Alfina (2023), Poetry Generation for Indonesian Pantun',
      pantun: n === 1 ? toObj(picked[0]) : picked.map(toObj),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Gagal memuat pantun.';
    return NextResponse.json({ success: false, error: msg }, { status: 502 });
  }
}
