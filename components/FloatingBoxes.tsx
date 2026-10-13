'use client';

import { useEffect, useRef } from 'react';
import type { CSSProperties } from 'react';

/**
 * Kotak dekoratif Neo-Brutalisme yang bergerak maju-mundur (parallax) mengikuti scroll.
 * Murni hiasan: pointer-events none, di belakang konten.
 * Berhenti total bila pengguna meminta reduced-motion.
 */
type Box = {
  size: number; x: number; y: number;
  sp: number; sx: number; rot: number;
  color: string; r: number; delay: number;
};

// sp = kecepatan vertikal, sx = geser horizontal, r = radius sudut
const BOXES: Box[] = [
  { size: 96,  x: 5,  y: 16, sp: 0.07,   sx: -0.02,  rot: 12,  color: 'var(--accent-purple)', r: 18, delay: 0 },
  { size: 58,  x: 86, y: 10, sp: -0.06,  sx: 0.018,  rot: -10, color: 'var(--accent-yellow)', r: 26, delay: 0.4 },
  { size: 128, x: 76, y: 58, sp: 0.05,   sx: -0.014, rot: 8,   color: 'var(--accent-mint)',   r: 14, delay: 0.8 },
  { size: 46,  x: 12, y: 70, sp: -0.08,  sx: 0.024,  rot: -16, color: 'var(--accent-orange)', r: 30, delay: 1.2 },
  { size: 74,  x: 90, y: 38, sp: 0.06,   sx: -0.02,  rot: 14,  color: 'var(--accent-purple)', r: 20, delay: 0.2 },
  { size: 40,  x: 44, y: 86, sp: -0.05,  sx: 0.016,  rot: 6,   color: 'var(--accent-mint)',   r: 24, delay: 1.0 },
  { size: 104, x: 2,  y: 44, sp: 0.055,  sx: -0.018, rot: -8,  color: 'var(--accent-yellow)', r: 16, delay: 0.6 },
  { size: 54,  x: 60, y: 20, sp: -0.07,  sx: 0.02,   rot: 18,  color: 'var(--accent-orange)', r: 28, delay: 1.4 },
];

export default function FloatingBoxes() {
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.style.setProperty('--p', '0px');
      return;
    }

    let ticking = false;
    const update = () => {
      ticking = false;
      el.style.setProperty('--p', `${window.scrollY}px`);
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div ref={wrap} className="floating-boxes" aria-hidden="true">
      {BOXES.map((b, i) => (
        <div
          key={i}
          className="fbox"
          style={
            {
              left: `${b.x}%`,
              top: `${b.y}%`,
              width: b.size,
              height: b.size,
              background: b.color,
              '--sx': b.sx,
              '--sp': b.sp,
              '--rot': `${b.rot}deg`,
              '--fs': `${b.r}px`,
              '--fd': `${b.delay}s`,
            } as CSSProperties
          }
        >
          <div className="fbox-inner" />
        </div>
      ))}
    </div>
  );
}
