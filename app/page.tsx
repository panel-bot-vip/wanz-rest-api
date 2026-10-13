'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import TurnstileWidget from '@/components/TurnstileWidget';
import RevealOnScroll from '@/components/RevealOnScroll';
import ScrollProgress from '@/components/ScrollProgress';
import CountUp from '@/components/CountUp';
import FloatingSparkles from '@/components/FloatingSparkles';
import RoastSection from '@/components/RoastSection';
import { ENDPOINTS } from '@/lib/endpoints';
import {
  SparklesIcon, BanIcon, RocketIcon, ChartIcon, LockIcon,
  CheckCircleIcon, InfoIcon, ZapIcon, BatteryIcon, UnlockIcon,
  ShieldIcon, FlaskIcon, DocsIcon, StarIcon, ActivityIcon,
  ServerIcon,
} from '@/components/icons';

const FEATURES = [
  { title: 'Super Responsif', desc: 'Response time cepat dengan infrastruktur modern dan optimal.', bg: 'var(--accent-yellow)', Icon: ZapIcon },
  { title: 'Tanpa Login', desc: 'Langsung pakai tanpa perlu register atau login. Bebas!', bg: 'var(--accent-mint)', Icon: UnlockIcon },
  { title: 'Aman', desc: 'Dilindungi Cloudflare Turnstile dan keamanan berlapis.', bg: 'var(--accent-orange)', Icon: ShieldIcon },
  { title: 'Coba Langsung', desc: 'Uji coba API langsung dari browser tanpa install apapun.', bg: 'var(--accent-purple)', Icon: FlaskIcon },
];

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [ip, setIp] = useState('Memuat...');
  const [battery, setBattery] = useState<number | null>(null);
  const [batteryCharging, setBatteryCharging] = useState(false);
  const [verified, setVerified] = useState(false);
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);
  const [apiMs, setApiMs] = useState<number | null>(null);
  const [stars, setStars] = useState<number | null>(null);

  const liveEndpointCount = ENDPOINTS.filter((e) => e.status === 'live').length;

  useEffect(() => {
    setMounted(true);

    fetch('https://api.ipify.org?format=json')
      .then((res) => res.json())
      .then((data) => setIp(data.ip))
      .catch(() => setIp('Tidak diketahui'));

    // Cek status API asli + ukur latency
    const healthStart = performance.now();
    fetch('/api/health')
      .then((res) => {
        setApiOnline(res.ok);
        setApiMs(Math.round(performance.now() - healthStart));
      })
      .catch(() => setApiOnline(false));

    // Jumlah star GitHub asli (data publik)
    fetch('https://api.github.com/repos/panel-bot-vip/wanz-rest-api')
      .then((res) => res.json())
      .then((data) => {
        if (typeof data.stargazers_count === 'number') setStars(data.stargazers_count);
      })
      .catch(() => setStars(null));

    if ('getBattery' in navigator) {
      (navigator as unknown as { getBattery: () => Promise<{
        level: number;
        charging: boolean;
        addEventListener: (type: string, listener: () => void) => void;
      }> }).getBattery()
        .then((b) => {
          setBattery(Math.round(b.level * 100));
          setBatteryCharging(b.charging);
          b.addEventListener('levelchange', () => setBattery(Math.round(b.level * 100)));
          b.addEventListener('chargingchange', () => setBatteryCharging(b.charging));
        })
        .catch(() => setBattery(null));
    } else {
      setBattery(null);
    }
  }, []);

  const handleVerify = (token: string) => {
    if (token) setVerified(true);
  };

  if (!mounted) return null;

  return (
    <>
      <ScrollProgress />
      <RevealOnScroll />
      <div className="min-h-screen page-layer">
      <Header />

      {/* Hero Section */}
      <section className="hero-anim max-w-7xl mx-auto px-4 pt-16 pb-8">
        <FloatingSparkles />
        <div className="text-center mb-12">
          <div className="neo-badge mb-6 icon-text" data-reveal>
            <SparklesIcon size={16} /> Gratis • Tanpa Login • Tanpa Ribet
          </div>

          <h1
            className="handwritten"
            data-reveal
            style={{
              fontSize: 'clamp(2.5rem, 8vw, 5rem)',
              fontWeight: 700,
              lineHeight: 1.1,
              marginBottom: '16px',
              color: 'var(--text-primary)',
            }}
          >
            Wanz REST API&apos;s
          </h1>

          <div className="allergy-badge mb-6 icon-text" data-reveal>
            <BanIcon size={26} /> Alergi Pake Api Key <BanIcon size={26} />
          </div>

          <p
            data-reveal
            style={{
              fontSize: '1.25rem',
              color: 'var(--text-secondary)',
              maxWidth: '600px',
              margin: '0 auto 32px',
              lineHeight: 1.6,
            }}
          >
            Platform REST API modern untuk developer. Cepat, aman, dan tanpa ribet.
            Langsung pakai tanpa perlu daftar!
          </p>

          <div className="flex gap-4 justify-center flex-wrap" data-reveal>
            <a href="/docs" className="neo-button neo-button-accent icon-text" style={{ textDecoration: 'none' }}>
              <RocketIcon size={18} /> Mulai Sekarang
            </a>
            <a href="#stats" className="neo-button neo-button-secondary icon-text" style={{ textDecoration: 'none' }}>
              <ChartIcon size={18} /> Lihat Statistik
            </a>
          </div>
        </div>

        {/* Turnstile Verification */}
        <div className="neo-card rv-1" data-reveal style={{ padding: '24px', maxWidth: '500px', margin: '0 auto 40px' }}>
          <h3 className="icon-text" style={{ justifyContent: 'center', textAlign: 'center', marginBottom: '16px', color: 'var(--text-primary)' }}>
            <LockIcon size={19} /> Verifikasi Keamanan
          </h3>
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '16px', fontSize: '0.875rem' }}>
            Verifikasi untuk mengakses semua fitur API
          </p>
          <TurnstileWidget onVerify={handleVerify} />
          {verified && (
            <p className="icon-text" style={{ justifyContent: 'center', textAlign: 'center', color: '#22c55e', fontWeight: 600 }}>
              <CheckCircleIcon size={16} /> Verifikasi berhasil! Semua fitur terbuka untukmu.
            </p>
          )}
        </div>

        {/* Stats Section — data asli, bukan angka karangan */}
        <div id="stats" className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <div className="neo-card stat-card" data-reveal>
            <div className="stat-number icon-text" style={{ color: 'var(--accent-purple)', justifyContent: 'center' }}>
              <ServerIcon size={30} /> <CountUp value={liveEndpointCount} />
            </div>
            <p style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Endpoint Aktif</p>
          </div>
          <div className="neo-card stat-card" data-reveal>
            <div
              className="stat-number icon-text"
              style={{
                color: apiOnline === null ? 'var(--text-secondary)' : apiOnline ? '#22c55e' : 'var(--accent-orange)',
                justifyContent: 'center',
              }}
            >
              <span className="live-dot" style={{ background: apiOnline === null ? 'var(--text-secondary)' : apiOnline ? '#22c55e' : '#ef4444' }} />
              {apiOnline === null ? '...' : apiOnline ? 'Online' : 'Offline'}
            </div>
            <p className="icon-text" style={{ color: 'var(--text-secondary)', fontWeight: 600, justifyContent: 'center' }}>
              <ActivityIcon size={15} /> Status API{apiMs !== null ? ` • ${apiMs}ms` : ''}
            </p>
          </div>
          <div className="neo-card stat-card" data-reveal>
            <div className="stat-number icon-text" style={{ color: 'var(--accent-mint)', justifyContent: 'center' }}>
              <StarIcon size={30} /> {stars === null ? '...' : stars}
            </div>
            <p style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>GitHub Stars</p>
          </div>
        </div>

        {/* Visitor Info */}
        <div className="neo-card rv-1" data-reveal style={{ padding: '24px', maxWidth: '500px', margin: '0 auto 40px' }}>
          <h3 className="icon-text" style={{ marginBottom: '16px', color: 'var(--text-primary)' }}>
            <InfoIcon size={19} /> Info Pengunjung
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-secondary)' }}>IP Address:</span>
              <code
                className="mono"
                style={{
                  background: 'var(--bg-secondary)',
                  padding: '4px 12px',
                  borderRadius: '6px',
                  border: '2px solid var(--border-color)',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                }}
              >
                {ip}
              </code>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Status Baterai:</span>
              <span
                className="icon-text"
                style={{
                  fontWeight: 600,
                  color:
                    battery !== null
                      ? battery > 20
                        ? '#22c55e'
                        : 'var(--accent-orange)'
                      : 'var(--text-secondary)',
                }}
              >
                {battery !== null ? (
                  <>{battery}% {batteryCharging ? <ZapIcon size={15} /> : <BatteryIcon size={16} />}</>
                ) : (
                  'Tidak didukung'
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="mb-16">
          <h2
            className="handwritten icon-text"
            data-reveal
            style={{
              fontSize: '2.5rem',
              justifyContent: 'center',
              textAlign: 'center',
              marginBottom: '32px',
              color: 'var(--text-primary)',
            }}
          >
            <SparklesIcon size={30} /> Keunggulan Kami
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((f) => (
              <div key={f.title} className="neo-card" data-reveal style={{ padding: '24px' }}>
                <div className="feature-icon" style={{ background: f.bg, color: '#1a1a1a' }}>
                  <f.Icon size={26} />
                </div>
                <h3 style={{ fontWeight: 700, marginBottom: '8px', color: 'var(--text-primary)' }}>{f.title}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div
          className="neo-card pulse-glow"
          data-reveal
          style={{
            padding: '40px',
            textAlign: 'center',
            background: 'linear-gradient(135deg, var(--accent-purple), var(--accent-orange))',
          }}
        >
          <h2
            className="handwritten"
            style={{
              fontSize: '2.5rem',
              color: 'white',
              textShadow: '2px 2px 0px var(--border-color)',
              marginBottom: '16px',
            }}
          >
            Siap Memulai?
          </h2>
          <p
            style={{
              color: 'white',
              fontSize: '1.125rem',
              marginBottom: '24px',
              textShadow: '1px 1px 0px var(--border-color)',
            }}
          >
            Gunakan API kami sekarang juga. Gratis, cepat, dan tanpa ribet!
          </p>
          <a
            href="/docs"
            className="neo-button icon-text"
            style={{
              background: 'white',
              color: 'var(--text-primary)',
              textDecoration: 'none',
              fontSize: '1.125rem',
            }}
          >
            <DocsIcon size={20} /> Lihat Dokumentasi
          </a>
        </div>
      </section>

      <RoastSection />

      <Footer />
      </div>
    </>
  );
}
