'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { PALETTES, applyPalette, getStoredPalette } from '@/lib/palettes';

export default function Header() {
  const [darkMode, setDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [palette, setPalette] = useState('ungu');
  const [paletteOpen, setPaletteOpen] = useState(false);
  const paletteRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    const savedDark = localStorage.getItem('darkMode');
    if (savedDark === 'true') {
      setDarkMode(true);
      document.documentElement.setAttribute('data-theme', 'dark');
    }
    setPalette(getStoredPalette());
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (paletteRef.current && !paletteRef.current.contains(e.target as Node)) {
        setPaletteOpen(false);
      }
    }
    if (paletteOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [paletteOpen]);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('darkMode', String(newMode));
    document.documentElement.setAttribute('data-theme', newMode ? 'dark' : 'light');
  };

  const handlePaletteChange = (id: string) => {
    setPalette(id);
    applyPalette(id);
    setPaletteOpen(false);
  };

  if (!mounted) return null;

  return (
    <header
      className="sticky top-0 z-50"
      style={{
        background: 'var(--card-bg)',
        borderBottom: '3px solid var(--border-color)',
        boxShadow: '0 4px 0px var(--shadow-color)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <Link href="/" className="flex items-center gap-2 no-underline">
            <div
              style={{
                width: '40px',
                height: '40px',
                background: 'var(--accent-purple)',
                border: '3px solid var(--border-color)',
                borderRadius: '10px',
                boxShadow: '3px 3px 0px var(--shadow-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.2rem',
              }}
            >
              ⚡
            </div>
            <span
              className="handwritten"
              style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}
            >
              Wanz REST API&apos;s
            </span>
          </Link>

          <nav className="flex items-center gap-2 flex-wrap">
            <Link href="/" className="nav-link">Beranda</Link>
            <Link href="/docs" className="nav-link">Dokumentasi</Link>
            <Link href="/#stats" className="nav-link">Statistik</Link>
          </nav>

          <div className="flex items-center gap-3">
            {/* Palette Switcher */}
            <div ref={paletteRef} className="relative">
              <button
                onClick={() => setPaletteOpen(!paletteOpen)}
                className="neo-button"
                style={{
                  padding: '8px 12px',
                  background: 'var(--accent-mint)',
                  fontSize: '0.875rem',
                }}
                aria-label="Ganti palet warna"
              >
                🎨 Warna
              </button>
              {paletteOpen && (
                <div
                  className="absolute right-0 top-full mt-2 neo-card pop-in"
                  style={{ padding: '12px', minWidth: '180px', zIndex: 60 }}
                >
                  <p style={{ fontSize: '0.75rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-secondary)' }}>
                    Palet Warna
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {PALETTES.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => handlePaletteChange(p.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '6px 8px',
                          borderRadius: '8px',
                          border: '2px solid',
                          borderColor: palette === p.id ? 'var(--border-color)' : 'transparent',
                          background: palette === p.id ? 'var(--bg-secondary)' : 'transparent',
                          cursor: 'pointer',
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          color: 'var(--text-primary)',
                        }}
                      >
                        <span
                          style={{
                            width: '16px',
                            height: '16px',
                            borderRadius: '4px',
                            border: '2px solid var(--border-color)',
                            background: p.swatch,
                            display: 'inline-block',
                          }}
                        />
                        {p.name}
                        {palette === p.id && <span style={{ marginLeft: 'auto' }}>✓</span>}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className="neo-button"
              style={{
                padding: '8px 16px',
                background: darkMode ? 'var(--accent-purple)' : 'var(--accent-yellow)',
                color: darkMode ? 'white' : 'var(--text-primary)',
              }}
              aria-label="Toggle dark mode"
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
