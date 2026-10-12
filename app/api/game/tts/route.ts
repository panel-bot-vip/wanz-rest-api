import { NextResponse } from 'next/server';

const DATASET_URL =
  'https://raw.githubusercontent.com/BochilTeam/database/master/games/tekateki.json';

interface TTS {
  soal: string;
  jawaban: string;
}

let cache: { data: TTS[]; at: number } | null = null;
const CACHE_TTL = 6 * 60 * 60 * 1000; // 6 jam

async function getDataset(): Promise<TTS[]> {
  if (cache && Date.now() - cache.at < CACHE_TTL) return cache.data;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const res = await fetch(DATASET_URL, {
      signal: controller.signal,
      headers: { 'user-agent': 'WanzRESTAPI/1.0', accept: 'application/json' },
    });
    if (!res.ok) throw new Error('upstream_' + res.status);
    const json = await res.json();
    if (!Array.isArray(json) || json.length === 0) throw new Error('empty');
    cache = { data: json, at: Date.now() };
    return json;
  } finally {
    clearTimeout(timer);
  }
}

export async function GET() {
  const start = Date.now();
  try {
    const data = await getDataset();
    const item = data[Math.floor(Math.random() * data.length)];
    return NextResponse.json({
      success: true,
      total_soal: data.length,
      soal: item.soal,
      jawaban: item.jawaban,
      jumlah_huruf: item.jawaban.replace(/\s/g, '').length,
      ms: Date.now() - start,
    });
  } catch (err) {
    const timeout = err instanceof Error && err.name === 'AbortError';
    return NextResponse.json(
      { success: false, error: timeout ? 'Upstream timeout. Coba lagi.' : 'Gagal mengambil soal. Coba lagi.' },
      { status: 502 }
    );
  }
}
