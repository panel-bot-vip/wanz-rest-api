'use client';

import type { CSSProperties } from 'react';

/**
 * Objek gerak halus: sparkle/star kecil yang melayang + berputar pelan.
 * Murni CSS (tak ada JS scroll/rAF) jadi ringan dan tak bikin bug layout.
 * Hiasan belaka: pointer-events none, di belakang konten hero.
 */

type Sparkle = {
  kind: 'star' | 'plus' | 'dot';
  color: string;
  size: number;
  x: number; // % dari lebar
  y: number; // % dari tinggi
  dur: number;
  delay: number;
};

const SPARKLES: Sparkle[] = [
  { kind: 'star', color: 'var(--accent-purple)', size: 26, x: 6,  y: 18, dur: 6.0, delay: 0 },
  { kind: 'plus', color: 'var(--accent-orange)', size: 20, x: 88, y: 14, dur: 7.2, delay: 0.6 },
  { kind: 'star', color: 'var(--accent-mint)',   size: 18, x: 80, y: 66, dur: 6.6, delay: 1.1 },
  { kind: 'dot',  color: 'var(--accent-yellow)', size: 14, x: 12, y: 74, dur: 5.4, delay: 0.3 },
  { kind: 'plus', color: 'var(--accent-purple)', size: 22, x: 92, y: 44, dur: 7.8, delay: 1.6 },
  { kind: 'star', color: 'var(--accent-yellow)', size: 16, x: 48, y: 8,  dur: 6.2, delay: 0.9 },
  { kind: 'dot',  color: 'var(--accent-orange)', size: 12, x: 70, y: 30, dur: 5.8, delay: 1.3 },
  { kind: 'star', color: 'var(--accent-mint)',   size: 20, x: 22, y: 40, dur: 7.0, delay: 0.4 },
];

function Shape({ kind, color }: { kind: Sparkle['kind']; color: string }) {
  if (kind === 'star') {
    return (
      <svg width="100%" height="100%" viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M12 1.5l2.6 6.4 6.9.5-5.3 4.4 1.7 6.7L12 16.9 6.1 20l1.7-6.7L2.5 8.9l6.9-.5z"
          fill={color}
          stroke="#1a1a1a"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (kind === 'plus') {
    return (
      <svg width="100%" height="100%" viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M10 2h4v8h8v4h-8v8h-4v-8H2v-4h8z"
          fill={color}
          stroke="#1a1a1a"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  return (
    <svg width="100%" height="100%" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="8" fill={color} stroke="#1a1a1a" strokeWidth="1.6" />
    </svg>
  );
}

export default function FloatingSparkles() {
  return (
    <div className="float-sparkles" aria-hidden="true">
      {SPARKLES.map((s, i) => (
        <span
          key={i}
          className="sparkle"
          style={
            {
              left: `${s.x}%`,
              top: `${s.y}%`,
              width: s.size,
              height: s.size,
              animationDuration: `${s.dur}s`,
              animationDelay: `${s.delay}s`,
            } as CSSProperties
          }
        >
          <Shape kind={s.kind} color={s.color} />
        </span>
      ))}
    </div>
  );
}
