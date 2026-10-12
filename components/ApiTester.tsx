'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import TurnstileWidget from './TurnstileWidget';
import type { Endpoint } from '@/lib/endpoints';
import {
  FlaskIcon, XIcon, CheckCircleIcon, CheckIcon,
  RocketIcon, DownloadIcon, CopyIcon, LoaderIcon,
} from './icons';

interface ApiTesterProps {
  endpoint: Endpoint;
}

function isImageData(data: unknown): data is { _image: string } {
  return !!data && typeof data === 'object' && typeof (data as { _image?: unknown })._image === 'string';
}

export default function ApiTester({ endpoint }: ApiTesterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [paramValues, setParamValues] = useState<Record<string, string>>({});
  const [fileValues, setFileValues] = useState<Record<string, File>>({});
  const [verified, setVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [response, setResponse] = useState<{
    status: number;
    data: unknown;
    ms: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setParamValues({});
    setFileValues({});
    setVerified(false);
    setResponse(null);
    setError(null);
    setCopied(false);
  }, [endpoint, isOpen]);

  // Kunci scroll body + tutup pakai ESC saat modal terbuka
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', onKey);
    };
  }, [isOpen]);

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
    setCopied(false);

    try {
      const start = performance.now();
      let url = endpoint.path;
      let options: RequestInit = {};

      if (endpoint.method === 'POST') {
        const fd = new FormData();
        endpoint.params.forEach((p) => {
          if (p.type === 'file') {
            const f = fileValues[p.name];
            if (f) fd.append(p.name, f);
          } else {
            const val = paramValues[p.name] || p.default || '';
            if (val) fd.append(p.name, val);
          }
        });
        options = { method: 'POST', body: fd };
      } else {
        const queryParams = new URLSearchParams();
        endpoint.params.forEach((p) => {
          if (p.type === 'file') return;
          const val = paramValues[p.name] || p.default || '';
          if (val) queryParams.append(p.name, val);
        });
        url = `${endpoint.path}?${queryParams.toString()}`;
      }

      const res = await fetch(url, options);
      const ct = res.headers.get('content-type') || '';
      let data: unknown;
      if (ct.indexOf('application/json') !== -1) {
        data = await res.json();
      } else if (ct.indexOf('image/') === 0) {
        const blob = await res.blob();
        data = {
          _image: URL.createObjectURL(blob),
          content_type: blob.type,
          size_bytes: blob.size,
          preview: true,
        };
      } else {
        data = { _text: await res.text() };
      }
      const ms = Math.round(performance.now() - start);

      setResponse({ status: res.status, data, ms });
    } catch (err) {
      setError('Terjadi kesalahan saat memanggil API');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!response) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(response.data, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const isSuccess = response && response.status >= 200 && response.status < 300;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="neo-button neo-button-purple icon-text"
        style={{ padding: '8px 16px', fontSize: '0.875rem' }}
      >
        <FlaskIcon size={16} /> Uji Coba
      </button>

      {isOpen &&
        createPortal(
          <div className="modal-overlay" onClick={() => setIsOpen(false)}>
            <div
              className="modal-content pop-in"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label={`Uji coba ${endpoint.name}`}
            >
            {/* Header modal + tombol X di pojok kanan atas */}
            <div className="modal-header">
              <h3 className="modal-title icon-text">
                <FlaskIcon size={20} /> Uji Coba API
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="modal-close-btn"
                aria-label="Tutup modal"
              >
                <XIcon size={16} />
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
                  {param.type === 'file' ? (
                    <input
                      type="file"
                      accept="image/*"
                      className="neo-input"
                      onChange={(e) => {
                        const f = e.target.files && e.target.files[0];
                        setFileValues((prev) => {
                          const next = { ...prev };
                          if (f) next[param.name] = f;
                          else delete next[param.name];
                          return next;
                        });
                      }}
                      required={param.required}
                    />
                  ) : param.options ? (
                    <select
                      className="neo-input"
                      value={paramValues[param.name] || param.default || param.options[0]}
                      onChange={(e) => setParamValues({ ...paramValues, [param.name]: e.target.value })}
                      required={param.required}
                    >
                      {param.options.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      className="neo-input"
                      placeholder={`Masukkan ${param.name}...`}
                      value={paramValues[param.name] || ''}
                      onChange={(e) => setParamValues({ ...paramValues, [param.name]: e.target.value })}
                      required={param.required}
                    />
                  )}
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
                  <p className="icon-text" style={{ color: '#22c55e', fontWeight: 600, fontSize: '0.875rem' }}>
                    <CheckCircleIcon size={15} /> Verifikasi berhasil!
                  </p>
                )}
              </div>

              {error && (
                <div className="api-error-box" role="alert">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="neo-button neo-button-accent"
                style={{ width: '100%', marginTop: '16px', justifyContent: 'center' }}
                disabled={loading}
              >
                {loading ? (
                  <span className="icon-text" style={{ justifyContent: 'center' }}><LoaderIcon size={17} /> Memanggil API...</span>
                ) : (
                  <span className="icon-text" style={{ justifyContent: 'center' }}><RocketIcon size={17} /> Kirim Request</span>
                )}
              </button>
            </form>

            {/* Response Viewer Neo-Brutalisme di bawah tombol Kirim Request */}
            {response && !isImageData(response.data) && (
              <div className="response-viewer">
                <div className="response-viewer-header">
                  <h4 className="response-viewer-title icon-text"><DownloadIcon size={16} /> Response</h4>
                  <div className="response-viewer-meta">
                    <span
                      className={isSuccess ? 'response-status response-status-ok' : 'response-status response-status-err'}
                    >
                      {response.status}
                    </span>
                    <span className="response-ms mono">{response.ms}ms</span>
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="neo-button response-copy-btn"
                    >
                      {copied ? (
                        <span className="icon-text"><CheckIcon size={13} /> Disalin!</span>
                      ) : (
                        <span className="icon-text"><CopyIcon size={13} /> Salin JSON</span>
                      )}
                    </button>
                  </div>
                </div>
                <div className="code-block response-code">{JSON.stringify(response.data, null, 2)}</div>
              </div>
            )}

            {/* Preview gambar untuk endpoint image (brat) */}
            {response && isImageData(response.data) && (
              <div className="response-viewer">
                <div className="response-viewer-header">
                  <h4 className="response-viewer-title icon-text"><DownloadIcon size={16} /> Gambar</h4>
                  <div className="response-viewer-meta">
                    <span className="response-status response-status-ok">{response.status}</span>
                    <span className="response-ms mono">{response.ms}ms</span>
                    <a
                      href={response.data._image}
                      download="brat.png"
                      className="neo-button response-copy-btn"
                      style={{ textDecoration: 'none' }}
                    >
                      Simpan Gambar
                    </a>
                  </div>
                </div>
                <img
                  src={response.data._image}
                  alt="Hasil brat generator"
                  style={{
                    width: '100%',
                    borderRadius: '8px',
                    border: '3px solid var(--border-color)',
                    display: 'block',
                  }}
                />
              </div>
            )}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
