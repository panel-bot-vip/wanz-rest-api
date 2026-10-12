import React from 'react';
import { ImageResponse } from '@vercel/og';

const BRAT_GREEN = '#8ACE00';
const FONT_CSS_URL = 'https://fonts.googleapis.com/css2?family=Arimo:wght@400&display=swap';

let fontCache: Promise<ArrayBuffer> | null = null;

function getFont(): Promise<ArrayBuffer> {
  if (!fontCache) {
    fontCache = (async () => {
      const css = await (
        await fetch(FONT_CSS_URL, {
          headers: { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/126.0' },
        })
      ).text();
      const m = css.match(/url\((https:[^)]+)\)/);
      if (!m) throw new Error('font_css');
      const buf = await (await fetch(m[1])).arrayBuffer();
      return buf;
    })();
    fontCache.catch(() => {
      fontCache = null;
    });
  }
  return fontCache;
}

function fontSizeFor(len: number, scale: number): number {
  const base = len <= 6 ? 150 : len <= 12 ? 110 : len <= 25 ? 72 : len <= 60 ? 48 : 32;
  return Math.round(base * scale);
}

// Render gambar gaya sampul "brat": kotak hijau + teks hitam tengah.
export async function renderBrat(text: string, size: number): Promise<ImageResponse> {
  const fontData = await getFont();
  const scale = size / 500;
  const pad = Math.round(size * 0.07);

  return new ImageResponse(
    React.createElement(
      'div',
      {
        style: {
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: BRAT_GREEN,
          padding: `${pad}px`,
        },
      },
      React.createElement(
        'div',
        {
          style: {
            fontFamily: 'Arimo, Arial, sans-serif',
            fontSize: fontSizeFor(text.length, scale),
            color: '#000000',
            textAlign: 'center',
            lineHeight: 0.95,
            letterSpacing: '-0.02em',
            wordBreak: 'break-word',
          },
        },
        text
      )
    ),
    {
      width: size,
      height: size,
      fonts: [{ name: 'Arimo', data: fontData, weight: 400, style: 'normal' }],
    }
  );
}
