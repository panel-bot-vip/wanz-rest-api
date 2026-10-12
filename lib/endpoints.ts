export interface EndpointParam {
  name: string;
  type: string;
  required: boolean;
  description: string;
  default?: string;
  options?: string[];
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

export const CATEGORIES = ['Semua', 'Pencarian', 'AI'];

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
    id: 'ai-chat',
    name: 'AI Chat',
    path: '/api/ai/chat',
    method: 'GET',
    category: 'AI',
    description: 'Chat dengan AI gratis tanpa API key. Kirim pertanyaan lewat parameter `q`, opsional pilih `model`.',
    status: 'live',
    params: [
      { name: 'q', type: 'string', required: true, description: 'Pertanyaan untuk AI' },
      { name: 'model', type: 'select', required: false, description: 'Model AI yang dipakai', default: 'openai', options: ['openai', 'openai-fast'] },
    ],
  },
];
