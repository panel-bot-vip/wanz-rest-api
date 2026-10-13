'use client';

import { useEffect } from 'react';

/**
 * Proteksi UI anti-clone (lapisan kosmetik):
 * - klik kanan nonaktif (kecuali di input)
 * - select/drag teks nonaktif (kecuali input, <pre>, <code>, viewer response)
 * - pintasan view-source / save / print / devtools diblokir
 *
 * Catatan jujur: ini hanya memperlambat. Sumber halaman tetap bisa diakses
 * orang yang tekun. Perlindungan sesungguhnya ada di server (middleware).
 */
export default function AntiClone() {
  useEffect(() => {
    const isEditable = (el: EventTarget | null): boolean => {
      const node = el as HTMLElement | null;
      if (!node || !node.tagName) return false;
      const tag = node.tagName;
      return (
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        tag === 'SELECT' ||
        node.isContentEditable === true
      );
    };

    const isCopyZone = (e: Event): boolean => {
      const path = typeof e.composedPath === 'function' ? e.composedPath() : [];
      for (let i = 0; i < path.length; i++) {
        const n = path[i] as HTMLElement | null;
        if (!n || !n.classList) continue;
        if (n.tagName === 'PRE' || n.tagName === 'CODE') return true;
        if (n.classList.contains('response-viewer') || n.classList.contains('modal-body')) return true;
      }
      return false;
    };

    const onContext = (e: MouseEvent) => {
      if (isEditable(e.target)) return;
      e.preventDefault();
    };

    const onSelect = (e: Event) => {
      if (isEditable(e.target) || isCopyZone(e)) return;
      e.preventDefault();
    };

    const onDrag = (e: Event) => {
      if (isEditable(e.target) || isCopyZone(e)) return;
      e.preventDefault();
    };

    const onKey = (e: KeyboardEvent) => {
      const key = (e.key || '').toLowerCase();
      const mod = e.ctrlKey || e.metaKey;
      // F12 / Ctrl+Shift+I,J,C = devtools; Ctrl+U = view-source; Ctrl+S = save; Ctrl+P = print
      if (
        key === 'f12' ||
        (mod && e.shiftKey && (key === 'i' || key === 'j' || key === 'c')) ||
        (mod && !e.shiftKey && (key === 'u' || key === 's' || key === 'p'))
      ) {
        e.preventDefault();
      }
    };

    document.addEventListener('contextmenu', onContext);
    document.addEventListener('selectstart', onSelect);
    document.addEventListener('dragstart', onDrag);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('contextmenu', onContext);
      document.removeEventListener('selectstart', onSelect);
      document.removeEventListener('dragstart', onDrag);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  return null;
}
