import { NextRequest, NextResponse } from 'next/server';

/**
 * Claude RESMI via API Anthropic (bukan scrape, bukan wrapper).
 * Memakai ANTHROPIC_API_KEY milik pemilik situs — user akhir tetap tanpa key.
 *
 * Endpoint: POST https://api.anthropic.com/v1/messages
 * Header   : x-api-key, anthropic-version: 2023-06-01
 */
const API_URL = 'https://api.anthropic.com/v1/messages';
const API_VERSION = '2023-06-01';

// max_tokens dibatasi supaya biaya API pemilik situs tidak meledak
const MAX_TOKENS = 1024;

type Block = { type: string; text?: string };
type Result =
  | { ok: true; reply: string; usage?: { input: number; output: number } }
  | { ok: false; kind: 'nokey' | 'badkey' | 'limit' | 'upstream' | 'empty' | 'timeout' | 'error' };

async function askAnthropic(
  system: string | null,
  question: string,
  model: string,
  key: string
): Promise<Result> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 60000);

  const body: Record<string, unknown> = {
    model,
    max_tokens: MAX_TOKENS,
    messages: [{ role: 'user', content: question }],
  };
  // system dipakai sebagai field terpisah (bukan pesan) — cara resmi Anthropic
  if (system) body.system = system;

  let res: Response;
  try {
    res = await fetch(API_URL, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'x-api-key': key,
        'anthropic-version': API_VERSION,
        'content-type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  } catch (err) {
    const timeout = err instanceof Error && err.name === 'AbortError';
    return { ok: false, kind: timeout ? 'timeout' : 'error' };
  } finally {
    clearTimeout(timer);
  }

  const text = await res.text();

  if (res.status === 401) return { ok: false, kind: 'badkey' };
  if (res.status === 429) return { ok: false, kind: 'limit' };
  if (!res.ok) return { ok: false, kind: 'upstream' };

  let reply = '';
  let usage: { input: number; output: number } | undefined;
  try {
    const j = JSON.parse(text);
    if (Array.isArray(j.content)) {
      // content bisa berisi blok thinking + text; ambil yang text saja
      reply = (j.content as Block[])
        .filter((b) => b.type === 'text' && b.text)
        .map((b) => b.text as string)
        .join('')
        .trim();
    }
    if (j.usage) {
      usage = { input: j.usage.input_tokens, output: j.usage.output_tokens };
    }
  } catch { /* biarkan kosong */ }

  if (!reply) return { ok: false, kind: 'empty' };
  return { ok: true, reply, usage };
}

const ERR: Record<string, { msg: string; status: number }> = {
  nokey: {
    msg: 'ANTHROPIC_API_KEY belum diatur di server. Endpoint ini butuh API key Anthropic.',
    status: 500,
  },
  badkey: { msg: 'API key Anthropic ditolak (401). Periksa nilai ANTHROPIC_API_KEY.', status: 502 },
  limit: { msg: 'Rate limit / kuota Anthropic tercapai. Coba lagi nanti.', status: 429 },
  upstream: { msg: 'Upstream Anthropic error. Coba lagi.', status: 502 },
  empty: { msg: 'Claude tidak mengembalikan jawaban. Coba lagi.', status: 502 },
  timeout: { msg: 'Timeout. Coba pertanyaan lebih singkat.', status: 502 },
  error: { msg: 'Gagal menghubungi Claude. Coba lagi.', status: 502 },
};

/**
 * Faktori handler GET untuk endpoint Claude resmi per-model.
 * Parameter: `q` wajib, `system` opsional (custom prompt).
 */
export function makeAnthropicHandler(model: string) {
  return async function GET(req: NextRequest) {
    const start = Date.now();
    const key = process.env.ANTHROPIC_API_KEY?.trim();

    if (!key) {
      const e = ERR.nokey;
      return NextResponse.json({ success: false, error: e.msg }, { status: e.status });
    }

    const q = req.nextUrl.searchParams.get('q')?.trim();
    const system = req.nextUrl.searchParams.get('system')?.trim();

    if (!q) {
      return NextResponse.json(
        { success: false, error: 'Parameter q wajib diisi. Contoh: ?q=halo' },
        { status: 400 }
      );
    }
    if (q.length > 1000) {
      return NextResponse.json(
        { success: false, error: 'Parameter q maksimal 1000 karakter.' },
        { status: 400 }
      );
    }
    if (system && system.length > 500) {
      return NextResponse.json(
        { success: false, error: 'Parameter system maksimal 500 karakter.' },
        { status: 400 }
      );
    }

    const result = await askAnthropic(system || null, q, model, key);
    if (!result.ok) {
      const e = ERR[result.kind] || ERR.error;
      return NextResponse.json({ success: false, error: e.msg }, { status: e.status });
    }

    return NextResponse.json({
      success: true,
      provider: 'anthropic',
      official: true,
      model,
      query: q,
      system: system || null,
      reply: result.reply,
      usage: result.usage || null,
      ms: Date.now() - start,
    });
  };
}
