'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Angka yang menghitung naik dari 0 ke nilai akhir saat tampil.
 * Menghormati reduced-motion (langsung tampil).
 */
export default function CountUp({ value, duration = 1100 }: { value: number; duration?: number }) {
  const [n, setN] = useState(0);
  const raf = useRef(0);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setN(value);
      return;
    }
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3); // ease-out cubic
      setN(Math.round(value * eased));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [value, duration]);

  return <>{n}</>;
}
