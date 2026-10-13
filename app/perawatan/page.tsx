import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sedang Perawatan — Wanz REST API',
  robots: { index: false, follow: false },
};

const CHANNEL = 'https://whatsapp.com/channel/0029Vb91FFNFcowEgF3v9S2p';
const GROUP =
  'https://chat.whatsapp.com/IWg41xYluxnEURl0I11KeI?s=cl&p=a&mlu=4&ilr=4';

function Wrench({ size = 44 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14.7 6.3a4 4 0 0 0 5 5l-9.4 9.4a2.1 2.1 0 0 1-3-3z" />
      <path d="M14.7 6.3l3-3 3 3-3 3" />
    </svg>
  );
}

export default function PerawatanPage() {
  return (
    <div className="min-h-screen page-layer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <meta httpEquiv="refresh" content="20" />
      <div className="neo-card" style={{ maxWidth: 520, width: '100%', padding: '40px 30px', textAlign: 'center' }}>
        <div style={{ width: 92, height: 92, margin: '0 auto 22px', borderRadius: '50%', background: 'var(--accent-yellow)', border: '4px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '6px 6px 0 var(--shadow-color)' }}>
          <Wrench />
        </div>
        <div className="neo-badge" style={{ background: 'var(--accent-orange)', color: '#fff', marginBottom: 14 }}>SERVER UPDATE</div>
        <h1 className="handwritten" style={{ fontSize: '3rem', fontWeight: 700, marginBottom: 12, color: 'var(--text-primary)', lineHeight: 1 }}>
          Sedang Perawatan
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: 1.6, marginBottom: 8 }}>
          Server lagi diperbarui biar makin kenceng. Semua endpoint <b>sementara off</b>.
        </p>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginBottom: 26 }}>
          Biasanya cuma beberapa menit. Halaman ini auto-refresh, jadi tenang aja.
        </p>
        <div style={{ fontWeight: 800, marginBottom: 12 }}>Ikut komunitas buat update status:</div>
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
