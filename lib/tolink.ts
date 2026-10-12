import { NextRequest, NextResponse } from 'next/server';

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';

export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024; // batas body Vercel ±4.5MB

export interface TolinkProvider {
  id: string;
  host: string;
  retention: string;
  uploadUrl: string;
  buildForm: (file: Blob, filename: string) => FormData;
  parseUrl: (res: Response) => Promise<string | null>;
}

function fdFile(form: FormData, field: string, file: Blob, filename: string) {
  form.append(field, file, filename);
}

export const PROVIDERS: Record<string, TolinkProvider> = {
  tolinkv1: {
    id: 'tolinkv1',
    host: 'tmpfiles.org',
    retention: 'Menyimpan file, link langsung via /dl/',
    uploadUrl: 'https://tmpfiles.org/api/v1/upload',
    buildForm: (file, filename) => {
      const fd = new FormData();
      fdFile(fd, 'file', file, filename);
      return fd;
    },
    parseUrl: async (res) => {
      const j = await res.json().catch(() => null);
      const url: string | null = j && j.data ? j.data.url : null;
      return url ? String(url) : null;
    },
  },
  tolinkv2: {
    id: 'tolinkv2',
    host: 'uguu.se',
    retention: 'Sementara ±3 jam',
    uploadUrl: 'https://uguu.se/upload.php',
    buildForm: (file, filename) => {
      const fd = new FormData();
      fdFile(fd, 'files[]', file, filename);
      return fd;
    },
    parseUrl: async (res) => {
      const j = await res.json().catch(() => null);
      const f = j && j.files && j.files[0] ? j.files[0] : null;
      return f && f.url ? String(f.url) : null;
    },
  },
  tolinkv3: {
    id: 'tolinkv3',
    host: 'qu.ax',
    retention: 'Ada masa kedaluwarsa (lihat expires di respons host)',
    uploadUrl: 'https://qu.ax/upload',
    buildForm: (file, filename) => {
      const fd = new FormData();
      fdFile(fd, 'files[]', file, filename);
      return fd;
    },
    parseUrl: async (res) => {
      const j = await res.json().catch(() => null);
      const f = j && j.files && j.files[0] ? j.files[0] : null;
      return f && f.url ? String(f.url) : null;
    },
  },
  tolinkv4: {
    id: 'tolinkv4',
    host: 'litterbox (catbox)',
    retention: 'Temp: 1 jam – 72 jam (dipakai 72 jam)',
    uploadUrl: 'https://litterbox.catbox.moe/resources/internals/api.php',
    buildForm: (file, filename) => {
      const fd = new FormData();
      fd.append('reqtype', 'fileupload');
      fd.append('time', '72h');
      fdFile(fd, 'fileToUpload', file, filename);
      return fd;
    },
    parseUrl: async (res) => {
      const t = (await res.text()).trim();
      return t.indexOf('https://') === 0 ? t : null;
    },
  },
  tolinkv5: {
    id: 'tolinkv5',
    host: 'pomf.lain.la',
    retention: 'Permanen (selama host hidup)',
    uploadUrl: 'https://pomf.lain.la/upload.php',
    buildForm: (file, filename) => {
      const fd = new FormData();
      fdFile(fd, 'files[]', file, filename);
      return fd;
    },
    parseUrl: async (res) => {
      const j = await res.json().catch(() => null);
      const f = j && j.files && j.files[0] ? j.files[0] : null;
      return f && f.url ? String(f.url) : null;
    },
  },
};

async function readCapped(body: ReadableStream<Uint8Array> | null, max: number): Promise<Uint8Array[]> {
  if (!body) throw new Error('empty');
  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const step = await reader.read();
    if (step.done) break;
    total += step.value.length;
    if (total > max) {
      try { reader.cancel(); } catch { /* abaikan */ }
      throw new Error('too_big');
    }
    chunks.push(step.value);
  }
  return chunks;
}

function extFrom(mime: string, name: string): string {
  const fromName = name.match(/\.(png|jpe?g|gif|webp|bmp|svg|mp4|mp3|pdf|zip|txt)$/i);
  if (fromName) return fromName[0].toLowerCase();
  if (mime.indexOf('jpeg') !== -1) return '.jpg';
  if (mime.indexOf('png') !== -1) return '.png';
  if (mime.indexOf('gif') !== -1) return '.gif';
  if (mime.indexOf('webp') !== -1) return '.webp';
  return '.bin';
}

export async function handleTolink(req: NextRequest, providerId: string) {
  const start = Date.now();
  const provider = PROVIDERS[providerId];
  if (!provider) {
    return NextResponse.json({ success: false, error: 'Provider tidak dikenal.' }, { status: 404 });
  }

  let blob: Blob | null = null;
  let filename = 'upload.bin';

  try {
    const ctype = req.headers.get('content-type') || '';
    if (ctype.indexOf('multipart/form-data') !== -1) {
      const form = await req.formData();
      const f = form.get('file') as unknown as Blob | null;
      const urlField = form.get('url');
      if (f && typeof (f as Blob).arrayBuffer === 'function' && (f as Blob).size > 0) {
        if ((f as Blob).size > MAX_UPLOAD_BYTES) {
          return NextResponse.json(
            { success: false, error: 'File maksimal 4MB.' },
            { status: 413 }
          );
        }
        blob = f as Blob;
        const maybeName = f as unknown as { name?: string };
        filename = maybeName.name || `upload${extFrom(blob.type || '', '')}`;
      } else if (typeof urlField === 'string' && urlField.trim()) {
        const fetched = await fetchRemoteFile(urlField.trim());
        blob = fetched.blob;
        filename = fetched.filename;
      } else {
        return NextResponse.json(
          { success: false, error: 'Kirim file (field "file") atau URL gambar (field/param "url").' },
          { status: 400 }
        );
      }
    } else {
      const u = req.nextUrl.searchParams.get('url')?.trim();
      if (!u) {
        return NextResponse.json(
          { success: false, error: 'Kirim file via POST (field "file") atau GET dengan ?url=<link_gambar>.' },
          { status: 400 }
        );
      }
      const fetched = await fetchRemoteFile(u);
      blob = fetched.blob;
      filename = fetched.filename;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 30000);
    let rawUrl: string | null = null;
    try {
      const upRes = await fetch(provider.uploadUrl, {
        method: 'POST',
        signal: controller.signal,
        headers: { 'user-agent': UA },
        body: provider.buildForm(blob as Blob, filename),
      });
      if (!upRes.ok) throw new Error('upstream_' + upRes.status);
      rawUrl = await provider.parseUrl(upRes);
    } finally {
      clearTimeout(timer);
    }

    if (!rawUrl) {
      return NextResponse.json(
        { success: false, error: `Host ${provider.host} tidak mengembalikan link. Coba lagi.` },
        { status: 502 }
      );
    }

    // tmpfiles: sediakan juga link langsung (tanpa halaman preview)
    const url = rawUrl;
    let direct: string | null = null;
    if (providerId === 'tolinkv1' && url.indexOf('tmpfiles.org/dl/') === -1) {
      direct = url.replace('tmpfiles.org/', 'tmpfiles.org/dl/');
    }

    return NextResponse.json({
      success: true,
      provider: provider.host,
      retention: provider.retention,
      url,
      direct,
      filename,
      size: (blob as Blob).size,
      ms: Date.now() - start,
    });
  } catch (err) {
    if (err instanceof Error && err.message === 'too_big') {
      return NextResponse.json({ success: false, error: 'File maksimal 4MB.' }, { status: 413 });
    }
    if (err instanceof Error && err.message === 'bad_remote') {
      return NextResponse.json(
        { success: false, error: 'Gagal mengambil gambar dari URL tersebut.' },
        { status: 400 }
      );
    }
    const timeout = err instanceof Error && err.name === 'AbortError';
    return NextResponse.json(
      { success: false, error: timeout ? 'Upstream timeout. Coba lagi.' : 'Upload gagal. Coba lagi.' },
      { status: 502 }
    );
  }
}

export async function fetchRemoteFile(u: string): Promise<{ blob: Blob; filename: string }> {
  if (!/^https?:\/\//i.test(u)) throw new Error('bad_remote');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const r = await fetch(u, {
      signal: controller.signal,
      headers: { 'user-agent': UA, accept: 'image/*,*/*' },
      redirect: 'follow',
    });
    if (!r.ok || !r.body) throw new Error('bad_remote');
    const mime = (r.headers.get('content-type') || '').split(';')[0].trim();
    const chunks = await readCapped(r.body, MAX_UPLOAD_BYTES);
    const total = chunks.reduce((a, c) => a + c.length, 0);
    const merged = new Uint8Array(total);
    let off = 0;
    for (const c of chunks) {
      merged.set(c, off);
      off += c.length;
    }
    const path = u.split('?')[0];
    const base = path.substring(path.lastIndexOf('/') + 1) || 'upload';
    return { blob: new Blob([merged], { type: mime || 'application/octet-stream' }), filename: base };
  } catch (e) {
    if (e instanceof Error && (e.message === 'too_big' || e.message === 'bad_remote')) throw e;
    throw new Error('bad_remote');
  } finally {
    clearTimeout(timer);
  }
}
