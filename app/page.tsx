'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import TurnstileWidget from '@/components/TurnstileWidget';
import { ZapIcon, RocketIcon, ChartIcon, ShieldIcon, UnlockIcon, TestTubeIcon, GlobeIcon, BatteryIcon, CheckIcon, AlertIcon } from '@/components/Icons';

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [ip, setIp] = useState('---');
  const [battery, setBattery] = useState<number | null>(null);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    fetch('https://api.ipify.org?format=json')
      .then(res => res.json())
      .then(data => setIp(data.ip))
      .catch(() => setIp('Unknown'));

    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        setBattery(Math.round(battery.level * 100));
        battery.addEventListener('levelchange', () => {
          setBattery(Math.round(battery.level * 100));
        });
      });
    }
  }, []);

  const handleVerify = (token: string) => {
    if (token) setVerified(true);
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen">
      <Header />
      
      {/* Hero Section */}
      <section className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <div className="neo-badge mb-4">
            <CheckIcon size={16} />
            <span>Gratis • Tanpa Login • Tanpa Ribet</span>
          </div>
          
          <h1 className="handwritten" style={{ 
            fontSize: 'clamp(2rem, 6vw, 3.5rem)', 
            fontWeight: 700, 
            lineHeight: 1.1,
            marginBottom: '12px',
            color: 'var(--text-primary)'
          }}>
            Wanz REST API&apos;s
          </h1>
          
          <div className="allergy-badge mb-4">
            Alergi Pake Api Key
          </div>
          
          <p style={{ 
            fontSize: '1rem', 
            color: 'var(--text-secondary)', 
            maxWidth: '500px', 
            margin: '0 auto 24px',
            lineHeight: 1.5
          }}>
            Platform REST API modern untuk developer. Cepat, aman, dan tanpa ribet.
          </p>

          <div className="flex gap-3 justify-center flex-wrap">
            <a href="/docs" className="neo-button neo-button-accent" style={{ textDecoration: 'none' }}>
              <RocketIcon size={18} />
              <span>Mulai Sekarang</span>
            </a>
            <a href="#features" className="neo-button neo-button-secondary" style={{ textDecoration: 'none' }}>
              <ChartIcon size={18} />
              <span>Lihat Fitur</span>
            </a>
          </div>
        </div>

        {/* Turnstile Verification */}
        <div className="neo-card" style={{ padding: '20px', maxWidth: '400px', margin: '0 auto 32px' }}>
          <h3 style={{ textAlign: 'center', marginBottom: '12px', color: 'var(--text-primary)', fontSize: '1rem' }}>
            Verifikasi Keamanan
          </h3>
          <TurnstileWidget onVerify={handleVerify} />
          {verified && (
            <p style={{ textAlign: 'center', color: 'var(--accent-mint)', fontWeight: 600, fontSize: '0.875rem' }}>
              <CheckIcon size={14} /> Verifikasi berhasil!
            </p>
          )}
        </div>

        {/* Visitor Info */}
        <div className="neo-card" style={{ padding: '16px', maxWidth: '400px', margin: '0 auto 32px' }}>
          <h3 style={{ marginBottom: '12px', color: 'var(--text-primary)', fontSize: '0.9rem' }}>Info Pengunjung</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>IP Address:</span>
              <code style={{ 
                background: 'var(--bg-secondary)', 
                padding: '2px 8px', 
                borderRadius: '4px',
                border: '1px solid var(--border-color)',
                fontWeight: 600,
                fontSize: '0.8rem'
              }}>
                {ip}
              </code>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Baterai:</span>
              <span style={{ 
                fontWeight: 600,
                fontSize: '0.875rem',
                color: battery !== null ? (battery > 20 ? 'var(--accent-mint)' : 'var(--accent-orange)') : 'var(--text-secondary)'
              }}>
                {battery !== null ? `${battery}%` : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div id="features" className="mb-12">
          <h2 className="handwritten" style={{ 
            fontSize: '2rem', 
            textAlign: 'center', 
            marginBottom: '24px',
            color: 'var(--text-primary)'
          }}>
            Keunggulan
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="neo-card" style={{ padding: '16px' }}>
              <div className="feature-icon" style={{ background: 'var(--accent-yellow)', width: '48px', height: '48px' }}>
                <ZapIcon size={24} />
              </div>
              <h3 style={{ fontWeight: 700, marginBottom: '4px', color: 'var(--text-primary)', fontSize: '1rem' }}>Super Responsif</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                Response time cepat dengan serverless infrastructure.
              </p>
            </div>

            <div className="neo-card" style={{ padding: '16px' }}>
              <div className="feature-icon" style={{ background: 'var(--accent-mint)', width: '48px', height: '48px' }}>
                <UnlockIcon size={24} />
              </div>
              <h3 style={{ fontWeight: 700, marginBottom: '4px', color: 'var(--text-primary)', fontSize: '1rem' }}>Tanpa Login</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                Langsung pakai tanpa perlu register atau login.
              </p>
            </div>

            <div className="neo-card" style={{ padding: '16px' }}>
              <div className="feature-icon" style={{ background: 'var(--accent-orange)', width: '48px', height: '48px' }}>
                <ShieldIcon size={24} />
              </div>
              <h3 style={{ fontWeight: 700, marginBottom: '4px', color: 'var(--text-primary)', fontSize: '1rem' }}>Aman</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                Dilindungi Cloudflare Turnstile verification.
              </p>
            </div>

            <div className="neo-card" style={{ padding: '16px' }}>
              <div className="feature-icon" style={{ background: 'var(--accent-purple)', width: '48px', height: '48px' }}>
                <TestTubeIcon size={24} />
              </div>
              <h3 style={{ fontWeight: 700, marginBottom: '4px', color: 'var(--text-primary)', fontSize: '1rem' }}>Coba Langsung</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                Uji coba API langsung dari browser.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="neo-card pulse-glow" style={{ 
          padding: '32px', 
          textAlign: 'center',
          background: 'linear-gradient(135deg, var(--accent-purple), var(--accent-orange))'
        }}>
          <h2 className="handwritten" style={{ 
            fontSize: '2rem', 
            color: 'white',
            textShadow: '2px 2px 0px var(--border-color)',
            marginBottom: '12px'
          }}>
            Siap Memulai?
          </h2>
          <p style={{ 
            color: 'white',
            fontSize: '1rem',
            marginBottom: '20px',
            textShadow: '1px 1px 0px var(--border-color)'
          }}>
            Gunakan API kami sekarang juga. Gratis, cepat, dan tanpa ribet!
          </p>
          <a href="/docs" className="neo-button" style={{ 
            background: 'white',
            color: 'var(--text-primary)',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <RocketIcon size={18} />
            <span>Lihat Dokumentasi</span>
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
}
