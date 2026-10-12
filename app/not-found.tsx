import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { SearchIcon, HomeIcon, DocsIcon } from '@/components/icons';

export default function NotFound() {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-16" style={{ textAlign: 'center' }}>
        <div className="neo-card pop-in" style={{ padding: '48px 24px', maxWidth: '560px', margin: '0 auto' }}>
          <p style={{ marginBottom: '8px', color: 'var(--accent-purple)' }}>
            <SearchIcon size={64} />
          </p>
          <h1 className="handwritten" style={{ fontSize: '3rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            404 — Nyasar, Boss!
          </h1>
          <p style={{ color: 'var(--text-secondary)', margin: '12px 0 24px', lineHeight: 1.6 }}>
            Halaman yang kamu cari tidak ditemukan. Mungkin URL-nya salah ketik atau sudah dipindah.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/" className="neo-button neo-button-accent icon-text" style={{ textDecoration: 'none' }}>
              <HomeIcon size={17} /> Kembali ke Beranda
            </Link>
            <Link href="/docs" className="neo-button neo-button-secondary icon-text" style={{ textDecoration: 'none' }}>
              <DocsIcon size={17} /> Lihat Dokumentasi
            </Link>
          </div>
          <p style={{ marginTop: '24px', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Butuh bantuan?{' '}
            <Link href="/docs" className="troubleshoot-link">
              Baca panduan troubleshooting →
            </Link>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
