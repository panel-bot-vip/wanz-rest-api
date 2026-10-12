import { HeartIcon } from './Icons';

export default function Footer() {
  return (
    <footer style={{
      background: 'var(--card-bg)',
      borderTop: '3px solid var(--border-color)',
      boxShadow: '0 -4px 0px var(--shadow-color)',
      marginTop: '40px'
    }}>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div>
            <h3 className="handwritten" style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-primary)' }}>
              Wanz REST API&apos;s
            </h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.5, fontSize: '0.875rem' }}>
              Platform REST API gratis untuk developer.
            </p>
          </div>
          
          <div>
            <h4 style={{ fontWeight: 700, marginBottom: '8px', color: 'var(--text-primary)', fontSize: '0.875rem' }}>Navigasi</h4>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              <li style={{ marginBottom: '6px' }}>
                <a href="/" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.875rem' }}>Beranda</a>
              </li>
              <li style={{ marginBottom: '6px' }}>
                <a href="/docs" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.875rem' }}>Dokumentasi</a>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 style={{ fontWeight: 700, marginBottom: '8px', color: 'var(--text-primary)', fontSize: '0.875rem' }}>Status</h4>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              <li style={{ marginBottom: '6px', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Gratis Selamanya</li>
              <li style={{ marginBottom: '6px', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Tanpa Login</li>
              <li style={{ marginBottom: '6px', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Cloudflare Protected</li>
            </ul>
          </div>
        </div>
        
        <div style={{
          borderTop: '2px solid var(--border-color)',
          paddingTop: '16px',
          textAlign: 'center'
        }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            © 2026 Wanz REST API. Dibuat dengan <HeartIcon size={14} /> untuk developer Indonesia.
          </p>
          <p className="handwritten" style={{ fontSize: '1rem', marginTop: '4px', color: 'var(--accent-purple)' }}>
            Alergi Pake Api Key!
          </p>
        </div>
      </div>
    </footer>
  );
}
