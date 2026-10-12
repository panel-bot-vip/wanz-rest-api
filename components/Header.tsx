'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { PALETTES, applyPalette, getStoredPalette } from '@/lib/palettes';
import {
  HomeIcon, DocsIcon, ChartIcon, ZapIcon, PaletteIcon,
  SunIcon, MoonIcon, MenuIcon, XIcon, CheckIcon,
} from './icons';

const NAV_ITEMS = [
  { href: '/', text: 'Beranda', Icon: HomeIcon },
  { href: '/docs', text: 'Dokumentasi', Icon: DocsIcon },
  { href: '/#stats', text: 'Statistik', Icon: ChartIcon },
];

export default function Header() {
  const [darkMode, setDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [palette, setPalette] = useState('ungu');
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const paletteRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

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
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (paletteOpen || menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [paletteOpen, menuOpen]);

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
        {/* 1 baris horizontal: logo kiri, kontrol kanan */}
        <div className="flex flex-row items-center justify-between gap-2">
          <Link href="/" className="flex items-center gap-2 no-underline shrink-0" aria-label="Wanz REST APIs - Beranda">
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
                color: '#fff',
                flexShrink: 0,
              }}
            >
              <ZapIcon size={20} />
            </div>
            <span
              className="handwritten"
              style={{ fontSize: 'clamp(1.15rem, 4vw, 1.5rem)', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}
            >
              Wanz REST API&apos;s
            </span>
          </Link>

          {/* Menu teks desktop — disembunyikan di HP */}
          <nav className="hidden md:flex items-center gap-2" aria-label="Navigasi utama">
            {NAV_ITEMS.map((item) => (
              <Link key={item.href} href={item.href} className="nav-link icon-text">
                <item.Icon size={16} /> {item.text}
              </Link>
            ))}
          </nav>

          {/* Kontrol kanan: palette + dark mode + hamburger */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Palette Switcher */}
            <div ref={paletteRef} className="relative">
              <button
                onClick={() => { setPaletteOpen(!paletteOpen); setMenuOpen(false); }}
                className="neo-button"
                style={{
                  padding: '8px 12px',
                  background: 'var(--accent-mint)',
                  fontSize: '0.875rem',
                }}
                aria-label="Ganti palet warna"
                aria-expanded={paletteOpen}
              >
                <PaletteIcon size={16} /><span className="hidden sm:inline">&nbsp;Warna</span>
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
                            flexShrink: 0,
                          }}
                        />
                        {p.name}
                        {palette === p.id && <span style={{ marginLeft: 'auto', display: 'inline-flex' }}><CheckIcon size={14} /></span>}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Dark Mode Toggle — selalu di kanan */}
            <button
              onClick={toggleDarkMode}
              className="neo-button"
              style={{
                padding: '8px 12px',
                background: darkMode ? 'var(--accent-purple)' : 'var(--accent-yellow)',
                color: darkMode ? 'white' : 'var(--text-primary)',
                minWidth: '44px',
                justifyContent: 'center',
              }}
              aria-label={darkMode ? 'Matikan mode gelap' : 'Nyalakan mode gelap'}
            >
              {darkMode ? <SunIcon size={18} /> : <MoonIcon size={18} />}
            </button>

            {/* Hamburger — hanya di HP */}
            <div ref={menuRef} className="relative md:hidden">
              <button
                onClick={() => { setMenuOpen(!menuOpen); setPaletteOpen(false); }}
                className="neo-button"
                style={{
                  padding: '8px 12px',
                  background: menuOpen ? 'var(--accent-orange)' : 'var(--card-bg)',
                  color: menuOpen ? 'white' : 'var(--text-primary)',
                  minWidth: '44px',
                  justifyContent: 'center',
                }}
                aria-label={menuOpen ? 'Tutup menu' : 'Buka menu'}
                aria-expanded={menuOpen}
              >
                {menuOpen ? <XIcon size={18} /> : <MenuIcon size={18} />}
              </button>
              {menuOpen && (
                <nav
                  className="absolute right-0 top-full mt-2 neo-card pop-in"
                  style={{ padding: '8px', minWidth: '200px', zIndex: 60 }}
                  aria-label="Menu navigasi mobile"
                >
                  {NAV_ITEMS.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="nav-link icon-text"
                      onClick={() => setMenuOpen(false)}
                      style={{ display: 'flex', padding: '10px 14px' }}
                    >
                      <item.Icon size={16} /> {item.text}
                    </Link>
                  ))}
                </nav>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
