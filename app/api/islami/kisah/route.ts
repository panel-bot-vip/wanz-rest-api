import { NextRequest, NextResponse } from 'next/server';

const DATASET_URL =
  'https://raw.githubusercontent.com/AzharRivaldi/Kisah-25-Nabi/master/Kisah25Nabi/app/src/main/assets/kisahnabi.json';

interface Kisah {
  name: string;
  thn_kelahiran?: string;
  usia?: string;
  description: string;
}

const NABI_LIST = [
  'adam', 'idris', 'nuh', 'hud', 'sholeh', 'ibrahim', 'ismail', 'luth',
  'ishaq', 'yaqub', 'yusuf', 'syuaib', 'ayyub', 'dzulkifli', 'musa',
  'harun', 'daud', 'sulaiman', 'ilyas', 'ilyasa', 'yunus', 'zakariya',
  'yahya', 'isa', 'muhammad',
];

let cache: Kisah[] | null = null;

async function getDataset(): Promise<Kisah[]> {
  if (cache) return cache;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25000);
  try {
    const res = await fetch(DATASET_URL, {
      signal: controller.signal,
      headers: { 'user-agent': 'WanzRESTAPI/1.0', accept: 'application/json' },
    });
    if (!res.ok) throw new Error('upstream_' + res.status);
    const json = await res.json();
    if (!Array.isArray(json) || json.length === 0) throw new Error('empty');
    cache = json;
    return json;
  } finally {
    clearTimeout(timer);
  }
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/nabi|as\b|saw|\(part \d+\)/g, '')
    .replace(/['\s]/g, '');
}

export async function GET(req: NextRequest) {
  const start = Date.now();
  const q = (req.nextUrl.searchParams.get('nabi') || '').trim();

  try {
    const data = await getDataset();

    if (!q) {
      return NextResponse.json({
        success: true,
        daftar_nabi: NABI_LIST,
        total_kisah: data.length,
        contoh: '/api/islami/kisah?nabi=musa',
        ms: Date.now() - start,
      });
    }

    const nq = normalize(q);
    const matched = data.filter((k) => {
      const nk = normalize(k.name);
      return nk.indexOf(nq) !== -1 || nq.indexOf(nk) !== -1;
    });

    if (matched.length === 0) {
      return NextResponse.json(
        { success: false, error: `Kisah "${q}" tidak ditemukan. Lihat daftar: /api/islami/kisah (tanpa parameter).` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      query: q,
      count: matched.length,
      results: matched.map((k) => ({
        name: k.name,
        thn_kelahiran: k.thn_kelahiran || null,
        usia: k.usia || null,
        description: k.description,
      })),
      ms: Date.now() - start,
    });
  } catch (err) {
    const timeout = err instanceof Error && err.name === 'AbortError';
    return NextResponse.json(
      { success: false, error: timeout ? 'Upstream timeout. Coba lagi.' : 'Gagal mengambil kisah. Coba lagi.' },
      { status: 502 }
    );
  }
}
