import { NextRequest, NextResponse } from 'next/server';
import { fetchWebIcon, normalizeUrl } from '@/lib/webinfo';

export const runtime = 'nodejs';

/**
 * Icon Web — scrape favicon situs langsung dari HTML-nya (tanpa API key).
 * Balikin byte gambarnya.
 */
export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get('url')?.trim() || '';
  if (!raw) {
    return NextResponse.json(
      { success: false, error: 'Parameter url wajib diisi. Contoh: /api/tools/webicon?url=google.com' },
      { status: 400 }
    );
  }
  if (!normalizeUrl(raw)) {
    return NextResponse.json({ success: false, error: 'URL tidak valid.' }, { status: 400 });
  }

  try {
    const { source, bytes, contentType } = await fetchWebIcon(raw);
    return new NextResponse(bytes, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
        'X-Wanz-Source': source,
        'X-Wanz-Origin': 'wanz-rest-api',
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Ikon tidak ditemukan untuk situs tersebut.' },
      { status: 404 }
    );
  }
}
