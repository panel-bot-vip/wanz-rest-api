import { NextRequest, NextResponse } from 'next/server';
import {
  verifyPassword,
  createSession,
  destroySession,
  kvReady,
  SESSION_COOKIE,
} from '@/lib/kv';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const action = body?.action;

    if (action === 'login') {
      if (!kvReady()) {
        return NextResponse.json(
          { success: false, error: 'Upstash Redis belum diatur di server.' },
          { status: 503 }
        );
      }
      const pw = typeof body?.password === 'string' ? body.password : '';
      if (!pw || !verifyPassword(pw)) {
        return NextResponse.json(
          { success: false, error: 'Password salah.' },
          { status: 401 }
        );
      }
      const token = await createSession();
      const res = NextResponse.json({ success: true });
      res.cookies.set(SESSION_COOKIE, token, {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24,
      });
      return res;
    }

    if (action === 'logout') {
      const token = req.cookies.get(SESSION_COOKIE)?.value;
      await destroySession(token);
      const res = NextResponse.json({ success: true });
      res.cookies.set(SESSION_COOKIE, '', { path: '/', maxAge: 0 });
      return res;
    }

    return NextResponse.json({ success: false, error: 'Aksi tidak dikenal.' }, { status: 400 });
  } catch (e) {
    console.error('auth route error:', e);
    return NextResponse.json({ success: false, error: 'Kesalahan server.' }, { status: 500 });
  }
}
