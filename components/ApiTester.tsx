'use client';

import { useState, useEffect, useCallback } from 'react';
import TurnstileWidget from './TurnstileWidget';
import type { Endpoint } from '@/lib/endpoints';

interface ApiTesterProps {
  endpoint: Endpoint;
}

export default function ApiTester({ endpoint }: ApiTesterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [paramValues, setParamValues] = useState<Record<string, string>>({});
  const [verified, setVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<{
    status: number;
    data: unknown;
    ms: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setParamValues({});
    setVerified(false);
    setResponse(null);
    setError(null);
  }, [endpoint]);

  const handleVerify = useCallback((token: string) => {
    if (token) setVerified(true);
  }, []);

  const handleExpire = useCallback(() => {
    setVerified(false);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verified) {
      setError('Silakan verifikasi captcha terlebih dahulu!');
      return;
    }

    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const queryParams = new URLSearchParams();
      endpoint.params.forEach((p) => {
        const val = paramValues[p.name] || p.default || '';
        if (val) queryParams.append(p.name, val);
      });

      const url = `${endpoint.path}?${queryParams.toString()}`;
      const start = performance.now();
      const res = await fetch(url);
      const data = await res.json();
      const ms = Math.round(performance.now() - start);

      setResponse({ status: res.status, data, ms });
    } catch (err) {
      setError('Terjadi kesalahan saat memanggil API');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="neo-button neo-button-purple"
        style={{ padding: '8px 16px', fontSize: '0.875rem' }}
      >
        🧪 Uji Coba
      </button>

      {isOpen && (
        <div className="modal-overlay" onClick={() => setIsOpen(false)}>
          <div className="modal-content pop-in" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                🧪 Uji Coba API
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'var(--accent-orange)',
                  border: '2px solid var(--border-color)',
                  borderRadius: '8px',
                  width: '32px',
                  height: '32px',
                  cursor: 'pointer',
                  fontWeight: 700,
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <span className="method-badge">{endpoint.method}</span>
              <code className="mono" style={{ marginLeft: '8px', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                {endpoint.path}
              </code>
            </div>

            <form onSubmit={handleSubmit}>
              {endpoint.params.map((param) => (
                <div key={param.name} style={{ marginBottom: '16px' }}>
                  <label
                    style={{ display: 'block', fontWeight: 600, marginBottom: '6px', color: 'var(--text-primary)' }}
                  >
                    {param.name}
                    {param.required && <span style={{ color: 'var(--accent-orange)' }}> *</span>}
                    <span
                      className="mono"
                      style={{ fontWeight: 400, fontSize: '0.75rem', color: 'var(--text-secondary)', marginLeft: '8px' }}
                    >
                      ({param.type}) — {param.description}
                    </span>
                  </label>
                  <input
                    type="text"
                    className="neo-input"
                    placeholder={`Masukkan ${param.name}...`}
                    value={paramValues[param.name] || ''}
                    onChange={(e) => setParamValues({ ...paramValues, [param.name]: e.target.value })}
                    required={param.required}
                  />
                </div>
              ))}

              {endpoint.params.length === 0 && (
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                  Endpoint ini tidak memerlukan parameter.
                </p>
              )}

              <div style={{ margin: '20px 0' }}>
                <p style={{ fontWeight: 600, marginBottom: '8px', color: 'var(--text-primary)' }}>
                  Verifikasi Captcha:
                </p>
                <TurnstileWidget onVerify={handleVerify} onExpire={handleExpire} />
                {verified && (
                  <p style={{ color: '#22c55e', fontWeight: 600, fontSize: '0.875rem' }}>
                    ✅ Verifikasi berhasil!
                  </p>
                )}
              </div>

              {error && (
                <div
                  style={{
                    background: '#fee2e2',
                    border: '2px solid #ef4444',
                    borderRadius: '8px',
                    padding: '12px',
                    marginBottom: '16px',
                    color: '#dc2626',
                    fontSize: '0.875rem',
                  }}
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="neo-button neo-button-accent"
                style={{ width: '100%', marginTop: '16px' }}
                disabled={loading}
              >
                {loading ? '⏳ Memanggil API...' : '🚀 Kirim Request'}
              </button>
            </form>

            {response && (
              <div style={{ marginTop: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <h4 style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Response:</h4>
                  <span
                    style={{
                      background: response.status >= 200 && response.status < 300 ? '#dcfce7' : '#fee2e2',
                      color: response.status >= 200 && response.status < 300 ? '#166534' : '#991b1b',
                      border: '1px solid',
                      borderColor: response.status >= 200 && response.status < 300 ? '#22c55e' : '#ef4444',
                      borderRadius: '4px',
                      padding: '2px 8px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      fontFamily: 'Space Mono, monospace',
                    }}
                  >
                    {response.status}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{response.ms}ms</span>
                </div>
                <div className="code-block">{JSON.stringify(response.data, null, 2)}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
