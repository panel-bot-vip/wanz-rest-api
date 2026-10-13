import type { Metadata } from 'next';
import './globals.css';
import AntiClone from '@/components/AntiClone';

export const metadata: Metadata = {
  title: "Wanz REST API's - Platform REST API Gratis Tanpa Login",
  description:
    'Platform penyedia REST API gratis, tanpa login, tanpa ribet. Alergi Pake Api Key!',
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
