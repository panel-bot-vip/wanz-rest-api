'use client';

import { useEffect, useState } from 'react';

const CHANNEL = 'https://whatsapp.com/channel/0029Vb91FFNFcowEgF3v9S2p';
const GROUP =
  'https://chat.whatsapp.com/IWg41xYluxnEURl0I11KeI?s=cl&p=a&mlu=4&ilr=4';

function WaIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.46 1.32 4.96L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm0 18.15h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.19 8.19 0 0 1-1.26-4.38c0-4.54 3.7-8.23 8.25-8.23 2.2 0 4.27.86 5.83 2.42a8.18 8.18 0 0 1 2.41 5.82c0 4.54-3.7 8.23-8.24 8.23zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.12-.16.24-.64.8-.79.97-.14.16-.29.18-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.01-.38.11-.5.11-.11.25-.29.37-.43.12-.15.16-.25.25-.41.08-.16.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.43h-.47c-.16 0-.43.06-.65.31-.22.24-.86.84-.86 2.05s.88 2.38 1 2.54c.12.16 1.73 2.64 4.2 3.7.58.25 1.04.4 1.4.52.58.18 1.11.16 1.53.1.47-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.06-.11-.22-.17-.47-.29z" />
    </svg>
  );
}

/**
 * Dialog ajakan gabung komunitas (channel + grup WhatsApp).
 * Muncul sekali tiap 3 hari (localStorage), tak memaksa — ada tombol Lewati.
 */
export default function JoinDialog() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      const last = parseInt(localStorage.getItem('wanz-join-dismiss') || '0', 10);
      const cooldown = 3 * 24 * 60 * 60 * 1000;
      if (Date.now() - last < cooldown) return;
    } catch {
      /* localStorage bisa diblokir -> tetap tampil */
    }
    const t = setTimeout(() => setOpen(true), 2100); // setelah loader fade
    return () => clearTimeout(t);
  }, []);

  const dismiss = () => {
    setOpen(false);
    try {
      localStorage.setItem('wanz-join-dismiss', String(Date.now()));
    } catch {
      /* abaikan */
    }
  };

  if (!open) return null;

  return (
    <div className="join-backdrop" onClick={dismiss} role="dialog" aria-modal="true">
      <div className="join-card" onClick={(e) => e.stopPropagation()}>
        <button className="join-x" onClick={dismiss} aria-label="Tutup">
          ×
        </button>
        <div className="join-badge">GABUNG DULU</div>
        <h3 className="join-title">Ikut Komunitas Wanz</h3>
        <p className="join-desc">
          Dapetin update API terbaru, preset, & info penting langsung di WhatsApp.
        </p>
        <a
          href={CHANNEL}
          target="_blank"
          rel="noopener noreferrer"
          className="join-btn join-btn-channel"
        >
          <WaIcon /> Gabung Channel
        </a>
        <a
          href={GROUP}
          target="_blank"
          rel="noopener noreferrer"
          className="join-btn join-btn-group"
        >
          <WaIcon /> Gabung Grup
        </a>
        <button className="join-skip" onClick={dismiss}>
          Lewati
        </button>
      </div>
    </div>
  );
}
