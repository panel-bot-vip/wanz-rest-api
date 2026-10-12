import { NextRequest, NextResponse } from 'next/server';
import { handleTolink } from '@/lib/tolink';

export async function GET(req: NextRequest): Promise<NextResponse> {
  return handleTolink(req, 'tolinkv4');
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  return handleTolink(req, 'tolinkv4');
}
