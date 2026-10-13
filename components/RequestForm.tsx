'use client';

import { useState } from 'react';
import TurnstileWidget from './TurnstileWidget';
import { CheckCircleIcon, FrownIcon } from './icons';

type State = 'idle' | 'sending' | 'ok' | 'err';

export default function RequestForm() {
  const [nama, setNama] = useState('');
  const [api, setApi] = useState('');
  const [desc, setDesc] = useState('');
  const [token, setToken] = useState('');
  const [state, setState] = useState<State>('idle');
  const [msg, setMsg] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (api.trim().length < 3) {
      setState('err');
      setMsg('Jelaskan API yang kamu mau minimal 3 karakter.');
      return;
    }
    setState('sending');
    setMsg('');
    try {
      const res = await fetch('/api/request', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ nama, api, desc, token }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setState('ok');
        setNama('');
        setApi('');
        setDesc('');
        setToken('');
      } else {
        setState('err');
        setMsg(data.error || 'Gagal mengirim. Coba lagi.');
      }
    } catch {
      setState('err');
      setMsg('Gagal mengirim. Periksa koneksi.');
    }
  }

  if (state === 'ok') {
    return (
      <div className="neo-card" style={{ padding: '28px', textAlign: 'center' }}>
        <CheckCircleIcon size={48} style={{ color: '#22c55e', marginBottom: '12px' }} />
        <h3 className="icon-text" style={{ fontWeight: 800, fontSize: '1.25rem', marginBottom: '6px' }}>
          Request Terkirim!
        </h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '18px' }}>
          Makasih! Request kamu udah masuk ke antrian admin dan bakal dipertimbangkan.
        </p>
        <button className="neo-button neo-button-secondary" onClick={() => setState('idle')}>
          Kirim Request Lagi
        </button>
      </div>
    );
  }

  return (
    <form className="neo-card" style={{ padding: '24px' }} onSubmit={submit}>
      <label style={{ display: 'block', fontWeight: 700, marginBottom: '6px' }}>
        Nama <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>(opsional)</span>
      </label>
      <input
        className="neo-input"
        style={{ marginBottom: '16px' }}
        placeholder="Misal: Wanz"
        value={nama}
        maxLength={40}
        onChange={(e) => setNama(e.target.value)}
      />

      <label style={{ display: 'block', fontWeight: 700, marginBottom: '6px' }}>
        API apa yang kamu butuh? <span style={{ color: '#ef4444' }}>*</span>
      </label>
      <input
        className="neo-input"
        style={{ marginBottom: '16px' }}
        placeholder="Misal: Download video TikTok tanpa watermark"
        value={api}
        maxLength={120}
        onChange={(e) => setApi(e.target.value)}
        required
      />

      <label style={{ display: 'block', fontWeight: 700, marginBottom: '6px' }}>
        Deskripsi / contoh sumber <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>(opsional)</span>
      </label>
      <textarea
        className="neo-input"
        style={{ marginBottom: '16px', minHeight: '90px', resize: 'vertical' }}
        placeholder="Kalau ada link sumber atau detail, tulis di sini biar gampang dibikin."
        value={desc}
        maxLength={500}
        onChange={(e) => setDesc(e.target.value)}
      />

      <div style={{ marginBottom: '16px' }}>
        <TurnstileWidget onVerify={setToken} onExpire={() => setToken('')} action="request" />
      </div>

      {state === 'err' && msg && (
        <p
          className="icon-text"
          style={{ color: '#ef4444', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <FrownIcon size={18} /> {msg}
        </p>
      )}

      <button type="submit" className="neo-button" style={{ width: '100%', justifyContent: 'center' }} disabled={state === 'sending'}>
        {state === 'sending' ? 'Mengirim…' : 'Kirim Request API'}
      </button>
    </form>
  );
}
