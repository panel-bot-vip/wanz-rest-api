import { NextRequest, NextResponse } from 'next/server';

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';
const MAX_CHARS = 1000;
const CHUNK_CHARS = 180;

function splitChunks(text: string): string[] {
  const parts = text.match(/[^.!?\n]+[.!?\n]*/g) || [text];
  const chunks: string[] = [];
  let cur = '';
  for (const p of parts) {
    const piece = p.trim();
    if (!piece) continue;
    if ((cur + ' ' + piece).trim().length > CHUNK_CHARS) {
      if (cur) chunks.push(cur.trim());
      cur = piece;
    } else {
      cur = (cur + ' ' + piece).trim();
    }
  }
  if (cur) chunks.push(cur.trim());
  return chunks.slice(0, 6);
}

export async function GET(req: NextRequest) {
  const text = req.nextUrl.searchParams.get('text')?.trim();
  const lang = (req.nextUrl.searchParams.get('lang')?.trim() || 'id').toLowerCase();

  if (!text) {
    return NextResponse.json(
      { success: false, error: 'Parameter text wajib diisi. Contoh: /api/tools/tts?text=halo&lang=id' },
      { status: 400 }
    );
  }
  if (!/^[a-z-]{2,11}$/.test(lang)) {
    return NextResponse.json({ success: false, error: 'Kode lang tidak valid. Contoh: id, en.' }, { status: 400 });
  }
  if (text.length > MAX_CHARS) {
    return NextResponse.json(
      { success: false, error: `Teks maksimal ${MAX_CHARS} karakter.` },
      { status: 400 }
    );
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 30000);
    const buffers: Uint8Array[] = [];
    try {
      for (const chunk of splitChunks(text)) {
        const res = await fetch(
          `https://translate.google.com/translate_tts?client=tw-ob&q=${encodeURIComponent(chunk)}&tl=${encodeURIComponent(lang)}`,
          { signal: controller.signal, headers: { 'user-agent': UA } }
        );
        if (!res.ok) throw new Error('upstream_' + res.status);
        const buf = new Uint8Array(await res.arrayBuffer());
        if (buf.length === 0) throw new Error('empty_audio');
        buffers.push(buf);
      }
    } finally {
      clearTimeout(timer);
    }

    const total = buffers.reduce((a, b) => a + b.length, 0);
    const merged = new Uint8Array(total);
    let off = 0;
    for (const b of buffers) {
      merged.set(b, off);
      off += b.length;
    }

    return new NextResponse(merged, {
      status: 200,
      headers: {
        'content-type': 'audio/mpeg',
        'content-length': String(total),
        'cache-control': 'public, max-age=86400',
      },
    });
  } catch (err) {
    const timeout = err instanceof Error && err.name === 'AbortError';
    return NextResponse.json(
      { success: false, error: timeout ? 'Upstream timeout. Coba teks lebih pendek.' : 'Gagal membuat audio. Coba lagi.' },
      { status: 502 }
    );
  }
}
