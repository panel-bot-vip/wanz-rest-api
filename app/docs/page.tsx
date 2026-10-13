'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ApiTester from '@/components/ApiTester';
import RevealOnScroll from '@/components/RevealOnScroll';
import ScrollProgress from '@/components/ScrollProgress';
import { ENDPOINTS, CATEGORIES } from '@/lib/endpoints';
import { DocsIcon, FrownIcon, LockIcon, BulbIcon } from '@/components/icons';

export default function DocsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');

  const filteredEndpoints = ENDPOINTS.filter((endpoint) => {
    const matchesSearch =
      endpoint.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      endpoint.path.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'Semua' || endpoint.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <>
      <ScrollProgress />
      <RevealOnScroll />
      <div className="min-h-screen page-layer">
      <Header />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1
            className="handwritten icon-text"
            data-reveal
            style={{
              fontSize: '3rem',
              fontWeight: 700,
              marginBottom: '8px',
              color: 'var(--text-primary)',
            }}
          >
            <DocsIcon size={36} /> Dokumentasi API
          </h1>
          <p data-reveal style={{ color: 'var(--text-secondary)', fontSize: '1.125rem' }}>
            Temukan semua endpoint API yang tersedia dan uji coba langsung.
          </p>
        </div>

        {/* Search and Filter */}
        <div className="neo-card" data-reveal style={{ padding: '20px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ flex: '1', minWidth: '250px' }}>
              <input
                type="text"
                className="neo-input"
                placeholder="Cari endpoint API..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {CATEGORIES.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className="neo-button"
                  style={{
                    padding: '8px 16px',
                    fontSize: '0.875rem',
                    background: selectedCategory === category ? 'var(--accent-yellow)' : 'var(--card-bg)',
                  }}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* API List */}
        <div id="api-list" className="space-y-6">
          {filteredEndpoints.length === 0 ? (
            <div className="neo-card" style={{ padding: '40px', textAlign: 'center' }}>
              <p className="icon-text" style={{ color: 'var(--text-secondary)', fontSize: '1.125rem', justifyContent: 'center' }}>
                <FrownIcon size={22} /> Tidak ada endpoint yang ditemukan.
              </p>
            </div>
          ) : (
            filteredEndpoints.map((endpoint) => (
              <div key={endpoint.id} className="endpoint-card" data-reveal>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                  <div style={{ flex: '1', minWidth: '250px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px', flexWrap: 'wrap' }}>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {endpoint.name}
                      </h3>
                      <span className="method-badge">{endpoint.method}</span>
                      <span
                        style={{
                          background: 'var(--bg-secondary)',
                          border: '2px solid var(--border-color)',
                          borderRadius: '6px',
                          padding: '4px 10px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                        }}
                      >
                        {endpoint.category}
                      </span>
                      {endpoint.status === 'live' ? (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            color: '#166534',
                          }}
                        >
                          <span className="live-dot" /> LIVE
                        </span>
                      ) : (
                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            color: 'var(--text-secondary)',
                            border: '2px dashed var(--border-color)',
                            borderRadius: '6px',
                            padding: '2px 8px',
                          }}
                        >
                          SEGERA HADIR
                        </span>
                      )}
                    </div>
                    <code
                      className="mono"
                      style={{
                        display: 'block',
                        background: 'var(--bg-secondary)',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: '2px solid var(--border-color)',
                        fontSize: '0.875rem',
                        marginBottom: '12px',
                      }}
                    >
                      {endpoint.path}
                    </code>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>{endpoint.description}</p>

                    {/* Parameters */}
                    {endpoint.params.length > 0 && (
                      <div style={{ marginBottom: '16px' }}>
                        <h4 style={{ fontWeight: 700, marginBottom: '8px', color: 'var(--text-primary)', fontSize: '0.875rem' }}>
                          Parameter:
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {endpoint.params.map((param) => (
                            <div
                              key={param.name}
                              style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '0.875rem', flexWrap: 'wrap' }}
                            >
                              <code
                                className="mono"
                                style={{
                                  background: 'var(--accent-mint)',
                                  padding: '2px 8px',
                                  borderRadius: '4px',
                                  border: '1px solid var(--border-color)',
                                  fontWeight: 600,
                                }}
                              >
                                {param.name}
                              </code>
                              <span style={{ color: 'var(--text-secondary)' }}>
                                {param.type}
                                {param.required && <span style={{ color: 'var(--accent-orange)' }}> *</span>}
                              </span>
                              <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                                — {param.description}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {endpoint.status === 'live' ? (
                      <ApiTester endpoint={endpoint} />
                    ) : (
                      <button
                        className="neo-button"
                        style={{ padding: '8px 16px', fontSize: '0.875rem', opacity: 0.5, cursor: 'not-allowed' }}
                        disabled
                      >
                        <span className="icon-text"><LockIcon size={15} /> Segera Hadir</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Usage Example */}
        <div className="neo-card" data-reveal style={{ padding: '24px', marginTop: '32px' }}>
          <h3 className="icon-text" style={{ fontWeight: 700, marginBottom: '16px', color: 'var(--text-primary)' }}>
            <BulbIcon size={18} /> Contoh Penggunaan
          </h3>
          <div className="code-block">
            {`// JavaScript Fetch
fetch('${ENDPOINTS[0].path}?q=programming&limit=5')
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Error:', error));

// cURL
curl "${ENDPOINTS[0].path}?q=programming&limit=5"`}
          </div>
        </div>
      </div>

      <Footer />
      </div>
    </>
  );
}
