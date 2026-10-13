import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Scrape langsung endpoint chat DeepAI (tanpa API key).
 * Kunci "island" dibuat dari hash User-Agent — cara yang sama dipakai web mereka.
 * Free tier hanya melayani chat; endpoint gambar sudah tidak tersedia.
 */
export const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';

const CHAT_URL = 'https://api.deepai.org/hacking_is_a_serious_crime';
const KEY_SALT = 'hackers_become_a_little_stinkier_every_time_they_hack';

const md5 = (s: string) => crypto.createHash('md5').update(s, 'utf8').digest('hex');
const rev = (s: string) => s.split('').reverse().join('');

function islandKey(): string {
  const rand = String(Math.round(Math.random() * 100000000000));
  const h1 = rev(md5(UA + rand + KEY_SALT));
  const h2 = rev(md5(UA + h1));
  const h3 = rev(md5(UA + h2));
  return `tryit-${rand}-${h3}`;
}

export interface ChatTurn {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export type ChatResult =
  | { ok: true; reply: string }
  | { ok: false; kind: 'limit' | 'upstream' | 'empty' | 'timeout' | 'error' };

/**
 * Kirim riwayat percakapan ke DeepAI dan kembalikan jawaban.
 * `system` hanya dipakai bila ada di riwayat.
 */
export async function askDeepAI(history: ChatTurn[], model: string): Promise<ChatResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25000);

  const fd = new FormData();
  fd.append('chatHistory', JSON.stringify(history));
  fd.append('chat_style', 'chat');
  fd.append('model', model);
  fd.append('session_uuid', crypto.randomUUID());
  fd.append('hacker_is_stinky', 'very_stinky');
  fd.append('memory_enabled', 'false');
  fd.append('language', 'id');

  let res: Response;
  try {
    res = await fetch(CHAT_URL, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'user-agent': UA,
        'api-key': islandKey(),
        'accept-language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
      },
      body: fd,
    });
  } catch (err) {
    const timeout = err instanceof Error && err.name === 'AbortError';
    return { ok: false, kind: timeout ? 'timeout' : 'error' };
  } finally {
    clearTimeout(timer);
  }

  const text = await res.text();

  if (res.status === 401 || /anonymous try|allowance|limit exceeded/i.test(text)) {
    return { ok: false, kind: 'limit' };
  }
  if (!res.ok) return { ok: false, kind: 'upstream' };

  let reply = text.trim();
  if (reply.startsWith('{')) {
    try {
      const j = JSON.parse(reply);
      if (j.answer_text) reply = String(j.answer_text).trim();
    } catch { /* biarkan mentah */ }
  }

  if (!reply) return { ok: false, kind: 'empty' };
  return { ok: true, reply };
}

export const ERR_MESSAGES: Record<string, { msg: string; status: number }> = {
  limit: { msg: 'Limit gratis DeepAI tercapai. Coba lagi beberapa menit.', status: 429 },
  upstream: { msg: 'Upstream AI error. Coba lagi.', status: 502 },
  empty: { msg: 'AI tidak mengembalikan jawaban. Coba lagi.', status: 502 },
  timeout: { msg: 'AI timeout. Coba pertanyaan lebih singkat.', status: 502 },
  error: { msg: 'Gagal menghubungi AI. Coba lagi.', status: 502 },
};

function fail(kind: string) {
  const e = ERR_MESSAGES[kind] || ERR_MESSAGES.error;
  return NextResponse.json({ success: false, error: e.msg }, { status: e.status });
}

/**
 * Faktori handler GET untuk endpoint AI per-model.
 * Setiap endpoint mewakili tepi satu model (tanpa parameter `model`).
 *
 * Parameter:
 * - `q`     (wajib) : pertanyaan/pesan user, maks 1000 karakter
 * - `system`(opsional): custom prompt / persona, maks 500 karakter
 *
 * Custom prompt dikirim ganda — sebagai role `system` dan diawal pesan user —
 * karena system role DeepAI tidak selalu dipegang model.
 */
export function makeAIHandler(model: string) {
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

    const history: ChatTurn[] = [];
    if (system) {
      history.push({ role: 'system', content: system });
      history.push({ role: 'user', content: `${system}\n\nPertanyaan: ${q}` });
    } else {
      history.push({ role: 'user', content: q });
    }

    const result = await askDeepAI(history, model);
    if (!result.ok) return fail(result.kind);

    return NextResponse.json({
      success: true,
      model,
      query: q,
      system: system || null,
      reply: result.reply,
      ms: Date.now() - start,
    });
  };
}
