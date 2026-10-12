import { NextRequest, NextResponse } from 'next/server';
import { handleTolink } from '@/lib/tolink';

export async function GET(req: NextRequest): Promise<NextResponse> {
  return handleTolink(req, 'tolinkv5');
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  return handleTolink(req, 'tolinkv5');
}
