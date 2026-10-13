import { NextRequest, NextResponse } from 'next/server';
import { isValidSession, SESSION_COOKIE } from './kv';

/**
 * Penjaga rute admin: baca cookie sesi, validasi ke Redis.
 * Return token kalau valid, atau null (401).
 */
export async function requireAdmin(req: NextRequest): Promise<string | null> {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const ok = await isValidSession(token);
  return ok ? (token as string) : null;
}

export function unauthorized() {
  return NextResponse.json({ success: false, error: 'Belum login.' }, { status: 401 });
}
