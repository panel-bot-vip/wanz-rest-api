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
  {
    id: 'tolinkv1',
    name: 'ToLink v1 (tmpfiles)',
    path: '/api/tools/tolinkv1',
    method: 'POST',
    category: 'Tools',
    description: 'Upload gambar jadi link via tmpfiles.org. Kirim file (form "file") atau link gambar (?url=).',
    status: 'live',
    params: [
      { name: 'file', type: 'file', required: false, description: 'File gambar (maks 4MB)' },
      { name: 'url', type: 'string', required: false, description: 'Atau link gambar langsung' },
    ],
  },
  {
    id: 'tolinkv2',
    name: 'ToLink v2 (uguu)',
    path: '/api/tools/tolinkv2',
    method: 'POST',
    category: 'Tools',
    description: 'Upload gambar jadi link via uguu.se (temporer ±3 jam). Kirim file atau link gambar.',
    status: 'live',
    params: [
      { name: 'file', type: 'file', required: false, description: 'File gambar (maks 4MB)' },
      { name: 'url', type: 'string', required: false, description: 'Atau link gambar langsung' },
    ],
  },
  {
    id: 'tolinkv3',
    name: 'ToLink v3 (qu.ax)',
    path: '/api/tools/tolinkv3',
    method: 'POST',
    category: 'Tools',
    description: 'Upload gambar jadi link via qu.ax. Kirim file atau link gambar.',
    status: 'live',
    params: [
      { name: 'file', type: 'file', required: false, description: 'File gambar (maks 4MB)' },
      { name: 'url', type: 'string', required: false, description: 'Atau link gambar langsung' },
    ],
  },
  {
    id: 'tolinkv4',
    name: 'ToLink v4 (litterbox)',
    path: '/api/tools/tolinkv4',
    method: 'POST',
    category: 'Tools',
    description: 'Upload gambar jadi link via litterbox/catbox (temporer 72 jam). Kirim file atau link gambar.',
    status: 'live',
    params: [
      { name: 'file', type: 'file', required: false, description: 'File gambar (maks 4MB)' },
      { name: 'url', type: 'string', required: false, description: 'Atau link gambar langsung' },
    ],
  },
  {
    id: 'tolinkv5',
    name: 'ToLink v5 (pomf)',
    path: '/api/tools/tolinkv5',
    method: 'POST',
    category: 'Tools',
    description: 'Upload gambar jadi link via pomf.lain.la (permanen). Kirim file atau link gambar.',
    status: 'live',
    params: [
      { name: 'file', type: 'file', required: false, description: 'File gambar (maks 4MB)' },
      { name: 'url', type: 'string', required: false, description: 'Atau link gambar langsung' },
    ],
  },
  {
    id: 'brat',
    name: 'Brat Generator',
    path: '/api/tools/brat',
    method: 'GET',
    category: 'Tools',
    description: 'Bikin gambar meme gaya sampul "brat": kotak warna + teks kontras. Balikin file PNG 500x500.',
    status: 'live',
    params: [
      { name: 'text', type: 'string', required: true, description: 'Teks di gambar (maks 120 karakter)' },
      { name: 'bg', type: 'select', required: false, description: 'Warna background (nama atau hex)', default: 'hijau', options: ['hijau', 'putih', 'hitam', 'ungu', 'kuning', 'pink', 'biru', 'merah', 'orange', 'mint'] },
    ],
  },
  {
    id: 'brathd',
    name: 'Brat HD Generator',
    path: '/api/tools/brathd',
    method: 'GET',
    category: 'Tools',
    description: 'Versi resolusi tinggi brat generator. Balikin file PNG 1500x1500.',
    status: 'live',
    params: [
      { name: 'text', type: 'string', required: true, description: 'Teks di gambar (maks 120 karakter)' },
      { name: 'bg', type: 'select', required: false, description: 'Warna background (nama atau hex)', default: 'hijau', options: ['hijau', 'putih', 'hitam', 'ungu', 'kuning', 'pink', 'biru', 'merah', 'orange', 'mint'] },
    ],
  },
];
