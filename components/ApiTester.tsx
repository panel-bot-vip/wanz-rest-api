'use client';

import { useState } from 'react';
import TurnstileWidget from './TurnstileWidget';
import { TestTubeIcon, SendIcon, AlertIcon, LoaderIcon, XIcon } from './Icons';

interface ApiTesterProps {
  endpoint: string;
  method: string;
  params: { name: string; type: string; required: boolean; description: string }[];
}

export default function ApiTester({ endpoint, method, params }: ApiTesterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [paramValues, setParamValues] = useState<Record<string, string>>({});
  const [verified, setVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = (token: string) => {
    if (token) {
      setVerified(true);
    }
  };

  const handleExpire = () => {
    setVerified(false);
  };

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
      params.forEach(p => {
        if (paramValues[p.name]) {
          queryParams.append(p.name, paramValues[p.name]);
        }
      });

      const url = `${endpoint}?${queryParams.toString()}`;
      const res = await fetch(url);
      const data = await res.json();
      setResponse(JSON.stringify(data, null, 2));
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
        style={{ padding: '8px 16px', fontSize: '0.8rem' }}
      >
        <TestTubeIcon size={16} />
        <span>Uji Coba</span>
      </button>

      {isOpen && (
        <div className="modal-overlay" onClick={() => setIsOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Uji Coba API
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'var(--accent-orange)',
                  border: '2px solid var(--border-color)',
                  borderRadius: '6px',
                  width: '28px',
                  height: '28px',
                  cursor: 'pointer',
                  fontWeight: 700,
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <XIcon size={16} />
              </button>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <span className="method-badge">{method}</span>
              <code style={{ marginLeft: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {endpoint}
              </code>
            </div>

            <form onSubmit={handleSubmit}>
              {params.map(param => (
                <div key={param.name} style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px', color: 'var(--text-primary)', fontSize: '0.8rem' }}>
                    {param.name}
                    {param.required && <span style={{ color: 'var(--accent-orange)' }}> *</span>}
                    <span style={{ fontWeight: 400, fontSize: '0.7rem', color: 'var(--text-secondary)', marginLeft: '6px' }}>
                      ({param.type})
                    </span>
                  </label>
                  <input
                    type="text"
                    className="neo-input"
                    style={{ width: '100%', padding: '8px 12px', fontSize: '0.875rem' }}
                    placeholder={param.description}
                    value={paramValues[param.name] || ''}
                    onChange={e => setParamValues({ ...paramValues, [param.name]: e.target.value })}
                    required={param.required}
                  />
                </div>
              ))}

              <div style={{ margin: '16px 0' }}>
                <p style={{ fontWeight: 600, marginBottom: '6px', color: 'var(--text-primary)', fontSize: '0.8rem' }}>
                  Verifikasi Captcha:
                </p>
                <TurnstileWidget onVerify={handleVerify} onExpire={handleExpire} />
                {verified && (
                  <p style={{ color: 'var(--accent-mint)', fontWeight: 600, fontSize: '0.8rem' }}>
                    Verifikasi berhasil!
                  </p>
                )}
              </div>

              {error && (
                <div style={{
                  background: '#fee2e2',
                  border: '2px solid #ef4444',
                  borderRadius: '6px',
                  padding: '8px',
                  marginBottom: '12px',
                  color: '#dc2626',
                  fontSize: '0.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <AlertIcon size={14} />
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="neo-button neo-button-accent"
                style={{ width: '100%', marginTop: '12px', justifyContent: 'center' }}
                disabled={loading}
              >
                {loading ? <LoaderIcon size={16} /> : <SendIcon size={16} />}
                <span>{loading ? 'Memanggil API...' : 'Kirim Request'}</span>
              </button>
            </form>

            {response && (
              <div style={{ marginTop: '16px' }}>
                <h4 style={{ fontWeight: 700, marginBottom: '6px', color: 'var(--text-primary)', fontSize: '0.8rem' }}>
                  Response:
                </h4>
                <div className="code-block" style={{ padding: '12px', fontSize: '0.8rem' }}>
                  {response}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
