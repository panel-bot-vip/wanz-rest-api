'use client';

import { useEffect, useRef, useState } from 'react';
import { ShieldIcon, WarnIcon } from './icons';

declare global {
  interface Window {
    turnstile?: {
      render: (container: string | HTMLElement, options: {
        sitekey: string;
        callback?: (token: string) => void;
        'expired-callback'?: () => void;
        'error-callback'?: () => void;
        'timeout-callback'?: () => void;
        theme?: 'light' | 'dark';
        size?: 'normal' | 'compact';
        action?: string;
        cData?: string;
      }) => string;
      reset: (widgetId: string) => void;
      getResponse: (widgetId: string) => string;
    };
  }
}

interface TurnstileWidgetProps {
  onVerify: (token: string) => void;
  onExpire?: () => void;
  onError?: (error: string) => void;
  action?: string;
}

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '';

function isKeyConfigured(key: string): boolean {
  if (!key) return false;
  if (key.includes('FAKE')) return false;
  if (key === 'GANTI_DENGAN_SITE_KEY_BARU') return false;
  if (key.trim().length < 10) return false;
  return true;
}

export default function TurnstileWidget({ onVerify, onExpire, onError, action }: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const configured = isKeyConfigured(TURNSTILE_SITE_KEY);

  useEffect(() => {
    // Jangan load script sama sekali kalau key belum diisi (fallback UI saja)
    if (!configured) return;
    if (!containerRef.current) return;

    // Prevent double render
    if (widgetIdRef.current) return;

    const loadTurnstile = () => {
      if (window.turnstile && containerRef.current) {
        try {
          const widgetId = window.turnstile.render(containerRef.current, {
            sitekey: TURNSTILE_SITE_KEY,
            action: action || 'api_access',
            callback: async (token: string) => {
              setIsVerifying(true);
              setError(null);

              try {
                // Server-side verification
                const verifyRes = await fetch('/api/verify-turnstile', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ token, action: action || 'api_access' })
                });

                const verifyData = await verifyRes.json();

                if (verifyRes.ok && verifyData.success) {
                  setIsLoaded(true);
                  onVerify(token);
                } else {
                  setError(verifyData.error || 'Verifikasi gagal. Silakan coba lagi.');
                  if (window.turnstile && widgetIdRef.current) {
                    window.turnstile.reset(widgetIdRef.current);
                  }
                  onError?.(verifyData.error || 'Verification failed');
                }
              } catch (err) {
                setError('Gagal memverifikasi token. Silakan refresh halaman.');
                onError?.('Network error');
              } finally {
                setIsVerifying(false);
              }
            },
            'expired-callback': () => {
              setIsLoaded(false);
              onExpire?.();
            },
            'error-callback': () => {
              setError('Gagal memuat verifikasi. Silakan refresh halaman.');
              onError?.('Widget error');
            },
            'timeout-callback': () => {
              setError('Verifikasi timeout. Silakan coba lagi.');
              if (window.turnstile && widgetIdRef.current) {
                window.turnstile.reset(widgetIdRef.current);
              }
            },
            theme: typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light',
            size: 'normal',
          });

          widgetIdRef.current = widgetId;
        } catch (err) {
          setError('Gagal menginisialisasi Turnstile widget');
        }
      }
    };

    // Load Turnstile script if not already loaded
    if (!document.querySelector('script[src*="challenges.cloudflare.com"]')) {
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.defer = true;
      script.onload = loadTurnstile;
      script.onerror = () => setError('Gagal memuat Cloudflare Turnstile');
      document.head.appendChild(script);
    } else {
      loadTurnstile();
    }

    return () => {
      // Cleanup
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
      widgetIdRef.current = null;
    };
  }, [onVerify, onExpire, onError, action, configured]);

  // Fallback UI saat Site Key belum diisi — rapi, tanpa error merah merusak estetika
  if (!configured) {
    return (
      <div className="turnstile-fallback">
        <div className="turnstile-fallback-icon" style={{ color: 'var(--accent-purple)' }}><ShieldIcon size={30} /></div>
        <div>
          <p className="turnstile-fallback-title">Mode Pengembangan</p>
          <p className="turnstile-fallback-desc">
            Captcha Turnstile belum dikonfigurasi. Isi{' '}
            <code className="mono">NEXT_PUBLIC_TURNSTILE_SITE_KEY</code> untuk mengaktifkan verifikasi.
          </p>
          <button
            type="button"
            className="neo-button neo-button-secondary turnstile-fallback-btn"
            onClick={() => onVerify('dev-bypass-token')}
          >
            Lewati Verifikasi (Dev) →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="turnstile-container" style={{ flexDirection: 'column', alignItems: 'center' }}>
      <div ref={containerRef} style={{ display: 'flex', justifyContent: 'center', minHeight: '65px' }} />

      {isVerifying && (
        <p style={{ color: 'var(--accent-purple)', fontSize: '0.875rem', marginTop: '8px', fontWeight: 600 }}>
          ⏳ Memverifikasi...
        </p>
      )}

      {error && !isLoaded && (
        <div className="turnstile-error-box icon-text" role="alert">
          <WarnIcon size={16} /> {error}
        </div>
      )}
    </div>
  );
}
