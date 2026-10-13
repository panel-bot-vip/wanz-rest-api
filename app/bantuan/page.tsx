import Header from '@/components/Header';
import Footer from '@/components/Footer';
import RevealOnScroll from '@/components/RevealOnScroll';
import ScrollProgress from '@/components/ScrollProgress';
import RequestForm from '@/components/RequestForm';
import { HelpIcon, ZapIcon, DocsIcon, InfoIcon, LockIcon } from '@/components/icons';

const FAQ = [
  {
    q: 'Perlu API key gaak?',
    a: 'Nggak. Semua endpoint gratis tanpa daftar, tanpa api key — tinggal fetch.',
    Icon: ZapIcon,
  },
  {
    q: 'Gimana cara pakainya?',
    a: 'Buka Dokumentasi, pilih endpoint, salin contoh URL, langsung panggil.',
    Icon: DocsIcon,
  },
  {
    q: 'Ada batas request?',
    a: 'Ada rate limit wajar per IP (60 request API/menit) biar adil buat semua.',
    Icon: InfoIcon,
  },
  {
    q: 'Request API bisa dibikin?',
    a: 'Bisa. Tulis di formulir sebelah, request kamu masuk antrian admin.',
    Icon: LockIcon,
  },
];

const CHANNEL = 'https://whatsapp.com/channel/0029Vb91FFNFcowEgF3v9S2p';
const GROUP =
  'https://chat.whatsapp.com/IWg41xYluxnEURl0I11KeI?s=cl&p=a&mlu=4&ilr=4';

export default function BantuanPage() {
  return (
    <>
      <ScrollProgress />
      <RevealOnScroll />
      <div className="min-h-screen page-layer">
        <Header />

        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="mb-8">
            <h1
              className="handwritten icon-text"
              data-reveal
              style={{ fontSize: '3rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-primary)' }}
            >
              <HelpIcon size={36} /> Pusat Bantuan
            </h1>
            <p data-reveal style={{ color: 'var(--text-secondary)', fontSize: '1.125rem' }}>
              Ada yang error, ada ide API, atau mau request endpoint baru? Tulis di sini.
            </p>
          </div>

          <div
            data-reveal
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '28px', alignItems: 'start' }}
          >
            {/* Form request */}
            <section>
              <h2 className="icon-text" style={{ fontWeight: 800, fontSize: '1.35rem', marginBottom: '14px' }}>
                <ZapIcon size={22} /> Request API Baru
              </h2>
              <RequestForm />
            </section>

            {/* FAQ + komunitas */}
            <section>
              <h2 className="icon-text" style={{ fontWeight: 800, fontSize: '1.35rem', marginBottom: '14px' }}>
                <InfoIcon size={22} /> Pertanyaan Umum
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {FAQ.map((f) => (
                  <div key={f.q} className="neo-card" data-reveal style={{ padding: '16px 18px' }}>
                    <div className="icon-text" style={{ fontWeight: 800, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <f.Icon size={18} /> {f.q}
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>{f.a}</p>
                  </div>
                ))}
              </div>

              <div className="neo-card" data-reveal style={{ padding: '18px', marginTop: '18px', textAlign: 'center' }}>
                <div style={{ fontWeight: 800, marginBottom: '12px' }}>Gabung Komunitas Wanz</div>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
                  <a href={CHANNEL} target="_blank" rel="noopener noreferrer" className="neo-button neo-button-secondary" style={{ fontSize: '0.9rem', padding: '10px 16px' }}>
                    WhatsApp Channel
                  </a>
                  <a href={GROUP} target="_blank" rel="noopener noreferrer" className="neo-button" style={{ fontSize: '0.9rem', padding: '10px 16px' }}>
                    WhatsApp Grup
                  </a>
                </div>
              </div>
            </section>
          </div>
        </div>

        <Footer />
      </div>
    </>
  );
}
