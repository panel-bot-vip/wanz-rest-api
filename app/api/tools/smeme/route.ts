import { NextRequest, NextResponse } from 'next/server';
import { renderSmeme } from '@/lib/meme';
import { fetchRemoteFile, MAX_UPLOAD_BYTES } from '@/lib/tolink';

const SMEME_SIZE = 800;

async function blobToDataUri(blob: Blob): Promise<string> {
  const buf = Buffer.from(await blob.arrayBuffer());
  return `data:${blob.type || 'image/png'};base64,${buf.toString('base64')}`;
}

async function handle(req: NextRequest) {
  const start = Date.now();
  const ctype = req.headers.get('content-type') || '';

  let blob: Blob | null = null;
  let top = '';
  let bottom = '';

  if (ctype.indexOf('multipart/form-data') !== -1) {
    const form = await req.formData();
    const f = form.get('image') as unknown as Blob | null;
    top = String(form.get('top') || '').trim();
    bottom = String(form.get('bottom') || '').trim();
    const urlField = form.get('url');
    if (f && typeof (f as Blob).arrayBuffer === 'function' && (f as Blob).size > 0) {
      if ((f as Blob).size > MAX_UPLOAD_BYTES) {
        return NextResponse.json({ success: false, error: 'Gambar maksimal 4MB.' }, { status: 413 });
      }
      blob = f as Blob;
    } else if (typeof urlField === 'string' && urlField.trim()) {
      try {
        const fetched = await fetchRemoteFile(urlField.trim());
        blob = fetched.blob;
      } catch {
        return NextResponse.json(
          { success: false, error: 'Gagal mengambil gambar dari URL tersebut.' },
          { status: 400 }
        );
      }
    }
  } else {
    const u = req.nextUrl.searchParams.get('url')?.trim() || '';
    top = req.nextUrl.searchParams.get('top')?.trim() || '';
    bottom = req.nextUrl.searchParams.get('bottom')?.trim() || '';
    if (u) {
      try {
        const fetched = await fetchRemoteFile(u);
        blob = fetched.blob;
      } catch {
        return NextResponse.json(
          { success: false, error: 'Gagal mengambil gambar dari URL tersebut.' },
          { status: 400 }
        );
      }
    }
  }

  if (!blob) {
    return NextResponse.json(
      { success: false, error: 'Kirim gambar via POST (field "image") atau GET dengan ?url=<link_gambar>.' },
      { status: 400 }
    );
  }
  if (!top && !bottom) {
    return NextResponse.json(
      { success: false, error: 'Isi teks atas (top) dan/atau bawah (bottom). Contoh: ?url=...&top=halo&bottom=bos' },
      { status: 400 }
    );
  }
  if (top.length > 100 || bottom.length > 100) {
    return NextResponse.json(
      { success: false, error: 'Teks maksimal 100 karakter per baris.' },
      { status: 400 }
    );
  }

  try {
    const dataUri = await blobToDataUri(blob);
    return await renderSmeme(dataUri, top, bottom, SMEME_SIZE);
  } catch {
    return NextResponse.json(
      { success: false, error: 'Gagal render meme. Coba lagi.' },
      { status: 502 }
    );
  }
}

export async function GET(req: NextRequest) {
  return handle(req);
}

export async function POST(req: NextRequest) {
  return handle(req);
}
