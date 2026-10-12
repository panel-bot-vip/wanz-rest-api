import { NextRequest, NextResponse } from 'next/server';

const KOTA_URL = 'https://api.myquran.com/v2/sholat/kota/semua';

interface Kota {
  id: string;
  lokasi: string;
}

let kotaCache: { data: Kota[]; at: number } | null = null;
const KOTA_TTL = 24 * 60 * 60 * 1000; // 24 jam

async function getKotaList(): Promise<Kota[]> {
  if (kotaCache && Date.now() - kotaCache.at < KOTA_TTL) return kotaCache.data;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const res = await fetch(KOTA_URL, {
      signal: controller.signal,
      headers: { 'user-agent': 'WanzRESTAPI/1.0', accept: 'application/json' },
    });
    if (!res.ok) throw new Error('upstream_' + res.status);
    const json = await res.json();
    if (!json || json.status !== true || !Array.isArray(json.data)) throw new Error('empty');
    kotaCache = { data: json.data, at: Date.now() };
    return json.data;
  } finally {
    clearTimeout(timer);
  }
}

function matchKota(list: Kota[], input: string): Kota | null {
  const q = input.trim().toLowerCase();
  if (!q) return null;
  // 1. cocok id persis
  const byId = list.filter((k) => k.id === q);
  if (byId.length > 0) return byId[0];
  // 2. cocok nama persis (abaikan KOTA/KAB.)
  const norm = (s: string) => s.toLowerCase().replace(/^(kota|kab\.)\s+/, '').trim();
  const exact = list.filter((k) => norm(k.lokasi) === norm(q) || k.lokasi.toLowerCase() === q);
  if (exact.length > 0) {
    // Kalau ganda (KAB. vs KOTA), utamakan KOTA
    const kota = exact.filter((k) => k.lokasi.toLowerCase().indexOf('kota ') === 0);
    return kota.length > 0 ? kota[0] : exact[0];
  }
  // 3. diawali kata kunci
  const starts = list.filter((k) => norm(k.lokasi).indexOf(norm(q)) === 0);
  if (starts.length > 0) return starts[0];
  // 4. mengandung kata kunci
  const contains = list.filter((k) => k.lokasi.toLowerCase().indexOf(q) !== -1);
  return contains.length > 0 ? contains[0] : null;
}

function todayWIB(): string {
  return new Date(Date.now() + 7 * 3600 * 1000).toISOString().slice(0, 10);
}

export async function GET(req: NextRequest) {
  const start = Date.now();
  const sp = req.nextUrl.searchParams;
  const kotaInput = (sp.get('kota') || 'jakarta').trim();
  let tanggal = (sp.get('tanggal') || '').trim() || todayWIB();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(tanggal)) {
    return NextResponse.json(
      { success: false, error: 'Format tanggal harus YYYY-MM-DD. Contoh: ?kota=bandung&tanggal=2026-10-12' },
      { status: 400 }
    );
  }
  const [yyyy, mm, dd] = tanggal.split('-');

  try {
    const list = await getKotaList();
    const kota = matchKota(list, kotaInput);
    if (!kota) {
      return NextResponse.json(
        { success: false, error: `Kota "${kotaInput}" tidak ditemukan. Coba nama lain, mis. jakarta, bandung, surabaya.` },
        { status: 404 }
      );
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);
    let json: any = null;
    try {
      const res = await fetch(`https://api.myquran.com/v2/sholat/jadwal/${kota.id}/${yyyy}/${mm}/${dd}`, {
        signal: controller.signal,
        headers: { 'user-agent': 'WanzRESTAPI/1.0', accept: 'application/json' },
      });
      if (!res.ok) throw new Error('upstream_' + res.status);
      json = await res.json();
    } finally {
      clearTimeout(timer);
    }

    if (!json || json.status !== true || !json.data || !json.data.jadwal) {
      return NextResponse.json(
        { success: false, error: 'Jadwal tidak tersedia untuk tanggal itu.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      kota: json.data.lokasi,
      daerah: json.data.daerah || null,
      kota_id: kota.id,
      tanggal: json.data.jadwal.tanggal,
      jadwal: {
        imsak: json.data.jadwal.imsak,
        subuh: json.data.jadwal.subuh,
        terbit: json.data.jadwal.terbit,
        dhuha: json.data.jadwal.dhuha,
        dzuhur: json.data.jadwal.dzuhur,
        ashar: json.data.jadwal.ashar,
        maghrib: json.data.jadwal.maghrib,
        isya: json.data.jadwal.isya,
      },
      ms: Date.now() - start,
    });
  } catch (err) {
    const timeout = err instanceof Error && err.name === 'AbortError';
    return NextResponse.json(
      { success: false, error: timeout ? 'Upstream timeout. Coba lagi.' : 'Gagal mengambil jadwal. Coba lagi.' },
      { status: 502 }
    );
  }
}
