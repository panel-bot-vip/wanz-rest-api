import { NextRequest, NextResponse } from 'next/server';

const SEARCH_URL = 'https://konsultasisyariah.com/wp-json/wp/v2/search';
const POST_URL = 'https://konsultasisyariah.com/wp-json/wp/v2/posts';
const UA = 'WanzRESTAPI/1.0';

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
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_m, n) => String.fromCharCode(parseInt(n, 10)));
}

function htmlToText(html: string): string {
  const noScript = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ');
  const noTags = noScript.replace(/<[^>]+>/g, ' ');
  return decodeEntities(noTags).replace(/\s+/g, ' ').trim();
}

async function fetchJson(url: string, timeoutMs: number): Promise<any> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'user-agent': UA, accept: 'application/json' },
    });
    if (!res.ok) throw new Error('upstream_' + res.status);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

export async function GET(req: NextRequest) {
  const start = Date.now();
  const sp = req.nextUrl.searchParams;
  const q = (sp.get('q') || '').trim();
  let limit = parseInt(sp.get('limit') || '3', 10);
  if (isNaN(limit) || limit < 1) limit = 3;
  if (limit > 5) limit = 5;

  if (!q) {
    return NextResponse.json(
      { success: false, error: 'Parameter q wajib diisi. Contoh: /api/islami/tanya?q=wudhu' },
      { status: 400 }
    );
  }

  try {
    const hits = await fetchJson(
      `${SEARCH_URL}?search=${encodeURIComponent(q)}&per_page=${limit}`,
      20000
    );
    if (!Array.isArray(hits) || hits.length === 0) {
      return NextResponse.json(
        { success: false, error: `Tidak ditemukan jawaban untuk "${q}". Coba kata kunci lain.` },
        { status: 404 }
      );
    }

    const ids = hits
      .filter((h: any) => h && h.type === 'post' && h.id)
      .slice(0, limit)
      .map((h: any) => h.id);

    const posts = await Promise.all(
      ids.map((id: number) =>
        fetchJson(`${POST_URL}/${id}`, 20000).catch(() => null)
      )
    );

    const results = posts
      .filter((p: any) => p && p.content && p.content.rendered)
      .map((p: any) => {
        const full = htmlToText(String(p.content.rendered));
        return {
          title: htmlToText(String((p.title && p.title.rendered) || '')),
          link: p.link || null,
          answer: full.length > 1500 ? full.slice(0, 1500).trim() + '…' : full,
          full_length: full.length,
        };
      });

    if (results.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Gagal membaca isi jawaban. Coba lagi.' },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      query: q,
      count: results.length,
      source: 'konsultasisyariah.com',
      results,
      ms: Date.now() - start,
    });
  } catch (err) {
    const timeout = err instanceof Error && err.name === 'AbortError';
    return NextResponse.json(
      { success: false, error: timeout ? 'Upstream timeout. Coba lagi.' : 'Gagal mencari jawaban. Coba lagi.' },
      { status: 502 }
    );
  }
}
