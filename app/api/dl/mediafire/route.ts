import { NextRequest, NextResponse } from 'next/server';

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';

export async function GET(req: NextRequest) {
  const start = Date.now();
  const input = req.nextUrl.searchParams.get('url')?.trim();

  if (!input) {
    return NextResponse.json(
      { success: false, error: 'Parameter url wajib diisi. Contoh: /api/dl/mediafire?url=https://www.mediafire.com/file/xxx/file.zip' },
      { status: 400 }
    );
  }

  let id: string | null = null;
  try {
    const u = new URL(input);
    if (u.hostname.indexOf('mediafire.com') === -1) throw new Error('host');
    const m = u.pathname.match(/\/file\/([A-Za-z0-9]+)/);
    if (m) id = m[1];
  } catch {
    const m = input.match(/mediafire\.com\/file\/([A-Za-z0-9]+)/);
    if (m) id = m[1];
  }

  if (!id) {
    return NextResponse.json(
      { success: false, error: 'Link MediaFire tidak valid. Format: https://www.mediafire.com/file/ID/namafile.ext' },
      { status: 400 }
    );
  }

  try {
    const pageUrl = `https://www.mediafire.com/file/${id}/`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);
    const res = await fetch(pageUrl, {
      signal: controller.signal,
      headers: { 'user-agent': UA, accept: 'text/html' },
      redirect: 'follow',
    }).finally(() => clearTimeout(timer));

    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: res.status === 404 ? 'File tidak ditemukan atau sudah dihapus.' : 'Gagal memuat halaman MediaFire.' },
        { status: res.status === 404 ? 404 : 502 }
      );
    }

    const html = await res.text();

    const linkMatch = html.match(/aria-label="Download file"\s+href="([^"]+)"/) || html.match(/https:\/\/download\d*\.mediafire\.com\/[^"'\s]+/);
    if (!linkMatch) {
      return NextResponse.json(
        { success: false, error: 'Link download tidak ditemukan (file mungkin dihapus atau halaman butuh verifikasi).' },
        { status: 404 }
      );
    }

    const url = String(linkMatch[1] || linkMatch[0]).replace(/&amp;/g, '&');

    const sizeMatch = html.match(/File size:\s*<span>([^<]+)<\/span>/);
    const uploadMatch = html.match(/Uploaded:\s*<span>([^<]+)<\/span>/);
    const typeMatch = html.match(/<span class="filename">([^<]+)<\/span>/) || html.match(/<title>([^<]+?)(?:\(| - )/);

    let filename: string | null = null;
    try {
      const seg = new URL(url).pathname.split('/').filter(Boolean);
      filename = decodeURIComponent(seg[seg.length - 1] || '');
    } catch {
      /* pakai fallback */
    }
    if (!filename) filename = typeMatch ? String(typeMatch[1]).trim() : null;

    return NextResponse.json({
      success: true,
      id,
      filename,
      size: sizeMatch ? sizeMatch[1] : null,
      uploaded: uploadMatch ? uploadMatch[1] : null,
      url,
      ms: Date.now() - start,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    if (msg.indexOf('abort') !== -1) {
      return NextResponse.json({ success: false, error: 'MediaFire lambat merespons. Coba lagi.' }, { status: 504 });
    }
    return NextResponse.json({ success: false, error: 'Gagal mengambil file. Coba lagi.' }, { status: 502 });
  }
}
