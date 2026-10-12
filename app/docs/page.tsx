'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ApiTester from '@/components/ApiTester';
import { SearchIcon, CodeIcon } from '@/components/Icons';

const API_ENDPOINTS = [
  {
    id: 'google-search',
    name: 'Search Google',
    path: '/api/google-search',
    method: 'GET',
    category: 'Search',
    description: 'Cari informasi dari Google dengan Custom Search JSON API',
    params: [
      { name: 'q', type: 'string', required: true, description: 'Query pencarian' },
      { name: 'limit', type: 'number', required: false, description: 'Jumlah hasil (default: 10, max: 10)' }
    ]
  }
];

export default function DocsPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredEndpoints = API_ENDPOINTS.filter(endpoint =>
    endpoint.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    endpoint.path.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="handwritten" style={{ 
            fontSize: '2.5rem', 
            fontWeight: 700,
            marginBottom: '8px',
            color: 'var(--text-primary)'
          }}>
            Dokumentasi API
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Endpoint API yang tersedia dan siap digunakan.
          </p>
        </div>

        {/* Search */}
        <div className="neo-card" style={{ padding: '16px', marginBottom: '24px' }}>
          <input
            type="text"
            className="neo-input"
            style={{ width: '100%' }}
            placeholder="Cari endpoint..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        {/* API List */}
        <div className="space-y-4">
          {filteredEndpoints.length === 0 ? (
            <div className="neo-card" style={{ padding: '32px', textAlign: 'center' }}>
              <p style={{ color: 'var(--text-secondary)' }}>
                Tidak ada endpoint yang ditemukan.
              </p>
            </div>
          ) : (
            filteredEndpoints.map(endpoint => (
              <div key={endpoint.id} className="endpoint-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ flex: 1, minWidth: '200px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {endpoint.name}
                      </h3>
                      <span className="method-badge">{endpoint.method}</span>
                    </div>
                    <code style={{ 
                      display: 'block',
                      background: 'var(--bg-secondary)',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      border: '2px solid var(--border-color)',
                      fontSize: '0.8rem',
                      marginBottom: '8px',
                      fontFamily: 'monospace'
                    }}>
                      {endpoint.path}
                    </code>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '12px' }}>
                      {endpoint.description}
                    </p>

                    {/* Parameters */}
                    <div>
                      <h4 style={{ fontWeight: 700, marginBottom: '6px', color: 'var(--text-primary)', fontSize: '0.8rem' }}>
                        Parameter:
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {endpoint.params.map(param => (
                          <div key={param.name} style={{ 
                            display: 'flex', 
                            gap: '6px', 
                            alignItems: 'center',
                            fontSize: '0.8rem',
                            flexWrap: 'wrap'
                          }}>
                            <code style={{ 
                              background: 'var(--accent-mint)',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              border: '1px solid var(--border-color)',
                              fontWeight: 600
                            }}>
                              {param.name}
                            </code>
                            <span style={{ color: 'var(--text-secondary)' }}>
                              {param.type}
                              {param.required && <span style={{ color: 'var(--accent-orange)' }}> *</span>}
                            </span>
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                              - {param.description}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <ApiTester 
                    endpoint={endpoint.path}
                    method={endpoint.method}
                    params={endpoint.params}
                  />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Usage Example */}
        <div className="neo-card" style={{ padding: '20px', marginTop: '24px' }}>
          <h3 style={{ fontWeight: 700, marginBottom: '12px', color: 'var(--text-primary)', fontSize: '1rem' }}>
            Contoh Penggunaan
          </h3>
          <div className="code-block">
{`// JavaScript Fetch
fetch('${API_ENDPOINTS[0].path}?q=programming&limit=5')
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Error:', error));`}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
