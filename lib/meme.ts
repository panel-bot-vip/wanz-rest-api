import React from 'react';
import { ImageResponse } from '@vercel/og';

const FONT_CSS_URL = 'https://fonts.googleapis.com/css2?family=Anton&display=swap';

const fontCache: Record<string, Promise<ArrayBuffer> | null> = {};

function getFont(family: string, cssUrl: string): Promise<ArrayBuffer> {
  if (!fontCache[family]) {
    fontCache[family] = (async () => {
      const css = await (
        await fetch(cssUrl, {
          headers: { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/126.0' },
        })
      ).text();
      const m = css.match(/url\((https:[^)]+)\)/);
      if (!m) throw new Error('font_css');
      return (await (await fetch(m[1])).arrayBuffer());
    })();
    fontCache[family]!.catch(() => {
      fontCache[family] = null;
    });
  }
  return fontCache[family]!;
}

function memeFontSize(len: number): number {
  if (len <= 10) return 92;
  if (len <= 20) return 72;
  if (len <= 40) return 56;
  if (len <= 70) return 44;
  return 34;
}

// Teks meme klasik: putih + outline hitam tebal.
// WebkitTextStroke TIDAK di-paint Satori (terbukti 0 piksel) → pakai 8 salinan
// offset + 1 salinan tak terlihat sebagai pengukur tinggi (biar blok bawah pas).
function memeText(text: string, key: string): React.ReactNode {
  const upper = text.toUpperCase();
  const size = memeFontSize(upper.length);
  const off = Math.max(2, Math.round(size / 28));
  const offsets: Array<[number, number]> = [
    [-off, -off], [0, -off], [off, -off],
    [-off, 0], [off, 0],
    [-off, off], [0, off], [off, off],
  ];
  const font: React.CSSProperties = {
    fontFamily: 'Anton, Arial, sans-serif',
    fontSize: size,
    lineHeight: 1.05,
    letterSpacing: '0.02em',
    wordBreak: 'break-word',
    textAlign: 'center',
  };
  const copies: React.ReactNode[] = [
    React.createElement(
      'div',
      { key: `${key}-sizer`, style: { ...font, width: '100%', color: '#FFFFFF', opacity: 0 } },
      upper
    ),
  ];
  offsets.forEach(([dx, dy], i) => {
    copies.push(
      React.createElement(
        'div',
        {
          key: `${key}-o${i}`,
          style: {
            ...font, width: '100%', color: '#000000',
            position: 'absolute', left: 0, top: 0,
            transform: `translate(${dx}px, ${dy}px)`,
          },
        },
        upper
      )
    );
  });
  copies.push(
    React.createElement(
      'div',
      {
        key: `${key}-main`,
        style: { ...font, width: '100%', color: '#FFFFFF', position: 'absolute', left: 0, top: 0 },
      },
      upper
    )
  );
  return React.createElement(
    'div',
    { key, style: { display: 'flex', flexDirection: 'column', position: 'relative', width: '100%' } },
    ...copies
  );
}

export async function renderSmeme(
  imgDataUri: string,
  top: string,
  bottom: string,
  size: number
): Promise<ImageResponse> {
  const fontData = await getFont('Anton', FONT_CSS_URL);
  const pad = Math.round(size * 0.04);

  return new ImageResponse(
    React.createElement(
      'div',
      {
        style: {
          position: 'relative',
          width: '100%',
          height: '100%',
          display: 'flex',
          background: '#000000',
          overflow: 'hidden',
        },
      },
      React.createElement('img', {
        src: imgDataUri,
        style: { position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', objectFit: 'cover' },
      }),
      top
        ? React.createElement(
            'div',
            { style: { position: 'absolute', left: pad, right: pad, top: pad, display: 'flex', justifyContent: 'center' } },
            memeText(top, 'top')
          )
        : null,
      bottom
        ? React.createElement(
            'div',
            { style: { position: 'absolute', left: pad, right: pad, bottom: pad, display: 'flex', justifyContent: 'center' } },
            memeText(bottom, 'bottom')
          )
        : null
    ),
    {
      width: size,
      height: size,
      fonts: [{ name: 'Anton', data: fontData, weight: 400, style: 'normal' }],
    }
  );
}
