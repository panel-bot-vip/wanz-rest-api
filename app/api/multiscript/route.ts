import { NextRequest, NextResponse } from 'next/server';
import { translateCode, LANGS, type Lang } from '@/lib/multiscript';

export const runtime = 'nodejs';
export const maxDuration = 15;

/**
 * Konversi keyword JavaScript <-> Jawa / Sunda / Indonesia.
 * Self-contained (gak ngejalankan kode, gak API-wrapping).
 *
 * GET  /api/multiscript?code=...&from=js&to=jawa
 * POST /api/multiscript  { code, from, to }
 */

function isLang(x: string | null): x is Lang {
  return !!x && (LANGS as string[]).includes(x);
}
function json(d: unknown, status = 200) {
  return NextResponse.json(d, { status });
}

function run(rawCode: unknown, rawFrom: unknown, rawTo: unknown) {
  const code = String(rawCode ?? '');
  const from = String(rawFrom ?? 'js');
  const to = String(rawTo ?? 'jawa');
  if (!code.trim()) return { error: 'Param code wajib diisi.' };
  if (!isLang(from)) return { error: 'Param from tidak valid (js|jawa|sunda|indo).' };
  if (!isLang(to)) return { error: 'Param to tidak valid (js|jawa|sunda|indo).' };
  if (code.length > 20000) return { error: 'Kode terlalu panjang (maks 20KB).' };
  return { success: true, from, to, code: translateCode(code, from, to) };
}

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const r = run(p.get('code'), p.get('from') ?? 'js', p.get('to') ?? 'jawa');
  return 'error' in r ? json({ success: false, error: r.error }, 400) : json(r);
}

export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => null);
  if (!b || typeof b !== 'object') return json({ success: false, error: 'Body JSON tidak valid.' }, 400);
  const o = b as Record<string, unknown>;
  const r = run(o.code, o.from ?? 'js', o.to ?? 'jawa');
  return 'error' in r ? json({ success: false, error: r.error }, 400) : json(r);
}
