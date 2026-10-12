import { NextRequest, NextResponse } from 'next/server';
import { renderBrat } from '@/lib/brat';

export async function GET(req: NextRequest) {
  const text = req.nextUrl.searchParams.get('text')?.trim();

  if (!text) {
    return NextResponse.json(
      { success: false, error: 'Parameter text wajib diisi. Contoh: /api/tools/brathd?text=halo' },
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
    return await renderBrat(text, 1500);
  } catch {
    return NextResponse.json(
      { success: false, error: 'Gagal render gambar. Coba lagi.' },
      { status: 502 }
    );
  }
}
