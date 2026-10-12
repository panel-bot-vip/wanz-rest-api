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

export const CATEGORIES = ['Semua', 'Pencarian', 'AI', 'Downloader', 'Tools', 'Game', 'Islami'];

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
    id: 'ytmp4',
    name: 'YouTube MP4',
    path: '/api/dl/ytmp4',
    method: 'GET',
    category: 'Downloader',
    description: 'Ambil link download video YouTube MP4 (video+audio) langsung via InnerTube + decipher sendiri.',
    status: 'live',
    params: [
      { name: 'url', type: 'string', required: true, description: 'Link / ID video YouTube' },
    ],
  },
  {
    id: 'ytmp3',
    name: 'YouTube MP3',
    path: '/api/dl/ytmp3',
    method: 'GET',
    category: 'Downloader',
    description: 'Ambil audio YouTube (MP4 berisi audio lengkap; audio-only murni butuh login, lihat note).',
    status: 'live',
    params: [
      { name: 'url', type: 'string', required: true, description: 'Link / ID video YouTube' },
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
  {
    id: 'smeme',
    name: 'Sticker Meme',
    path: '/api/tools/smeme',
    method: 'POST',
    category: 'Tools',
    description: 'Bikin meme atas-bawah ala stiker WA: kirim gambar + teks top/bottom. Balikin PNG 800x800.',
    status: 'live',
    params: [
      { name: 'image', type: 'file', required: false, description: 'File gambar (maks 4MB)' },
      { name: 'url', type: 'string', required: false, description: 'Atau link gambar langsung' },
      { name: 'top', type: 'string', required: false, description: 'Teks atas (maks 100 karakter)' },
      { name: 'bottom', type: 'string', required: false, description: 'Teks bawah (maks 100 karakter)' },
    ],
  },
  {
    id: 'quiz',
    name: 'Kuis Trivia',
    path: '/api/game/quiz',
    method: 'GET',
    category: 'Game',
    description: 'Soal kuis pilihan ganda + bener/salah (Open Trivia DB). Opsi jawaban diacak tiap request.',
    status: 'live',
    params: [
      { name: 'amount', type: 'string', required: false, description: 'Jumlah soal 1-10 (default: 1)', default: '1' },
      { name: 'category', type: 'string', required: false, description: 'ID kategori (mis. 9=umum, 18=komputer)' },
      { name: 'difficulty', type: 'select', required: false, description: 'Level kesulitan', default: '', options: ['', 'easy', 'medium', 'hard'] },
      { name: 'type', type: 'select', required: false, description: 'Tipe soal', default: '', options: ['', 'multiple', 'boolean'] },
    ],
  },
  {
    id: 'lontong',
    name: 'Kuis Cak Lontong',
    path: '/api/game/lontong',
    method: 'GET',
    category: 'Game',
    description: 'Tebak-tebakan absurd ala Cak Lontong (soal + jawaban + penjelasan). Tanpa parameter.',
    status: 'live',
    params: [],
  },
  {
    id: 'tts',
    name: 'TTS (Teka-Teki Silang)',
    path: '/api/game/tts',
    method: 'GET',
    category: 'Game',
    description: 'Teka-teki silang: petunjuk + jawaban kata + jumlah huruf. Tanpa parameter.',
    status: 'live',
    params: [],
  },
  {
    id: 'tebakgambar',
    name: 'Tebak Gambar',
    path: '/api/game/tebakgambar',
    method: 'GET',
    category: 'Game',
    description: 'Tebak kata dari gambar (link gambar + jawaban + penjelasan). Tanpa parameter.',
    status: 'live',
    params: [],
  },
  {
    id: 'tebakata',
    name: 'Tebak Kata',
    path: '/api/game/tebakata',
    method: 'GET',
    category: 'Game',
    description: 'Tebak satu kata dari 5 petunjuk + jumlah huruf. Tanpa parameter.',
    status: 'live',
    params: [],
  },
  {
    id: 'jadwal-shalat',
    name: 'Jadwal Shalat',
    path: '/api/islami/jadwal',
    method: 'GET',
    category: 'Islami',
    description: 'Jadwal shalat harian per kota (imsak-isya). Isi nama/ID kota, opsional tanggal YYYY-MM-DD.',
    status: 'live',
    params: [
      { name: 'kota', type: 'string', required: false, description: 'Nama atau ID kota (default: jakarta)', default: 'jakarta' },
      { name: 'tanggal', type: 'string', required: false, description: 'Tanggal YYYY-MM-DD (default: hari ini WIB)' },
    ],
  },
  {
    id: 'tanya-islam',
    name: 'Tanya Jawab Islam',
    path: '/api/islami/tanya',
    method: 'GET',
    category: 'Islami',
    description: 'Cari jawaban konsultasi Islam (fikih, akidah, ibadah) dari artikel konsultasi berbahasa Indonesia.',
    status: 'live',
    params: [
      { name: 'q', type: 'string', required: true, description: 'Pertanyaan / kata kunci' },
      { name: 'limit', type: 'string', required: false, description: 'Jumlah hasil 1-5 (default: 3)', default: '3' },
    ],
  },
  {
    id: 'kisah-nabi',
    name: 'Kisah 25 Nabi',
    path: '/api/islami/kisah',
    method: 'GET',
    category: 'Islami',
    description: 'Baca kisah 25 nabi (lengkap + tahun lahir + usia). Pilih nama nabi, kosongkan untuk daftar.',
    status: 'live',
    params: [
      { name: 'nabi', type: 'select', required: false, description: 'Nama nabi (kosongkan = daftar)', default: '', options: ['', 'adam', 'idris', 'nuh', 'hud', 'sholeh', 'ibrahim', 'ismail', 'luth', 'ishaq', 'yaqub', 'yusuf', 'syuaib', 'ayyub', 'dzulkifli', 'musa', 'harun', 'daud', 'sulaiman', 'ilyas', 'ilyasa', 'yunus', 'zakariya', 'yahya', 'isa', 'muhammad'] },
    ],
  },
];
