'use client';

import { useEffect, useRef, useState } from 'react';
import { LoaderIcon, AlertIcon } from './Icons';

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
      }) => string;
      reset: (widgetId: string) => void;
    };
  }
}

interface TurnstileWidgetProps {
  onVerify: (token: string) => void;
  onExpire?: () => void;
  onError?: (error: string) => void;
  action?: string;
}

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '0x4AAAAAAAFAKE_SITE_KEY_FOR_DEV';

export default function TurnstileWidget({ onVerify, onExpire, onError, action }: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;
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
            theme: document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light',
            size: 'normal',
          });

          widgetIdRef.current = widgetId;
        } catch (err) {
          setError('Gagal menginisialisasi Turnstile widget');
        }
      }
    };

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
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
      widgetIdRef.current = null;
    };
  }, [onVerify, onExpire, onError, action]);

  return (
    <div className="turnstile-container" style={{ flexDirection: 'column', alignItems: 'center' }}>
      <div ref={containerRef} style={{ display: 'flex', justifyContent: 'center' }} />
      
      {isVerifying && (
        <p style={{ color: 'var(--accent-purple)', fontSize: '0.8rem', marginTop: '6px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
          <LoaderIcon size={14} />
          Memverifikasi...
        </p>
      )}
      
      {error && (
        <p style={{ color: 'var(--accent-orange)', fontSize: '0.8rem', marginTop: '6px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
          <AlertIcon size={14} />
          {error}
        </p>
      )}
    </div>
  );
}
