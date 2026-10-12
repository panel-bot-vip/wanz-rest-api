# Wanz REST API's ⚡

Platform REST API modern dengan desain Neo-Brutalisme. Gratis, tanpa login, tanpa ribet!

![Next.js](https://img.shields.io/badge/Next.js-14-black)
![Vercel](https://img.shields.io/badge/Vercel-Deploy-success)
![Google API](https://img.shields.io/badge/Google-Custom%20Search-blue)
![Cloudflare](https://img.shields.io/badge/Cloudflare-Turnstile-orange)
![License](https://img.shields.io/badge/License-MIT-blue)

## ✨ Fitur

- 🚀 **Tanpa Login** - Langsung pakai tanpa perlu register
- 🔒 **Cloudflare Turnstile** - Captcha modern tanpa interaksi user (server-side verified)
- 🎨 **Neo-Brutalisme Design** - UI modern dengan border tebal dan shadow tajam
- 🌙 **Dark Mode** - Toggle tema gelap/terang
- 📱 **Responsive** - Tampil semua di semua device
- ⚡ **Serverless** - Deploy ke Vercel dengan mudah
- 🔍 **Google Custom Search API** - Pencarian Google asli & real-time

## 🚀 Setup Cloudflare Turnstile

### 1. Buat Site di Cloudflare Dashboard
1. Buka [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Klik **Turnstile** di sidebar kiri (atau search "Turnstile")
3. Klik **Add Site** / **Create Widget**
4. Isi:
   - **Site name**: `wanz-rest-api` (bebas)
   - **Domain**: Domain kamu (untuk development: `localhost`)
5. Pilih widget type: **Managed** (recommended - Cloudflare yang handle challenge)
6. Klik **Create**
7. Copy **Site Key** dan **Secret Key**

### 2. Setup Environment Variables

**File `.env.local` (development):**
```bash
cp .env.example .env.local
```

Isi environment variables:
```env
# Cloudflare Turnstile
NEXT_PUBLIC_TURNSTILE_SITE_KEY=0x4AAAAAA...  # Site Key (public, untuk client)
TURNSTILE_SECRET_KEY=0x4AAAAAA...            # Secret Key (private, untuk server)

# Google Custom Search
GOOGLE_API_KEY=your_google_api_key_here
GOOGLE_CSE_ID=your_custom_search_engine_id_here
```

### 3. Setup di Vercel (Production)

1. Buka project di [Vercel Dashboard](https://vercel.com/dashboard)
2. **Settings** → **Environment Variables**
3. Tambahkan semua variable di atas
4. **Save** → Redeploy

## 🚀 Setup Google Custom Search API

### 1. Buat Google API Key
1. Buka [Google Cloud Console](https://console.cloud.google.com/)
2. Buat project baru atau pilih project existing
3. Buka **APIs & Services** → **Library**
4. Cari "Custom Search JSON API" → **Enable**
5. Buka **Credentials** → **Create Credentials** → **API Key**
6. Copy API Key kamu

### 2. Buat Custom Search Engine
1. Buka [Programmable Search Engine](https://programmablesearchengine.google.com/controlpanel/all)
2. Klik **Add** → Buat search engine baru
3. Pilih **Search the entire web** untuk pencarian web penuh
4. Setelah jadi, buka **Control Panel** → **Basics**
5. Copy **Search engine ID** (format: `xxxxxxxxxx:yyyyyyyyyy`)

## 🚀 Deploy ke Vercel

### Cara 1: Deploy via Git (Recommended)

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/username/wanz-rest-api.git
git push -u origin main
```

1. Buka [vercel.com](https://vercel.com) → "Add New Project"
2. Pilih repository GitHub kamu
3. Klik "Deploy"
4. Setup environment variables (lihat di atas)
5. Redeploy → **Selesai!** 🎉

### Cara 2: Deploy via Vercel CLI

```bash
npm i -g vercel
vercel login

# Setup env vars
vercel env add NEXT_PUBLIC_TURNSTILE_SITE_KEY
vercel env add TURNSTILE_SECRET_KEY
vercel env add GOOGLE_API_KEY
vercel env add GOOGLE_CSE_ID

# Deploy
vercel --prod
```

## 🛠️ Development Lokal

```bash
npm install
cp .env.example .env.local
# Edit .env.local dengan key kamu
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser.

## 📁 Struktur Proyek

```
Rest-Wanz/
├── app/
│   ├── api/
│   │   ├── google-search/
│   │   │   └── route.ts          # Google Custom Search API
│   │   └── verify-turnstile/
│   │       └── route.ts          # Server-side Turnstile verification
│   ├── docs/
│   │   └── page.tsx              # Halaman dokumentasi
│   ├── globals.css               # Neo-Brutalisme theme
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Landing page
├── components/
│   ├── ApiTester.tsx             # Modal uji coba API (dengan Turnstile)
│   ├── Footer.tsx                # Footer
│   ├── Header.tsx                # Header & navigasi
│   └── TurnstileWidget.tsx       # Cloudflare Turnstile widget
├── .env.example                  # Template environment variables
├── .gitignore
├── next.config.js
├── package.json
├── tsconfig.json
├── vercel.json                   # Konfigurasi Vercel
└── README.md
```

## 📖 API Documentation

### 1. Search Google

**Endpoint:** `GET /api/google-search`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| q | string | Ya | Query pencarian |
| limit | number | Tidak | Jumlah hasil (default: 10, max: 10) |

**Contoh:**
```bash
curl "https://your-domain.vercel.app/api/google-search?q=nextjs+tutorial&limit=5"
```

**Response:**
```json
{
  "success": true,
  "query": "nextjs tutorial",
  "total_results": "1250000",
  "search_time": 0.42,
  "results": [
    {
      "title": "Next.js Tutorial",
      "url": "https://nextjs.org/docs",
      "displayUrl": "nextjs.org",
      "description": "Get started with Next.js...",
      "image": "https://..."
    }
  ],
  "timestamp": "2026-01-01T12:00:00.000Z"
}
```

### 2. Verify Turnstile (Internal)

**Endpoint:** `POST /api/verify-turnstile`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| token | string | Ya | Token dari widget |
| action | string | Tidak | Action identifier |

**Contoh:**
```bash
curl -X POST "https://your-domain.vercel.app/api/verify-turnstile" \
  -H "Content-Type: application/json" \
  -d '{"token": "xxx", "action": "api_access"}'
```

## 🔧 Environment Variables

| Variable | Required | Location | Deskripsi |
|----------|----------|----------|-----------|
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Ya | Client | Turnstile Site Key (public) |
| `TURNSTILE_SECRET_KEY` | Ya | Server | Turnstile Secret Key (private) |
| `GOOGLE_API_KEY` | Ya | Server | Google API Key |
| `GOOGLE_CSE_ID` | Ya | Server | Custom Search Engine ID |

## 🔒 Keamanan

- **Turnstile Secret Key** TIDAK PERNAH di-expose ke client (hanya di server)
- **Google API Key** hanya dipakai server-side
- Semua request tervalidasi server-side
- Token Turnstile di-verify setiap request

## ⚠️ Limitasi

| Layanan | Limitasi |
|---------|----------|
| Google Custom Search | 100 query/hari (gratis) |
| Cloudflare Turnstile | 1 juta request/bulan (gratis) |

## 🎨 Kustomisasi Warna

Edit `app/globals.css`:
```css
:root {
  --accent-yellow: #fbbf24;
  --accent-orange: #f97316;
  --accent-mint: #6ee7b7;
  --accent-purple: #a855f7;
}
```

## 📄 License

MIT License - bebas digunakan untuk project pribadi maupun komersial.

---

© 2026 Wanz REST API. Dibuat dengan ❤️ untuk developer Indonesia.

🚫 **Alergi Pake Api Key** 🚫
