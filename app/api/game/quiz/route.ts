import { NextRequest, NextResponse } from 'next/server';

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&ldquo;/g, '"')
    .replace(/&rdquo;/g, '"')
    .replace(/&eacute;/g, 'é')
    .replace(/&uuml;/g, 'ü')
    .replace(/&#(\d+);/g, (_m, n) => String.fromCharCode(parseInt(n, 10)));
}

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = a[i];
    a[i] = a[j];
    a[j] = t;
  }
  return a;
}

const DIFF = ['easy', 'medium', 'hard'];
const TYPES = ['multiple', 'boolean'];

export async function GET(req: NextRequest) {
  const start = Date.now();
  const sp = req.nextUrl.searchParams;
  let amount = parseInt(sp.get('amount') || '1', 10);
  if (isNaN(amount) || amount < 1) amount = 1;
  if (amount > 10) amount = 10;
  const category = (sp.get('category') || '').trim();
  const difficulty = (sp.get('difficulty') || '').trim().toLowerCase();
  const type = (sp.get('type') || '').trim().toLowerCase();

  let apiUrl = `https://opentdb.com/api.php?amount=${amount}`;
  if (/^\d+$/.test(category)) apiUrl += `&category=${category}`;
  if (DIFF.indexOf(difficulty) !== -1) apiUrl += `&difficulty=${difficulty}`;
  if (TYPES.indexOf(type) !== -1) apiUrl += `&type=${type}`;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);
    let json: any = null;
    try {
      const res = await fetch(apiUrl, {
        signal: controller.signal,
        headers: { 'user-agent': 'WanzRESTAPI/1.0', accept: 'application/json' },
      });
      if (!res.ok) throw new Error('upstream_' + res.status);
      json = await res.json();
    } finally {
      clearTimeout(timer);
    }

    if (!json || json.response_code !== 0 || !json.results || json.results.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Tidak ada soal untuk filter itu. Coba tanpa category.' },
        { status: 404 }
      );
    }

    const questions = json.results.map((r: any) => {
      const correct = decodeEntities(String(r.correct_answer || ''));
      const options = shuffle(
        [correct].concat((r.incorrect_answers || []).map((x: string) => decodeEntities(String(x))))
      );
      return {
        category: decodeEntities(String(r.category || '')),
        difficulty: r.difficulty || null,
        type: r.type || null,
        question: decodeEntities(String(r.question || '')),
        options,
        answer: correct,
      };
    });

    return NextResponse.json({
      success: true,
      count: questions.length,
      questions,
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
