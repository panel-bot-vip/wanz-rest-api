import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 30;

/**
 * Cek host sebuah web: IP, provider/hosting, lokasi, status HTTP, registrar.
 * Sumber data keyless publik:
 *  - DoH dns.google  -> resolve A & nameserver
 *  - ipwho.is        -> geo + ASN/org/ISP dari IP
 *  - rdap.org        -> registrar + tanggal daftar/berlaku
 *  - fetch langsung   -> status & waktu respon
 *
 * GET /api/host-check?url=https://contoh.com
 */

const DOH = 'https://dns.google/resolve';

function json(d: unknown, status = 200) {
  return NextResponse.json(d, { status });
}

function extractHostname(raw: string): string | null {
  let s = raw.trim();
  if (!s) return null;
  if (!/^https?:\/\//i.test(s)) s = 'http://' + s;
  try {
    const u = new URL(s);
    return u.hostname.toLowerCase().replace(/^\[|\]$/g, '') || null;
  } catch {
    return null;
  }
}

function isPrivateHost(host: string): boolean {
  if (!host) return true;
  if (host === 'localhost' || host === '0.0.0.0' || host === '::1') return true;
  if (host.endsWith('.local') || host.endsWith('.internal') || host.endsWith('.localhost')) return true;
  if (/^127\./.test(host)) return true;
  if (/^10\./.test(host)) return true;
  if (/^192\.168\./.test(host)) return true;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(host)) return true;
  if (/^169\.254\./.test(host)) return true;
  if (/^0\./.test(host)) return true;
  if (/^(f[c-d]|fe80|::)/i.test(host)) return true; // IPv6 private/reserved
  return false;
}

function isIPv4(host: string): boolean {
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(host);
}

async function doh(name: string, type: string): Promise<string[]> {
  try {
    const res = await fetch(`${DOH}?name=${encodeURIComponent(name)}&type=${type}`, {
      headers: { accept: 'application/json' },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    const d = (await res.json()) as { Answer?: { data?: string; type?: number }[] };
    return (d.Answer ?? [])
      .filter((a) => typeof a.data === 'string')
      .map((a) => String(a.data).replace(/\.$/, ''));
  } catch {
    return [];
  }
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const raw = (sp.get('url') ?? sp.get('domain') ?? sp.get('host') ?? '').trim();
  if (!raw) return json({ success: false, error: 'Parameter wajib: ?url=<situs>' }, 400);
  if (raw.length > 300) return json({ success: false, error: 'URL terlalu panjang.' }, 400);

  const domain = extractHostname(raw);
  if (!domain) return json({ success: false, error: 'URL/domain tidak valid.' }, 400);
  if (isPrivateHost(domain)) return json({ success: false, error: 'Domain ditolak (internal/private).' }, 400);

  // resolve IP
  let ips: string[] = [];
  let nameservers: string[] = [];
  if (isIPv4(domain)) {
    ips = [domain];
  } else {
    ips = await doh(domain, 'A');
    if (!ips.length) ips = await doh(domain, 'AAAA');
    nameservers = await doh(domain, 'NS');
  }
  ips = ips.filter((ip) => !isPrivateHost(ip)).slice(0, 4);
  const ip = ips[0] ?? null;

  // cek HTTP (fetch langsung, guard IP publik)
  let http: Record<string, unknown> = { checked: false };
  if (ip && !isPrivateHost(ip)) {
    const proto = /^https:\/\//i.test(raw) || !/^http:\/\//i.test(raw) ? 'https' : 'http';
    const target = `${proto}://${domain}/`;
    const t0 = Date.now();
    try {
      const res = await fetch(target, {
        redirect: 'follow',
        headers: { 'user-agent': 'Mozilla/5.0 (compatible; wanz-rest-api/1.0)' },
        signal: AbortSignal.timeout(12000),
      });
      const ms = Date.now() - t0;
      http = {
        checked: true,
        ok: res.ok,
        status: res.status,
        responseTimeMs: ms,
        server: res.headers.get('server'),
        poweredBy: res.headers.get('x-powered-by'),
        contentType: res.headers.get('content-type'),
        finalUrl: res.url,
      };
      void res.body?.cancel().catch(() => {});
    } catch (e) {
      http = {
        checked: true,
        ok: false,
        error: e instanceof Error && e.name === 'TimeoutError' ? 'Timeout' : 'Tidak bisa diakses',
        responseTimeMs: Date.now() - t0,
      };
    }
  }

  // geo + provider dari IP
  let geo: Record<string, unknown> = {};
  if (ip) {
    try {
      const res = await fetch(`https://ipwho.is/${encodeURIComponent(ip)}`, {
        headers: { accept: 'application/json' },
        signal: AbortSignal.timeout(8000),
      });
      const d = (await res.json()) as Record<string, any>;
      if (d.success) {
        const c = (d.connection ?? {}) as Record<string, unknown>;
        geo = {
          ip: d.ip,
          country: d.country,
          region: d.region,
          city: d.city,
          timezone: (d.timezone as Record<string, unknown>)?.id,
          asn: c.asn,
          org: c.org,
          isp: c.isp,
        };
      }
    } catch {
      /* abaikan */
    }
  }

  // registrar via RDAP (best-effort)
  let whois: Record<string, unknown> = {};
  if (!isIPv4(domain)) {
    try {
      const res = await fetch(`https://rdap.org/domain/${encodeURIComponent(domain)}`, {
        headers: {
          accept: 'application/rdap+json',
          'user-agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
        },
        redirect: 'follow',
        signal: AbortSignal.timeout(12000),
      });
      if (res.ok) {
        const d = (await res.json()) as Record<string, any>;
        const evs: { eventAction?: string; eventDate?: string }[] = Array.isArray(d.events) ? d.events : [];
        const find = (k: string) => evs.find((e) => e.eventAction === k)?.eventDate;
        const registrarEnt = (Array.isArray(d.entities) ? d.entities : []).find(
          (en: Record<string, any>) => Array.isArray(en.roles) && en.roles.includes('registrar'),
        );
        const vcard = registrarEnt?.vcardArray?.[1]?.find((x: any[]) => x?.[0] === 'fn')?.[3];
        whois = {
          domain: d.ldhName,
          registrar: vcard ?? null,
          created: find('registration') ?? null,
          expires: find('expiration') ?? null,
          updated: find('last changed') ?? null,
          status: Array.isArray(d.status) ? d.status : [],
        };
      }
    } catch {
      /* abaikan */
    }
  }

  const serverStr = String((http as Record<string, any>).server ?? '').toLowerCase();
  const cloudflare =
    serverStr.includes('cloudflare') || nameservers.some((ns) => ns.toLowerCase().includes('cloudflare'));

  return json({
    success: true,
    domain,
    dns: { resolved: ips.length > 0, ips, nameservers },
    http,
    geo,
    whois,
    cloudflare,
  });
}
