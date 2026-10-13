import { ImageResponse } from 'next/og';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = "Wanz REST API's — REST API gratis tanpa API key";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#1a0b2e',
          color: '#ffffff',
          padding: '60px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            background: '#FACC15',
            color: '#1a1a1a',
            border: '4px solid #1a1a1a',
            borderRadius: '9999px',
            padding: '10px 26px',
            fontSize: 26,
            fontWeight: 800,
            marginBottom: 30,
          }}
        >
          GRATIS • TANPA LOGIN • TANPA API KEY
        </div>

        <div
          style={{
            fontSize: 92,
            fontWeight: 900,
            textAlign: 'center',
            lineHeight: 1.05,
            color: '#ffffff',
          }}
        >
          Wanz REST API&apos;s
        </div>

        <div
          style={{
            fontSize: 34,
            fontWeight: 600,
            color: '#e9d5ff',
            marginTop: 24,
            textAlign: 'center',
          }}
        >
          Platform REST API modern • cepat, aman, tanpa ribet
        </div>
      </div>
    ),
    size
  );
}
