import { NextRequest, NextResponse } from 'next/server';

/**
 * Pollinations.ai — agregator model gratis.
 * Free tier (tanpa key) hanya melayani model `openai`; model lain 402 Payment Required.
 * Pakai endpoint OpenAI-compatible (POST) supaya system role / custom prompt diterima.
 */
const ENDPOINT = 'https://text.pollinations.ai/openai';
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';

export const POLLINATIONS_MODELS = ['openai'];
export const DEFAULT_POLLINATIONS_MODEL = 'openai';

type Result =
  | { ok: true; reply: string }
  | { ok: false; kind: 'limit' | 'upstream' | 'empty' | 'timeout' | 'error' };

async function askPollinations(
  history: { role: string; content: string }[],
  model: string
): Promise<Result> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 60000);

  let res: Response;
  try {
    res = await fetch(ENDPOINT, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'user-agent': UA,
        'content-type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify({ model, messages: history }),
    });
  } catch (err) {
    const timeout = err instanceof Error && err.name === 'AbortError';
    return { ok: false, kind: timeout ? 'timeout' : 'error' };
  } finally {
    clearTimeout(timer);
  }

  const text = await res.text();

  // 402/429 = kuota gratis habis atau model butuh akun berbayar
  if (res.status === 402 || res.status === 429) return { ok: false, kind: 'limit' };
  if (!res.ok) return { ok: false, kind: 'upstream' };

  let reply = '';
  try {
    const j = JSON.parse(text);
    if (Array.isArray(j?.choices) && j.choices[0]?.message?.content) {
      reply = String(j.choices[0].message.content).trim();
    }
  } catch { /* balasan mungkin teks polos */ }

  if (!reply) reply = text.trim();
  if (!reply) return { ok: false, kind: 'empty' };
  return { ok: true, reply };
}

const ERR: Record<string, { msg: string; status: number }> = {
  limit: { msg: 'Kuota gratis Pollinations sedang penuh. Coba lagi beberapa saat.', status: 429 },
  upstream: { msg: 'Upstream AI error. Coba lagi.', status: 502 },
  empty: { msg: 'AI tidak mengembalikan jawaban. Coba lagi.', status: 502 },
  timeout: { msg: 'AI timeout. Coba pertanyaan lebih singkat.', status: 502 },
  error: { msg: 'Gagal menghubungi AI. Coba lagi.', status: 502 },
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Faktori handler GET untuk endpoint Pollinations per-model.
 * Parameter sama dengan endpoint DeepAI: `q` wajib, `system` opsional (custom prompt).
 *
 * Free tier Pollinations memberi 402/429 secara acak, jadi handler ini
 * otomatis mencoba ulang sampai `RETRY` kali dengan jeda singkat.
 */
export function makePollinationsHandler(model: string = DEFAULT_POLLINATIONS_MODEL) {
  return async function GET(req: NextRequest) {
    const start = Date.now();
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

    const history: { role: string; content: string }[] = [];
    if (system) history.push({ role: 'system', content: system });
    history.push({ role: 'user', content: q });

    // Coba ulang bila kena rate-limit acak free tier
    const RETRY = 3;
    let result = await askPollinations(history, model);
    for (let i = 1; i < RETRY && !result.ok && (result.kind === 'limit' || result.kind === 'error'); i++) {
      await sleep(1200 * i);
      result = await askPollinations(history, model);
    }

    if (!result.ok) {
      const e = ERR[result.kind] || ERR.error;
      return NextResponse.json({ success: false, error: e.msg }, { status: e.status });
    }

    return NextResponse.json({
      success: true,
      provider: 'pollinations',
      model,
      query: q,
      system: system || null,
      reply: result.reply,
      ms: Date.now() - start,
    });
  };
}
