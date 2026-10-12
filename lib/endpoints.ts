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

export const CATEGORIES = ['Semua', 'Pencarian', 'AI', 'Downloader', 'Tools'];

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
    name: 'AI Chat (DeepAI)',
    path: '/api/ai/chat',
    method: 'GET',
    category: 'AI',
    description: 'Chat dengan AI gratis tanpa API key (scrape langsung DeepAI). Kirim pertanyaan lewat parameter `q`, opsional pilih `model`.',
    status: 'live',
    params: [
      { name: 'q', type: 'string', required: true, description: 'Pertanyaan untuk AI' },
      { name: 'model', type: 'select', required: false, description: 'Model AI yang dipakai', default: 'standard', options: ['standard', 'llama-3.1-8b-instant', 'gpt-4o-mini', 'claude-haiku-5-5', 'glm-5.3-flash', 'qwen3.8-flash', 'deepseek-v4.1-flash', 'gpt-6-luna', 'gpt-5.6-luna', 'gpt-5.6-sol', 'tencent-hy3', 'gpt-oss-120b', 'gemma-4', 'llama-3.3-70b-instruct'] },
    ],
  },
  {
    id: 'tiktok-dl',
    name: 'TikTok Downloader',
    path: '/api/dl/tiktok',
    method: 'GET',
    category: 'Downloader',
    description: 'Download video TikTok tanpa watermark (scrape langsung halaman video). Balikin link play, watermark, musik, dan cover.',
    status: 'live',
    params: [
      { name: 'url', type: 'string', required: true, description: 'Link video TikTok' },
    ],
  },
  {
    id: 'pinterest-dl',
    name: 'Pinterest Downloader',
    path: '/api/dl/pinterest',
    method: 'GET',
    category: 'Downloader',
    description: 'Ambil video/gambar dari Pin Pinterest (scrape langsung halaman pin). Untuk pin gambar, balikin gambar resolusi penuh.',
    status: 'live',
    params: [
      { name: 'url', type: 'string', required: true, description: 'Link Pin Pinterest' },
    ],
  },
  {
    id: 'amfinder',
    name: 'AM Preset Finder',
    path: '/api/tools/amfinder',
    method: 'GET',
    category: 'Tools',
    description: 'Cari link preset Alight Motion dari link video TikTok (scrape langsung deskripsi + bio author).',
    status: 'live',
    params: [
      { name: 'url', type: 'string', required: true, description: 'Link video TikTok' },
    ],
  },
];
