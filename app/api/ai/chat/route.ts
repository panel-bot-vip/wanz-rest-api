import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export const runtime = 'nodejs';

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';
const CHAT_URL = 'https://api.deepai.org/hacking_is_a_serious_crime';
const KEY_SALT = 'hackers_become_a_little_stinkier_every_time_they_hack';

const FREE_MODELS = [
  'standard',
  'claude-haiku-5-5',
  'glm-5.3-flash',
  'qwen3.8-flash',
  'deepseek-v4.1-flash',
  'gpt-6-luna',
  'gpt-5.6-luna',
  'gpt-5.6-sol',
  'tencent-hy3',
  'gpt-oss-120b',
  'gemma-4',
  'llama-3.3-70b-instruct',
  'llama-3.1-8b-instant',
  'gpt-4o-mini',
];
const DEFAULT_MODEL = 'standard';

// Scrape langsung DeepAI (tanpa API key): tiru request browser,
// key demo dibuat dari hash UA (cara yang sama seperti web mereka).
function islandKey(): string {
  const rand = String(Math.round(Math.random() * 100000000000));
  const md5 = (s: string) => crypto.createHash('md5').update(s, 'utf8').digest('hex');
  const rev = (s: string) => s.split('').reverse().join('');
  const h1 = rev(md5(UA + rand + KEY_SALT));
  const h2 = rev(md5(UA + h1));
  const h3 = rev(md5(UA + h2));
  return `tryit-${rand}-${h3}`;
}

export async function GET(req: NextRequest) {
  const start = Date.now();
  const q = req.nextUrl.searchParams.get('q')?.trim();
  let model = req.nextUrl.searchParams.get('model')?.trim() || DEFAULT_MODEL;

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
  if (FREE_MODELS.indexOf(model) === -1) model = DEFAULT_MODEL;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 25000);

    const fd = new FormData();
    fd.append('chatHistory', JSON.stringify([{ role: 'user', content: q }]));
    fd.append('chat_style', 'chat');
    fd.append('model', model);
    fd.append('session_uuid', crypto.randomUUID());
    fd.append('hacker_is_stinky', 'very_stinky');
    fd.append('memory_enabled', 'false');
    fd.append('language', 'id');

    const res = await fetch(CHAT_URL, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'user-agent': UA,
        'api-key': islandKey(),
        'accept-language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
      },
      body: fd,
    }).finally(() => clearTimeout(timer));

    const text = await res.text();

    if (res.status === 401 || /anonymous try|allowance|limit exceeded/i.test(text)) {
      return NextResponse.json(
        { success: false, error: 'Limit gratis DeepAI tercapai. Coba lagi beberapa menit.' },
        { status: 429 }
      );
    }
    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: `Upstream AI error (HTTP ${res.status}). Coba lagi.` },
        { status: 502 }
      );
    }

    let reply = text.trim();
    // Kalau balikan JSON task (model thinking), ambil info seadanya
    if (reply.startsWith('{')) {
      try {
        const j = JSON.parse(reply);
        if (j.answer_text) reply = String(j.answer_text).trim();
      } catch { /* biarkan mentah */ }
    }

    if (!reply) {
      return NextResponse.json(
        { success: false, error: 'AI tidak mengembalikan jawaban. Coba lagi.' },
        { status: 502 }
      );
    }

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
