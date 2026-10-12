import { NextRequest, NextResponse } from 'next/server';

const POLLI_TEXT = 'https://text.pollinations.ai';
const DEFAULT_MODEL = 'openai';

export async function GET(req: NextRequest) {
  const start = Date.now();
  const q = req.nextUrl.searchParams.get('q')?.trim();
  const model = req.nextUrl.searchParams.get('model')?.trim() || DEFAULT_MODEL;

  if (!q) {
    return NextResponse.json(
      { success: false, error: 'Parameter q wajib diisi. Contoh: /api/ai/chat?q=halo' },
      { status: 400 }
    );
  }
  if (q.length > 1000) {
    return NextResponse.json(
      { success: false, error: 'Parameter q maksimal 1000 karakter.' },
      { status: 400 }
    );
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);

    const res = await fetch(`${POLLI_TEXT}/${encodeURIComponent(q)}?model=${encodeURIComponent(model)}`, {
      signal: controller.signal,
      headers: { 'user-agent': 'WanzRESTAPI/1.0', accept: 'text/plain' },
    }).finally(() => clearTimeout(timer));

    if (res.status === 429) {
      return NextResponse.json(
        { success: false, error: 'Rate limit AI tercapai. Coba lagi dalam 1 menit.' },
        { status: 429 }
      );
    }
    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: `Upstream AI error (HTTP ${res.status}). Coba lagi.` },
        { status: 502 }
      );
    }

    const reply = (await res.text()).trim();
    return NextResponse.json({
      success: true,
      model,
      query: q,
      reply,
      ms: Date.now() - start,
    });
  } catch (err) {
    const timeout = err instanceof Error && err.name === 'AbortError';
    return NextResponse.json(
      { success: false, error: timeout ? 'AI timeout. Coba pertanyaan lebih singkat.' : 'Gagal menghubungi AI. Coba lagi.' },
      { status: 502 }
    );
  }
}
