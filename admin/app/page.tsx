'use client';

import { useEffect, useState, useCallback } from 'react';

/* ---------- ikon SVG mini (tanpa emoji) ---------- */
type IP = { size?: number; className?: string };
const base = (s = 18) => ({
  width: s,
  height: s,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2.2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
});
const PowerIcon = ({ size }: IP) => (
  <svg {...base(size)}><path d="M12 3v9" /><path d="M6.3 6.3a8 8 0 1 0 11.4 0" /></svg>
);
const BanIcon = ({ size }: IP) => (
  <svg {...base(size)}><circle cx="12" cy="12" r="9" /><path d="M5.6 5.6l12.8 12.8" /></svg>
);
const TrashIcon = ({ size }: IP) => (
  <svg {...base(size)}><path d="M4 7h16" /><path d="M9 7V5h6v2" /><path d="M6 7l1 13h10l1-13" /></svg>
);
const RefreshIcon = ({ size }: IP) => (
  <svg {...base(size)}><path d="M21 12a9 9 0 1 1-3-6.7" /><path d="M21 4v5h-5" /></svg>
);
const CheckIcon = ({ size }: IP) => (
  <svg {...base(size)}><path d="M20 6L9 17l-5-5" /></svg>
);
const XIcon = ({ size }: IP) => (
  <svg {...base(size)}><path d="M18 6L6 18" /><path d="M6 6l12 12" /></svg>
);
const ShieldIcon = ({ size }: IP) => (
  <svg {...base(size)}><path d="M12 3l8 3v6c0 5-3.4 8.2-8 9-4.6-.8-8-4-8-9V6z" /></svg>
);
const UsersIcon = ({ size }: IP) => (
  <svg {...base(size)}><circle cx="9" cy="8" r="3" /><path d="M3 20a6 6 0 0 1 12 0" /><path d="M16 6a3 3 0 0 1 0 6" /><path d="M18 20a6 6 0 0 0-3-5" /></svg>
);
const ListIcon = ({ size }: IP) => (
  <svg {...base(size)}><path d="M8 6h13" /><path d="M8 12h13" /><path d="M8 18h13" /><path d="M3 6h.01" /><path d="M3 12h.01" /><path d="M3 18h.01" /></svg>
);
const LogoutIcon = ({ size }: IP) => (
  <svg {...base(size)}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5" /><path d="M21 12H9" /></svg>
);
const SunIcon = ({ size }: IP) => (
  <svg {...base(size)}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M6.5 17.5L5 19" /></svg>
);
const MoonIcon = ({ size }: IP) => (
  <svg {...base(size)}><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" /></svg>
);

/* ---------- tipe data ---------- */
interface Visitor { ip: string; count: number; lastSeen: number; blocked: boolean }
interface Req { id: string; nama: string; api: string; desc: string; at: number; status: string }
interface State { maintenance: boolean; blocklist: string[]; visitors: Visitor[]; requests: Req[] }

const STATUS_COLOR: Record<string, string> = {
  baru: '#facc15',
  proses: '#fb923c',
  selesai: '#4ade80',
  ditolak: '#ef4444',
};

function fmt(ts: number) {
  if (!ts) return '—';
  return new Date(ts).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' });
}

export default function AdminPage() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [pw, setPw] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [data, setData] = useState<State | null>(null);
  const [blockInput, setBlockInput] = useState('');
  const [reqFilter, setReqFilter] = useState('semua');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const saved = localStorage.getItem('wanz-admin-theme');
    if (saved === 'dark') setTheme('dark');
  }, []);
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('wanz-admin-theme', theme);
  }, [theme]);

  const load = useCallback(async () => {
    const res = await fetch('/api/state', { cache: 'no-store' });
    if (res.status === 401) { setAuthed(false); return; }
    const j = await res.json().catch(() => null);
    if (res.ok && j?.success) { setData(j); setAuthed(true); }
    else setErr(j?.error || 'Gagal memuat.');
  }, []);

  useEffect(() => { load(); }, [load]);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr('');
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action: 'login', password: pw }),
    });
    const j = await res.json().catch(() => ({}));
    setBusy(false);
    if (res.ok && j.success) { setPw(''); setAuthed(true); load(); }
    else setErr(j.error || 'Login gagal.');
  }

  async function logout() {
    await fetch('/api/auth', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'logout' }) });
    setAuthed(false); setData(null);
  }

  async function act(payload: Record<string, unknown>) {
    setBusy(true); setErr('');
    const res = await fetch('/api/state', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const j = await res.json().catch(() => ({}));
    setBusy(false);
    if (res.ok && j.success) load();
    else setErr(j.error || 'Aksi gagal.');
  }

  /* ================= LOGIN ================= */
  if (authed === null) {
    return <Shell><div style={{ textAlign: 'center', padding: '60px 0' }}><span className="spin"><RefreshIcon size={28} /></span><p className="muted" style={{ marginTop: 10 }}>Memuat…</p></div></Shell>;
  }
  if (authed === false) {
    return (
      <Shell>
        <form onSubmit={login} className="neo-card" style={{ maxWidth: 380, margin: '80px auto', padding: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12, color: 'var(--accent-yellow)' }}><ShieldIcon size={40} /></div>
          <h1 style={{ textAlign: 'center', fontSize: '1.5rem', fontWeight: 800, marginBottom: 4 }}>Panel Admin</h1>
          <p className="muted" style={{ textAlign: 'center', marginBottom: 20, fontSize: '.9rem' }}>Wanz REST API — akses terbatas.</p>
          <input className="neo-input" type="password" placeholder="Password admin" value={pw} onChange={(e) => setPw(e.target.value)} autoFocus />
          {err && <p style={{ color: 'var(--accent-red)', fontWeight: 700, marginTop: 12 }}>{err}</p>}
          <button className="neo-button" type="submit" disabled={busy || !pw} style={{ width: '100%', justifyContent: 'center', marginTop: 16 }}>
            {busy ? 'Memeriksa…' : 'Masuk'}
          </button>
        </form>
      </Shell>
    );
  }

  /* ================= DASHBOARD ================= */
  const visitors = data?.visitors || [];
  const requests = (data?.requests || []).filter((r) => reqFilter === 'semua' || r.status === reqFilter);
  const blockedCount = data?.blocklist.length || 0;
  const newReq = (data?.requests || []).filter((r) => r.status === 'baru').length;

  return (
    <Shell
      right={
        <div className="row">
          <button className="neo-button ghost" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} title="Ganti tema">
            {theme === 'dark' ? <SunIcon size={16} /> : <MoonIcon size={16} />}
          </button>
          <button className="neo-button ghost" onClick={load} title="Muat ulang"><RefreshIcon size={16} /></button>
          <button className="neo-button red" onClick={logout}><LogoutIcon size={16} /> Keluar</button>
        </div>
      }
    >
      {err && (
        <div className="neo-card" style={{ padding: '12px 16px', marginBottom: 18, borderColor: 'var(--accent-red)', color: 'var(--accent-red)', fontWeight: 700 }}>
          {err}
        </div>
      )}

      {/* Statistik ringkas */}
      <div className="grid">
        <Stat label="Total IP tercatat" value={visitors.length} Icon={UsersIcon} />
        <Stat label="IP diblokir" value={blockedCount} Icon={BanIcon} />
        <Stat label="Request masuk" value={data?.requests.length || 0} Icon={ListIcon} />
        <Stat label="Request baru" value={newReq} Icon={CheckIcon} />
      </div>

      {/* Maintenance */}
      <div className="neo-card" style={{ padding: 20, marginTop: 22 }}>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <div className="row">
            <PowerIcon size={22} />
            <div>
              <div style={{ fontWeight: 800 }}>Mode Perawatan</div>
              <div className="muted" style={{ fontSize: '.85rem' }}>Kalau aktif, situs & API publik balik 503 untuk semua.</div>
            </div>
          </div>
          <button
            className={`neo-button ${data?.maintenance ? 'red' : 'mint'}`}
            disabled={busy}
            onClick={() => act({ action: 'maintenance', on: !data?.maintenance })}
          >
            {data?.maintenance ? 'Nonaktifkan' : 'Aktifkan'}
          </button>
        </div>
        <div style={{ marginTop: 12 }}>
          <span className="neo-badge" style={{ background: data?.maintenance ? '#ef4444' : '#4ade80' }}>
            Status: {data?.maintenance ? 'PERAWATAN' : 'AKTIF (normal)'}
          </span>
        </div>
      </div>

      {/* Blokir IP manual */}
      <div className="neo-card" style={{ padding: 20, marginTop: 22 }}>
        <div className="row" style={{ marginBottom: 12 }}>
          <BanIcon size={22} />
          <div style={{ fontWeight: 800 }}>Blokir IP manual</div>
        </div>
        <div className="row">
          <input className="neo-input" style={{ flex: 1, minWidth: 200 }} placeholder="Misal: 1.2.3.4" value={blockInput} onChange={(e) => setBlockInput(e.target.value)} />
          <button className="neo-button red" disabled={busy || !blockInput.trim()} onClick={() => { act({ action: 'block', ip: blockInput.trim() }); setBlockInput(''); }}>
            Blokir
          </button>
        </div>
        {blockedCount > 0 && (
          <div className="row" style={{ marginTop: 14 }}>
            {data?.blocklist.map((ip) => (
              <span key={ip} className="neo-badge" style={{ background: '#ef4444', color: '#fff' }}>
                <span className="mono">{ip}</span>
                <button onClick={() => act({ action: 'unblock', ip })} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex' }} title="Buka blokir"><XIcon size={14} /></button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Log IP pengunjung */}
      <div className="neo-card" style={{ padding: 20, marginTop: 22 }}>
        <div className="row" style={{ justifyContent: 'space-between', marginBottom: 12 }}>
          <div className="row"><UsersIcon size={22} /><div style={{ fontWeight: 800 }}>IP yang masuk</div></div>
          {visitors.length > 0 && (
            <button className="neo-button ghost" style={{ fontSize: '.82rem', padding: '6px 12px' }} disabled={busy} onClick={() => act({ action: 'clear_visitors' })}>
              <TrashIcon size={14} /> Bersihkan log
            </button>
          )}
        </div>
        {visitors.length === 0 ? (
          <p className="muted">Belum ada kunjungan tercatat.</p>
        ) : (
          <div className="tablewrap">
            <table>
              <thead><tr><th>IP</th><th>Kunjungan</th><th>Terakhir</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {visitors.map((v) => (
                  <tr key={v.ip}>
                    <td className="mono">{v.ip}</td>
                    <td>{v.count}×</td>
                    <td>{fmt(v.lastSeen)}</td>
                    <td>
                      <span className="neo-badge" style={{ background: v.blocked ? '#ef4444' : '#4ade80', color: v.blocked ? '#fff' : '#1a1a1a' }}>
                        {v.blocked ? 'diblokir' : 'normal'}
                      </span>
                    </td>
                    <td>
                      <button className={`neo-button ${v.blocked ? 'mint' : 'red'}`} style={{ fontSize: '.78rem', padding: '5px 10px' }} disabled={busy} onClick={() => act({ action: v.blocked ? 'unblock' : 'block', ip: v.ip })}>
                        {v.blocked ? 'Buka' : 'Blokir'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Request API */}
      <div className="neo-card" style={{ padding: 20, marginTop: 22, marginBottom: 40 }}>
        <div className="row" style={{ justifyContent: 'space-between', marginBottom: 12 }}>
          <div className="row"><ListIcon size={22} /><div style={{ fontWeight: 800 }}>Request API dari pengunjung</div></div>
          <div className="row">
            {['semua', 'baru', 'proses', 'selesai', 'ditolak'].map((s) => (
              <button key={s} onClick={() => setReqFilter(s)} className="neo-badge" style={{ background: reqFilter === s ? 'var(--accent-purple)' : 'var(--card-bg)', color: reqFilter === s ? '#fff' : 'var(--text-primary)', cursor: 'pointer' }}>
                {s}
              </button>
            ))}
          </div>
        </div>
        {requests.length === 0 ? (
          <p className="muted">Tidak ada request dengan filter ini.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {requests.map((r) => (
              <div key={r.id} className="neo-card" style={{ padding: 16, boxShadow: '3px 3px 0 var(--shadow-color)' }}>
                <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1, minWidth: 220 }}>
                    <div className="row" style={{ marginBottom: 4 }}>
                      <span style={{ fontWeight: 800 }}>{r.api}</span>
                      <span className="neo-badge" style={{ background: STATUS_COLOR[r.status] || '#ccc', color: r.status === 'baru' ? '#1a1a1a' : '#fff' }}>{r.status}</span>
                    </div>
                    {r.desc && <p className="muted" style={{ fontSize: '.9rem', marginBottom: 4 }}>{r.desc}</p>}
                    <div className="muted" style={{ fontSize: '.8rem' }}>oleh <b>{r.nama}</b> • {fmt(r.at)}</div>
                  </div>
                  <div className="row" style={{ justifyContent: 'flex-end' }}>
                    {r.status !== 'proses' && <button className="neo-button" style={{ fontSize: '.78rem', padding: '6px 10px' }} disabled={busy} onClick={() => act({ action: 'req_status', id: r.id, status: 'proses' })}>Proses</button>}
                    {r.status !== 'selesai' && <button className="neo-button mint" style={{ fontSize: '.78rem', padding: '6px 10px' }} disabled={busy} onClick={() => act({ action: 'req_status', id: r.id, status: 'selesai' })}>Selesai</button>}
                    {r.status !== 'ditolak' && <button className="neo-button ghost" style={{ fontSize: '.78rem', padding: '6px 10px' }} disabled={busy} onClick={() => act({ action: 'req_status', id: r.id, status: 'ditolak' })}>Tolak</button>}
                    <button className="neo-button red" style={{ fontSize: '.78rem', padding: '6px 10px' }} disabled={busy} onClick={() => act({ action: 'req_delete', id: r.id })}><TrashIcon size={14} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Shell>
  );
}

/* ---------- layout kecil ---------- */
function Shell({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh' }}>
      <header style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--card-bg)', borderBottom: '3px solid var(--border-color)' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div className="row">
            <span style={{ color: 'var(--accent-yellow)', display: 'flex' }}><ShieldIcon size={22} /></span>
            <b>Wanz • Panel Admin</b>
          </div>
          {right}
        </div>
      </header>
      <main style={{ maxWidth: 1000, margin: '0 auto', padding: '20px 16px 40px' }}>{children}</main>
    </div>
  );
}

function Stat({ label, value, Icon }: { label: string; value: number; Icon: (p: IP) => JSX.Element }) {
  return (
    <div className="neo-card" style={{ padding: 16 }}>
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 6 }}>
        <span className="muted" style={{ fontSize: '.82rem', fontWeight: 700 }}>{label}</span>
        <span style={{ color: 'var(--accent-purple)', display: 'flex' }}><Icon size={18} /></span>
      </div>
      <div style={{ fontSize: '2rem', fontWeight: 800, lineHeight: 1 }}>{value}</div>
    </div>
  );
}
