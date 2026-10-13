'use client';

import { useEffect } from 'react';

/**
 * Reveal-on-scroll: elemen ber-attribute `data-reveal` menyala saat masuk viewport.
 * Transisi diatur di CSS; jeda antar-elemen memakai custom property `--rd`.
 * Semua langsung tampil bila pengguna meminta reduced-motion.
 */
export default function RevealOnScroll() {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
    if (!els.length) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || !('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('revealed'));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return null;
}
