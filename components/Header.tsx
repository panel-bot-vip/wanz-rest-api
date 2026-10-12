'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ZapIcon, MoonIcon, SunIcon } from './Icons';

export default function Header() {
  const [darkMode, setDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('darkMode');
    if (saved === 'true') {
      setDarkMode(true);
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, []);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('darkMode', String(newMode));
    document.documentElement.setAttribute('data-theme', newMode ? 'dark' : 'light');
  };

  if (!mounted) return null;

  return (
    <header className="sticky top-0 z-50" style={{ 
      background: 'var(--card-bg)', 
      borderBottom: '3px solid var(--border-color)',
      boxShadow: '0 4px 0px var(--shadow-color)'
    }}>
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2 no-underline">
            <div style={{
              width: '36px',
              height: '36px',
              background: 'var(--accent-purple)',
              border: '3px solid var(--border-color)',
              borderRadius: '8px',
              boxShadow: '3px 3px 0px var(--shadow-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white'
            }}>
              <ZapIcon size={20} />
            </div>
            <span className="handwritten" style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Wanz REST API&apos;s
            </span>
          </Link>

          <nav className="flex items-center gap-1">
            <Link href="/" className="nav-link" style={{ fontSize: '0.875rem', padding: '6px 12px' }}>Beranda</Link>
            <Link href="/docs" className="nav-link" style={{ fontSize: '0.875rem', padding: '6px 12px' }}>Dokumentasi</Link>
          </nav>

          <button
            onClick={toggleDarkMode}
            className="neo-button"
            style={{ 
              padding: '6px 12px',
              background: darkMode ? 'var(--accent-purple)' : 'var(--accent-yellow)',
              color: darkMode ? 'white' : 'var(--text-primary)'
            }}
            aria-label="Toggle dark mode"
          >
            {darkMode ? <SunIcon size={18} /> : <MoonIcon size={18} />}
          </button>
        </div>
      </div>
    </header>
  );
}
