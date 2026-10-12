export interface Palette {
  id: string;
  name: string;
  swatch: string;
  bg: string;
}

export const PALETTES: Palette[] = [
  { id: 'ungu', name: 'Ungu Klasik', swatch: '#a855f7', bg: '#f3e8ff' },
  { id: 'sunset', name: 'Sunset', swatch: '#f97316', bg: '#fff7ed' },
  { id: 'mint', name: 'Mint Segar', swatch: '#34d399', bg: '#ecfdf5' },
  { id: 'lemon', name: 'Lemon', swatch: '#facc15', bg: '#fefce8' },
];

export function applyPalette(paletteId: string) {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-palette', paletteId);
  try {
    localStorage.setItem('wanz-palette', paletteId);
  } catch {
    /* ignore */
  }
}

export function getStoredPalette(): string {
  if (typeof document === 'undefined') return 'ungu';
  try {
    return localStorage.getItem('wanz-palette') || 'ungu';
  } catch {
    return 'ungu';
  }
}
