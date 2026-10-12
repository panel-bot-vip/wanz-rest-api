export interface EndpointParam {
  name: string;
  type: string;
  required: boolean;
  description: string;
  default?: string;
}

export interface Endpoint {
  id: string;
  name: string;
  path: string;
  method: 'GET' | 'POST';
  category: string;
  description: string;
  status: 'live' | 'soon';
  params: EndpointParam[];
}

export const CATEGORIES = ['Semua', 'Pencarian', 'Pengembangan', 'Hiburan'];

export const ENDPOINTS: Endpoint[] = [
  {
    id: 'google-search',
    name: 'Search Google',
    path: '/api/google-search',
    method: 'GET',
    category: 'Pencarian',
    description: 'Cari hasil dari Google langsung tanpa API key. Cukup kirim parameter `q` dengan query pencarianmu.',
    status: 'live',
    params: [
      { name: 'q', type: 'string', required: true, description: 'Query pencarian' },
      { name: 'limit', type: 'number', required: false, description: 'Jumlah hasil (default: 8, max: 10)', default: '8' },
    ],
  },
  {
    id: 'github-profile',
    name: 'GitHub Profile',
    path: '/api/github-profile',
    method: 'GET',
    category: 'Pengembangan',
    description: 'Ambil informasi profil GitHub publik: bio, followers, repo, dan lainnya.',
    status: 'soon',
    params: [
      { name: 'username', type: 'string', required: true, description: 'Username GitHub' },
    ],
  },
  {
    id: 'random-quote',
    name: 'Random Quote',
    path: '/api/random-quote',
    method: 'GET',
    category: 'Hiburan',
    description: 'Dapatkan quote inspiratif acak setiap request. Tanpa parameter.',
    status: 'soon',
    params: [],
  },
  {
    id: 'url-shortener',
    name: 'URL Shortener',
    path: '/api/shorten',
    method: 'POST',
    category: 'Pengembangan',
    description: 'Pendekkan URL panjang menjadi short link yang mudah dibagikan.',
    status: 'soon',
    params: [
      { name: 'url', type: 'string', required: true, description: 'URL yang akan dipendekkan' },
    ],
  },
];
