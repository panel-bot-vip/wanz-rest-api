import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Akses Diblokir — Wanz REST API',
  robots: { index: false, follow: false },
};

const CHANNEL = 'https://whatsapp.com/channel/0029Vb91FFNFcowEgF3v9S2p';
const GROUP =
  'https://chat.whatsapp.com/IWg41xYluxnEURl0I11KeI?s=cl&p=a&mlu=4&ilr=4';

function BanIcon({ size = 44 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M5.6 5.6l12.8 12.8" />
    </svg>
  );
}

export default function DiblokirPage() {
  return (
    <div className="min-h-screen page-layer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div className="neo-card" style={{ maxWidth: 520, width: '100%', padding: '40px 30px', textAlign: 'center', borderColor: '#ef4444' }}>
        <div style={{ width: 92, height: 92, margin: '0 auto 22px', borderRadius: '50%', background: '#ef4444', border: '4px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '6px 6px 0 var(--shadow-color)' }}>
          <BanIcon />
        </div>
        <div className="neo-badge" style={{ background: '#ef4444', color: '#fff', marginBottom: 14 }}>403 FORBIDDEN</div>
        <h1 className="handwritten" style={{ fontSize: '3rem', fontWeight: 700, marginBottom: 12, color: 'var(--text-primary)', lineHeight: 1 }}>
          IP Kamu Diblokir
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: 1.6, marginBottom: 8 }}>
          Akses dari IP kamu ditandai dan tidak bisa masuk ke API.
        </p>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginBottom: 26 }}>
          Kalau ini kekeliruan, hubungi admin lewat komunitas buat dibuka lagi.
        </p>
        <div style={{ fontWeight: 800, marginBottom: 12 }}>Hubungi admin di:</div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href={CHANNEL} target="_blank" rel="noopener noreferrer" className="neo-button" style={{ background: 'var(--accent-mint)', fontSize: '0.9rem', padding: '10px 16px' }}>
            WhatsApp Channel
          </a>
          <a href={GROUP} target="_blank" rel="noopener noreferrer" className="neo-button" style={{ fontSize: '0.9rem', padding: '10px 16px' }}>
            WhatsApp Grup
          </a>
        </div>
      </div>
    </div>
  );
}
