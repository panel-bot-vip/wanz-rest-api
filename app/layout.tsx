import type { Metadata } from 'next';
import './globals.css';
import AntiClone from '@/components/AntiClone';

export const metadata: Metadata = {
  metadataBase: new URL('https://rest-api-wanz-codex.vercel.app'),
  title: "Wanz REST API's - Platform REST API Gratis Tanpa Login",
  description:
    'Platform penyedia REST API gratis, tanpa login, tanpa ribet. Alergi Pake Api Key!',
  applicationName: "Wanz REST API's",
  keywords: ['REST API', 'API gratis', 'API tanpa key', 'API Indonesia', 'developer tools'],
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    url: 'https://rest-api-wanz-codex.vercel.app',
    siteName: "Wanz REST API's",
    title: "Wanz REST API's - Platform REST API Gratis Tanpa Login",
    description:
      'Platform penyedia REST API gratis, tanpa login, tanpa ribet. Alergi Pake Api Key!',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Wanz REST API's - Platform REST API Gratis Tanpa Login",
    description:
      'Platform penyedia REST API gratis, tanpa login, tanpa ribet. Alergi Pake Api Key!',
  },
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
  },
  themeColor: '#A855F7',
};

// Script ini mencegah FOUC (flash of wrong theme) sebelum React hydrate
const themeInitScript = `
(function() {
  try {
    var dark = localStorage.getItem('darkMode') === 'true';
    var palette = localStorage.getItem('wanz-palette') || 'ungu';
    if (dark) document.documentElement.setAttribute('data-theme', 'dark');
    document.documentElement.setAttribute('data-palette', palette);
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <AntiClone />
        {children}
      </body>
    </html>
  );
}
