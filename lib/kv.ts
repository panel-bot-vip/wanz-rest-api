import { Redis } from '@upstash/redis';

/**
 * State persisten (Upstash Redis) untuk panel admin: maintenance, blocklist,
 * dan log IP pengunjung. Vercel serverless itu stateless, jadi butuh KV.
 *
 * Semua fungsi aman dipanggil walau env belum diatur -> men degrade (no-op),
 * supaya situs tetap jalan tanpa error sebelum Upstash dipasang.
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

/* ---------- cache in-memory (per instance) supaya jarang nembak Redis ---------- */
const CACHE_TTL = 3_000; // 3 dtk — biar toggle maintenance/blokir dari admin kerasa cepat
let maintCache: { val: boolean; at: number } | null = null;
let blockCache: { val: Set<string>; at: number } | null = null;

/* throttle tulis kunjungan: per IP cukup sekali per 60 dtk */
const visitThrottle = new Map<string, number>();
const VISIT_THROTTLE = 60_000;

/* ============================ MAINTENANCE ============================ */
export async function getMaintenance(): Promise<boolean> {
  const c = r();
  if (!c) return false;
  if (maintCache && Date.now() - maintCache.at < CACHE_TTL) return maintCache.val;
  try {
    const v = await c.get('wanz:maintenance');
    const val = String(v).replace(/^"|"$/g, '') === '1';
    maintCache = { val, at: Date.now() };
    return val;
  } catch {
    return maintCache ? maintCache.val : false;
  }
}
export async function setMaintenance(on: boolean): Promise<void> {
  const c = r();
  if (!c) throw new Error('Upstash Redis belum diatur di server.');
  await c.set('wanz:maintenance', on ? '1' : '0');
  maintCache = { val: on, at: Date.now() };
}

/* ============================ BLOCKLIST ============================ */
export async function getBlocklist(): Promise<Set<string>> {
  const c = r();
  if (!c) return new Set();
  if (blockCache && Date.now() - blockCache.at < CACHE_TTL) return blockCache.val;
  try {
    const arr = (await c.smembers('wanz:blocklist')) || [];
    const val = new Set(arr.map(String));
    blockCache = { val, at: Date.now() };
    return val;
  } catch {
    return blockCache ? blockCache.val : new Set();
  }
}
export async function blockIp(ip: string): Promise<void> {
  const c = r();
  if (!c) throw new Error('Upstash Redis belum diatur di server.');
  await c.sadd('wanz:blocklist', ip);
  blockCache = null;
}
export async function unblockIp(ip: string): Promise<void> {
  const c = r();
  if (!c) throw new Error('Upstash Redis belum diatur di server.');
  await c.srem('wanz:blocklist', ip);
  blockCache = null;
}

/* ============================ KUNJUNGAN (LOG IP) ============================ */
export async function recordVisit(ip: string): Promise<void> {
  const c = r();
  if (!c || !ip || ip === '0.0.0.0') return;
  const now = Date.now();
  const last = visitThrottle.get(ip);
  if (last && now - last < VISIT_THROTTLE) return;
  if (visitThrottle.size > 5000) visitThrottle.clear();
  visitThrottle.set(ip, now);
  try {
    await c.hincrby('wanz:vcount', ip, 1);
    await c.hset('wanz:vlast', { [ip]: now });
  } catch {
    /* jangan sampai gagal request hanya krn logging */
  }
}

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
  const ips = new Set([...Object.keys(cm), ...Object.keys(lm)]);
  const list: Visitor[] = [];
  ips.forEach((ip) =>
    list.push({
      ip,
      count: cm[ip] || 0,
      lastSeen: lm[ip] || 0,
      blocked: blocked.has(ip),
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

/* ============================ REQUEST API (dari pengunjung) ============================ */
export type ReqStatus = 'baru' | 'proses' | 'selesai' | 'ditolak';
export interface ApiRequestItem {
  id: string;
  nama: string;
  api: string;
  desc: string;
  at: number;
  status: ReqStatus;
}
const REQ_MAX = 400;

export async function submitRequest(input: { nama?: string; api: string; desc?: string }): Promise<ApiRequestItem> {
  const c = r();
  if (!c) throw new Error('Upstash Redis belum diatur di server.');
  const item: ApiRequestItem = {
    id: randToken().slice(0, 12),
    nama: (input.nama || 'Anonim').slice(0, 40),
    api: input.api.slice(0, 120),
    desc: (input.desc || '').slice(0, 500),
    at: Date.now(),
    status: 'baru',
  };
  await c.hset('wanz:req', { [item.id]: JSON.stringify(item) });
  // jaga agar tidak membengkak: buang entri terlama kalau lewat batas
  const keys = await c.hkeys('wanz:req');
  if (keys && keys.length > REQ_MAX) {
    const all = await getRequests();
    const drop = all.slice(REQ_MAX).map((x) => x.id);
    if (drop.length) await c.hdel('wanz:req', ...drop);
  }
  return item;
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

/* ============================ ADMIN SESSION ============================ */
const SES_TTL = 60 * 60 * 24; // 24 jam

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
    return (await c.get(`wanz:ses:${token}`)) === '1';
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
export function readSessionCookie(req: { headers: { get: (n: string) => string | null } }): string | null {
  const cookie = req.headers.get('cookie') || '';
  const m = cookie.match(/(?:^|;\s*)wanz_admin=([a-f0-9]+)/);
  return m ? m[1] : null;
}
