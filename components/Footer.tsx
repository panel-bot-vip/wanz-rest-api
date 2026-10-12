import { CheckCircleIcon, HeartIcon, RocketIcon } from './icons';

const ADVANTAGES = ['Gratis Selamanya', 'Tanpa Login', 'Super Responsif', 'Aman & Terpercaya'];

export default function Footer() {
  return (
    <footer
      style={{
        background: 'var(--card-bg)',
        borderTop: '3px solid var(--border-color)',
        boxShadow: '0 -4px 0px var(--shadow-color)',
        marginTop: '60px',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <h3
              className="handwritten"
              style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '12px', color: 'var(--text-primary)' }}
            >
              Wanz REST API&apos;s
            </h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Platform REST API gratis untuk developer. Tanpa login, tanpa ribet, langsung pakai!
            </p>
          </div>

          <div>
            <h4 style={{ fontWeight: 700, marginBottom: '12px', color: 'var(--text-primary)' }}>Navigasi</h4>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              <li style={{ marginBottom: '8px' }}>
                <a href="/" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Beranda</a>
              </li>
              <li style={{ marginBottom: '8px' }}>
                <a href="/docs" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Dokumentasi</a>
              </li>
              <li style={{ marginBottom: '8px' }}>
                <a href="/#stats" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Statistik</a>
              </li>
            </ul>
          </div>

          <div>
            <h4 style={{ fontWeight: 700, marginBottom: '12px', color: 'var(--text-primary)' }}>Keunggulan</h4>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {ADVANTAGES.map((item) => (
                <li key={item} className="icon-text" style={{ marginBottom: '8px', color: 'var(--text-secondary)' }}>
                  <CheckCircleIcon size={15} style={{ color: '#22c55e' }} /> {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div
          style={{
            borderTop: '2px solid var(--border-color)',
            paddingTop: '20px',
            textAlign: 'center',
          }}
        >
          <p className="icon-text" style={{ color: 'var(--text-secondary)', justifyContent: 'center' }}>
            © 2026 Wanz REST API. Dibuat dengan <HeartIcon size={15} style={{ color: '#ef4444' }} /> untuk developer Indonesia.
          </p>
          <p className="handwritten icon-text" style={{ fontSize: '1.2rem', marginTop: '8px', color: 'var(--accent-purple)', justifyContent: 'center' }}>
            Alergi Pake Api Key! <RocketIcon size={17} />
          </p>
        </div>
      </div>
    </footer>
  );
}
