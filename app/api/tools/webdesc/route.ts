import { NextRequest, NextResponse } from 'next/server';
import { fetchWebMeta, normalizeUrl } from '@/lib/webinfo';

export const runtime = 'nodejs';

/**
 * Deskripsi Web — scrape metadata (title, deskripsi, OG, icon, bahasa)
 * langsung dari HTML situs target. Tanpa API key.
 */
export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get('url')?.trim() || '';
  if (!raw) {
    return NextResponse.json(
      { success: false, error: 'Parameter url wajib diisi. Contoh: /api/tools/webdesc?url=google.com' },
      { status: 400 }
    );
  }
  if (!normalizeUrl(raw)) {
    return NextResponse.json({ success: false, error: 'URL tidak valid.' }, { status: 400 });
  }

  try {
    const meta = await fetchWebMeta(raw);
    return NextResponse.json(
      { success: true, ...meta },
      { headers: { 'X-Wanz-Origin': 'wanz-rest-api' } }
    );
  } catch {
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil metadata situs. Cek URL atau coba lagi.' },
      { status: 502 }
    );
  }
}
