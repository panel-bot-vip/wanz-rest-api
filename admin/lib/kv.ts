import { Redis } from '@upstash/redis';

/**
 * State persisten (Upstash Redis) — dipakai juga oleh situs publik.
 * Panel admin dan situs publik saling terhubung lewat database yang sama:
 *  - maintenance flag, blocklist, log IP, & request API.
 * *Sumber kebenaran tunggal. Jangan diganti sembarangan.
 */

const URL = process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

let _r: Redis | null = null;
function r(): Redis | null {
  if (!URL || !TOKEN) return null;
  if (!_r) _r = new Redis({ url: URL, token: TOKEN });
  return _r;
}
export function kvReady(): boolean {
  return !!r();
}

/**
 * Normalisasi nilai dari Redis.
 * @upstash/redis bisa mbalikin '1' (string), 1 (number), atau '"1"' (raw JSON)
 * tergantung mode serialisasi — supaya perbandingan scalar gak pernah salah.
 */
function norm(v: unknown): string {
  if (v === null || v === undefined) return '';
  return String(v).replace(/^"|"$/g, '');
}

/* ---------- MAINTENANCE ---------- */
export async function getMaintenance(): Promise<boolean> {
  const c = r();
  if (!c) return false;
  try {
    const v = await c.get('wanz:maintenance');
    return norm(v) === '1';
  } catch {
    return false;
  }
}
export async function setMaintenance(on: boolean): Promise<void> {
  const c = r();
  if (!c) throw new Error('Upstash Redis belum diatur di server.');
  await c.set('wanz:maintenance', on ? '1' : '0');
}

/* ---------- BLOCKLIST ---------- */
export async function getBlocklist(): Promise<string[]> {
  const c = r();
  if (!c) return [];
  try {
    const arr = (await c.smembers('wanz:blocklist')) || [];
    return arr.map(String).sort();
  } catch {
    return [];
  }
}
export async function blockIp(ip: string): Promise<void> {
  const c = r();
  if (!c) throw new Error('Upstash Redis belum diatur di server.');
  await c.sadd('wanz:blocklist', ip);
}
export async function unblockIp(ip: string): Promise<void> {
  const c = r();
  if (!c) throw new Error('Upstash Redis belum diatur di server.');
  await c.srem('wanz:blocklist', ip);
}

/* ---------- KUNJUNGAN (LOG IP) ---------- */
export interface Visitor {
  ip: string;
  count: number;
  lastSeen: number;
  blocked: boolean;
}
export async function getVisitors(): Promise<Visitor[]> {
  const c = r();
  if (!c) return [];
  const [counts, lasts, blocked] = await Promise.all([
    c.hgetall<Record<string, number>>('wanz:vcount'),
    c.hgetall<Record<string, number>>('wanz:vlast'),
    getBlocklist(),
  ]);
  const cm = counts || {};
  const lm = lasts || {};
  const blockedSet = new Set(blocked);
  const ips = new Set([...Object.keys(cm), ...Object.keys(lm)]);
  const list: Visitor[] = [];
  ips.forEach((ip) =>
    list.push({
      ip,
      count: cm[ip] || 0,
      lastSeen: lm[ip] || 0,
      blocked: blockedSet.has(ip),
    })
  );
  list.sort((a, b) => b.lastSeen - a.lastSeen);
  return list;
}
export async function clearVisitors(): Promise<void> {
  const c = r();
  if (!c) throw new Error('Upstash Redis belum diatur di server.');
  await c.del('wanz:vcount', 'wanz:vlast');
}

/* ---------- REQUEST API (dari pengunjung) ---------- */
export type ReqStatus = 'baru' | 'proses' | 'selesai' | 'ditolak';
export interface ApiRequestItem {
  id: string;
  nama: string;
  api: string;
  desc: string;
  at: number;
  status: ReqStatus;
}
export async function getRequests(): Promise<ApiRequestItem[]> {
  const c = r();
  if (!c) return [];
  const all = (await c.hgetall<Record<string, string>>('wanz:req')) || {};
  const list: ApiRequestItem[] = [];
  Object.values(all).forEach((v) => {
    try {
      list.push(JSON.parse(v));
    } catch {
      /* skip entri rusak */
    }
  });
  list.sort((a, b) => b.at - a.at);
  return list;
}
export async function setRequestStatus(id: string, status: ReqStatus): Promise<void> {
  const c = r();
  if (!c) throw new Error('Upstash Redis belum diatur di server.');
  const raw = await c.hget<string>('wanz:req', id);
  if (!raw) throw new Error('Request tidak ditemukan.');
  const item: ApiRequestItem = JSON.parse(raw);
  item.status = status;
  await c.hset('wanz:req', { [id]: JSON.stringify(item) });
}
export async function deleteRequest(id: string): Promise<void> {
  const c = r();
  if (!c) throw new Error('Upstash Redis belum diatur di server.');
  await c.hdel('wanz:req', id);
}

/* ---------- ADMIN SESSION ---------- */
const SES_TTL = 60 * 60 * 24; // 24 jam
export const SESSION_COOKIE = 'wanz_admin';

export function verifyPassword(pw: string): boolean {
  const admin = process.env.ADMIN_PASSWORD;
  return !!admin && pw === admin;
}
function randToken(): string {
  const b = new Uint8Array(24);
  crypto.getRandomValues(b);
  return Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
}
export async function createSession(): Promise<string> {
  const c = r();
  if (!c) throw new Error('Upstash Redis belum diatur di server.');
  const token = randToken();
  await c.set(`wanz:ses:${token}`, '1', { ex: SES_TTL });
  return token;
}
export async function isValidSession(token: string | undefined | null): Promise<boolean> {
  if (!token) return false;
  const c = r();
  if (!c) return false;
  try {
    const v = await c.get(`wanz:ses:${token}`);
    return norm(v) === '1';
  } catch {
    return false;
  }
}
export async function destroySession(token: string | undefined | null): Promise<void> {
  const c = r();
  if (!c || !token) return;
  try {
    await c.del(`wanz:ses:${token}`);
  } catch {
    /* abaikan */
  }
}
