import { NextRequest, NextResponse } from 'next/server';
import { renderBrat } from '@/lib/brat';

export async function GET(req: NextRequest) {
  const text = req.nextUrl.searchParams.get('text')?.trim();
  const bg = req.nextUrl.searchParams.get('bg')?.trim() || 'hijau';

  if (!text) {
    return NextResponse.json(
      { success: false, error: 'Parameter text wajib diisi. Contoh: /api/tools/brat?text=halo' },
      { status: 400 }
    );
  }
  if (text.length > 120) {
    return NextResponse.json(
      { success: false, error: 'Parameter text maksimal 120 karakter.' },
      { status: 400 }
    );
  }

  try {
    return await renderBrat(text, 500, bg);
  } catch {
    return NextResponse.json(
      { success: false, error: 'Gagal render gambar. Coba lagi.' },
      { status: 502 }
    );
  }
}
