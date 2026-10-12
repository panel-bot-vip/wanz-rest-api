import React from 'react';
import { ImageResponse } from '@vercel/og';

const BRAT_GREEN = '#8ACF00';

export const BRAT_COLORS: Record<string, string> = {
  hijau: '#8ACF00',
  putih: '#FFFFFF',
  hitam: '#000000',
  ungu: '#A855F7',
  kuning: '#FACC15',
  pink: '#F472B6',
  biru: '#60A5FA',
  merah: '#EF4444',
  orange: '#FB923C',
  mint: '#6EE7B7',
};

// Terima nama warna atau hex bebas (#rrggbb), teks menyesuaikan kontras.
export function resolveBratColors(input: string): { bg: string; fg: string } {
  const key = input.trim().toLowerCase();
  let bg = BRAT_COLORS[key];
  if (!bg) {
    const hex = key.charAt(0) === '#' ? key : '#' + key;
    if (/^#[0-9a-f]{6}$/i.test(hex)) {
      bg = hex.toUpperCase();
    } else {
      bg = BRAT_GREEN;
    }
  }
  const r = parseInt(bg.slice(1, 3), 16);
  const g = parseInt(bg.slice(3, 5), 16);
  const b = parseInt(bg.slice(5, 7), 16);
  const lum = 0.299 * r + 0.587 * g + 0.114 * b;
  return { bg, fg: lum > 140 ? '#000000' : '#FFFFFF' };
}
const FONT_CSS_URL = 'https://fonts.googleapis.com/css2?family=Archivo+Narrow:wght@500&display=swap';
const FONT_NAME = 'Arial Narrow';

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

// Ukuran font meniru textFit generator asli: teks mengisi kotak (dibatasi 34% lebar).
function fontSizeFor(len: number, size: number): number {
  const fit = size * Math.sqrt(0.85 / Math.max(len, 1));
  const cap = size * 0.34;
  return Math.round(Math.min(fit, cap));
}

// Render gambar gaya generator brat asli: Arial Narrow + blur + teks mengisi kotak.
export async function renderBrat(text: string, size: number, bgInput: string): Promise<ImageResponse> {
  const fontData = await getFont();
  const pad = Math.round(size * 0.07);
  const colors = resolveBratColors(bgInput || 'hijau');
  const blur = Math.max(1, Math.round(size / 250));

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
          background: colors.bg,
          padding: `${pad}px`,
        },
      },
      React.createElement(
        'div',
        {
          style: {
            fontFamily: `'${FONT_NAME}', 'Archivo Narrow', Arial, sans-serif`,
            fontWeight: 500,
            fontSize: fontSizeFor(text.length, size),
            color: colors.fg,
            textAlign: 'center',
            lineHeight: 0.95,
            letterSpacing: '-0.02em',
            wordBreak: 'break-word',
            filter: `blur(${blur}px)`,
          },
        },
        text
      )
    ),
    {
      width: size,
      height: size,
      fonts: [{ name: FONT_NAME, data: fontData, weight: 500, style: 'normal' }],
    }
  );
}
