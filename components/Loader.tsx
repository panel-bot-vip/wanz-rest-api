'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Loading screen "BOOOSTER" gaya neo-brutalisme.
 * Dirender dari HTML server (bukan nunggu hydrate) jadi menutupi delay paint.
 * Progress bar + bolt energi berputar, lalu fade-out mulus dan panggil onDone.
 */
export default function Loader({ onDone }: { onDone: () => void }) {
  const [pct, setPct] = useState(0);
  const [out, setOut] = useState(false);
  const finished = useRef(false);

  useEffect(() => {
    const dur = 1300;
    const start = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      setPct(Math.round(p * 100));
      if (p < 1) {
        raf = requestAnimationFrame(tick);
      } else if (!finished.current) {
        finished.current = true;
        setOut(true);
        setTimeout(onDone, 420); // tunggu animasi fade-out selesai
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [onDone]);

  return (
    <div className={`loader ${out ? 'loader-out' : ''}`} aria-hidden="true">
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
          <div className="loader-fill" style={{ width: pct + '%' }} />
        </div>
        <div className="loader-pct">{pct}%</div>
      </div>
    </div>
  );
}
