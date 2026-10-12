import { NextRequest, NextResponse } from 'next/server';
import { handleTolink } from '@/lib/tolink';

export async function GET(req: NextRequest): Promise<NextResponse> {
  return handleTolink(req, 'tolinkv1');
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  return handleTolink(req, 'tolinkv1');
}
