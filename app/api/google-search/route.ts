import { NextRequest, NextResponse } from 'next/server';

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const GOOGLE_CSE_ID = process.env.GOOGLE_CSE_ID;

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');
  const limit = Math.min(parseInt(searchParams.get('limit') || '10', 10), 10);

  if (!query) {
    return NextResponse.json(
      { 
        success: false,
        error: 'Parameter "q" (query) wajib diisi',
        usage: '/api/google-search?q=your+query&limit=10'
      },
      { status: 400 }
    );
  }

  if (!GOOGLE_API_KEY || !GOOGLE_CSE_ID) {
    return NextResponse.json(
      { 
        success: false,
        error: 'Google API Key atau CSE ID belum dikonfigurasi. Silakan setup environment variables GOOGLE_API_KEY dan GOOGLE_CSE_ID.'
      },
      { status: 500 }
    );
  }

  try {
    const googleUrl = new URL('https://www.googleapis.com/customsearch/v1');
    googleUrl.searchParams.append('key', GOOGLE_API_KEY);
    googleUrl.searchParams.append('cx', GOOGLE_CSE_ID);
    googleUrl.searchParams.append('q', query);
    googleUrl.searchParams.append('num', limit.toString());

    const response = await fetch(googleUrl.toString(), {
      headers: {
        'Accept': 'application/json',
      },
      next: { revalidate: 3600 } // Cache 1 jam
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { 
          success: false,
          error: 'Gagal mengambil data dari Google',
          details: errorData.error?.message || 'Unknown error'
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Transform response ke format yang lebih friendly
    const results = (data.items || []).map((item: any) => ({
      title: item.title,
      url: item.link,
      displayUrl: item.displayLink,
      description: item.snippet,
      image: item.pagemap?.cse_thumbnail?.[0]?.src || null
    }));

    return NextResponse.json({
      success: true,
      query: query,
      total_results: data.searchInformation?.totalResults || results.length,
      search_time: data.searchInformation?.searchTime || 0,
      results: results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Google Search Error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Terjadi kesalahan server saat memproses pencarian'
      },
      { status: 500 }
    );
  }
}
