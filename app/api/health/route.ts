import { NextResponse } from 'next/server';
import { ENDPOINTS } from '@/lib/endpoints';

export async function GET() {
  const live = ENDPOINTS.filter((e) => e.status === 'live').length;
  return NextResponse.json({
    status: 'online',
    endpoints: { total: ENDPOINTS.length, live },
    timestamp: new Date().toISOString(),
  });
}
