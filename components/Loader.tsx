'use client';

import { useEffect } from 'react';

/**
 * Loading screen "BOOOSTER" — murni CSS (bar ngisi + fade-out otomatis).
 * Tak ada JS/rAF yang ngatur, jadi langsung jalan di paint pertama & tak beku.
 * onDone dipakai buat unmount dari DOM setelah fade selesai.
 */
export default function Loader({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 1900);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="loader" aria-hidden="true">
      <div className="loader-card">
        <div className="loader-icon">
          <span className="loader-ring" />
          <svg className="loader-bolt" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M13 2 L4 14 h6 l-1 8 9-12 h-6 z"
              fill="#FACC15"
              stroke="#1a1a1a"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div className="loader-title">INITIALIZING</div>
        <div className="loader-sub">MEMUAT SYSTEM…</div>
        <div className="loader-bar">
          <div className="loader-fill" />
        </div>
      </div>
    </div>
  );
}
