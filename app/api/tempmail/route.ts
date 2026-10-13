import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 30;

/**
 * Temp-mail sementara via mail.tm (API publik resmi, tanpa API key).
 * Kita bikin akun mail.tm per-request, jadi pengguna tetap keyless.
 *
 * GET /api/tempmail                 -> bikin alamat baru
 * GET /api/tempmail?action=inbox&address=&password=   -> baca kotak masuk
 * GET /api/tempmail?action=read&address=&password=&id= -> isi satu email
 */

const API = 'https://api.mail.tm';

const UA = { 'user-agent': 'wanz-rest-api/1.0 (+https://rest-api-wanz-codex.vercel.app)' };

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}
function err(message: string, status = 400) {
  return json({ success: false, error: message }, status);
}

// mail.tm membalas JSON-LD: list kadang di "hydra:member", kadang array biasa
function list(data: unknown): Record<string, unknown>[] {
  if (Array.isArray(data)) return data as Record<string, unknown>[];
  if (data && typeof data === 'object' && Array.isArray((data as Record<string, unknown>)['hydra:member']))
    return (data as Record<string, unknown>)['hydra:member'] as Record<string, unknown>[];
  return [];
}

async function apiFetch(path: string, init: RequestInit = {}) {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: { accept: 'application/json', ...UA, ...(init.headers || {}) },
    signal: AbortSignal.timeout(20_000),
  });
  const text = await res.text();
  let body: unknown = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  return { res, body };
}

function rand(n: number) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let s = '';
  const buf = new Uint8Array(n);
  crypto.getRandomValues(buf);
  for (let i = 0; i < n; i++) s += chars[buf[i] % chars.length];
  return s;
}

// mail.tm perlu token JWT (login) buat baca pesan. Kita login pakai address+password.
async function getToken(address: string, password: string): Promise<string> {
  const { res, body } = await apiFetch('/token', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ address, password }),
  });
  if (!res.ok) throw new Error('Gagal login ke kotak masuk (alamat/password salah atau kedaluwarsa).');
  return (body as { token: string }).token;
}

export async function GET(req: NextRequest) {
  try {
    const p = req.nextUrl.searchParams;
    const action = p.get('action') || 'create';

    if (action === 'create') {
      // 1. ambil domain aktif
      const d = await apiFetch('/domains');
      if (!d.res.ok) return err('Gagal mengambil domain mail.tm.', 502);
      const domains = list(d.body).filter((x) => x.isActive && !x.isPrivate);
      if (!domains.length) return err('Tidak ada domain tersedia.', 502);
      const domain = String(domains[0].domain);

      // 2. bikin alamat + password acak
      const address = `wanz-${rand(10)}@${domain}`;
      const password = `Wz-${rand(16)}`;
      const created = await apiFetch('/accounts', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ address, password }),
      });
      if (!created.res.ok) {
        const msg = created.res.status === 429 ? 'Rate limit mail.tm, coba lagi nanti.' : 'Gagal membuat alamat.';
        return err(msg, created.res.status === 429 ? 429 : 502);
      }
      // 3. verifikasi bisa login (ambil token) biar alamat pasti kepakai
      try {
        await getToken(address, password);
      } catch {
        return err('Alamat dibuat tapi gagal diverifikasi.', 502);
      }
      return json({ success: true, address, password, domain, expires: '± 1 jam' });
    }

    const address = p.get('address')?.trim().toLowerCase();
    const password = p.get('password')?.trim();
    if (!address || !password) return err('Param address & password wajib diisi.');

    const token = await getToken(address, password);
    const auth = { authorization: `Bearer ${token}` };

    if (action === 'inbox') {
      const { res, body } = await apiFetch('/messages?page=1', { headers: auth });
      if (!res.ok) return err('Gagal membaca kotak masuk.', 502);
      const msgs = list(body).map((m) => ({
        id: m.id,
        from: (m.from as Record<string, string>)?.address,
        subject: m.subject,
        intro: m.intro,
        seen: m.seen,
        createdAt: m.createdAt,
      }));
      return json({ success: true, count: msgs.length, emails: msgs });
    }

    if (action === 'read') {
      const id = p.get('id')?.trim();
      if (!id || !/^[a-f0-9]{24}$/i.test(id)) return err('Param id tidak valid.');
      const { res, body } = await apiFetch(`/messages/${id}`, { headers: auth });
      if (!res.ok) return err('Email tidak ditemukan.', 404);
      const m = body as Record<string, unknown>;
      return json({
        success: true,
        email: {
          id: m.id,
          from: (m.from as Record<string, string>)?.address,
          subject: m.subject,
          text: m.text,
          html: Array.isArray(m.html) ? m.html.join('\n') : m.html,
          createdAt: m.createdAt,
        },
      });
    }

    return err('Action tidak dikenal. Gunakan: create | inbox | read');
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Kesalahan server temp-mail.';
    return err(msg, 500);
  }
}
