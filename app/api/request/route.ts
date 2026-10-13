import { NextRequest, NextResponse } from 'next/server';
import { submitRequest, kvReady } from '@/lib/kv';

const SECRET = process.env.TURNSTILE_SECRET_KEY;

async function verifyTurnstile(token: string): Promise<boolean> {
  if (!SECRET) return true; // belum dipasang -> lewati (jangan blokir fitur)
  try {
    const fd = new URLSearchParams();
    fd.append('secret', SECRET);
    fd.append('response', token);
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: fd,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    const data = await res.json();
    return !!data.success;
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!kvReady()) {
      return NextResponse.json(
        { success: false, error: 'Fitur request belum tersedia saat ini.' },
        { status: 503 }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body.api !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Data tidak lengkap.' },
        { status: 400 }
      );
    }

    const api = body.api.trim();
    if (api.length < 3) {
      return NextResponse.json(
        { success: false, error: 'Jelaskan API yang diminta minimal 3 karakter.' },
        { status: 400 }
      );
    }

    if (typeof body.token === 'string' && body.token && !(await verifyTurnstile(body.token))) {
      return NextResponse.json(
        { success: false, error: 'Verifikasi anti-spam gagal. Coba lagi.' },
        { status: 400 }
      );
    }

    const item = await submitRequest({
      nama: typeof body.nama === 'string' ? body.nama : '',
      api,
      desc: typeof body.desc === 'string' ? body.desc : '',
    });

    return NextResponse.json({ success: true, id: item.id });
  } catch (e) {
    console.error('request route error:', e);
    return NextResponse.json(
      { success: false, error: 'Gagal mengirim request. Coba lagi.' },
      { status: 500 }
    );
  }
}
