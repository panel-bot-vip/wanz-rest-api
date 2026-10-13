import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, unauthorized } from '@/lib/auth';
import {
  kvReady,
  getMaintenance,
  setMaintenance,
  getBlocklist,
  blockIp,
  unblockIp,
  getVisitors,
  clearVisitors,
  getRequests,
  setRequestStatus,
  deleteRequest,
  type ReqStatus,
} from '@/lib/kv';

export async function GET(req: NextRequest) {
  if (!(await requireAdmin(req))) return unauthorized();
  if (!kvReady()) {
    return NextResponse.json(
      { success: false, error: 'Upstash Redis belum diatur.' },
      { status: 503 }
    );
  }
  try {
    const [maintenance, blocklist, visitors, requests] = await Promise.all([
      getMaintenance(),
      getBlocklist(),
      getVisitors(),
      getRequests(),
    ]);
    return NextResponse.json({
      success: true,
      maintenance,
      blocklist,
      visitors,
      requests,
    });
  } catch (e) {
    console.error('state GET error:', e);
    return NextResponse.json({ success: false, error: 'Gagal memuat data.' }, { status: 500 });
  }
}

const REQ_STATUSES: ReqStatus[] = ['baru', 'proses', 'selesai', 'ditolak'];

export async function POST(req: NextRequest) {
  if (!(await requireAdmin(req))) return unauthorized();
  if (!kvReady()) {
    return NextResponse.json(
      { success: false, error: 'Upstash Redis belum diatur.' },
      { status: 503 }
    );
  }
  try {
    const body = await req.json().catch(() => null);
    const action = body?.action as string;

    switch (action) {
      case 'maintenance': {
        await setMaintenance(!!body?.on);
        return NextResponse.json({ success: true, maintenance: !!body?.on });
      }
      case 'block': {
        const ip = String(body?.ip || '').trim();
        if (!ip) return NextResponse.json({ success: false, error: 'IP kosong.' }, { status: 400 });
        await blockIp(ip);
        return NextResponse.json({ success: true });
      }
      case 'unblock': {
        const ip = String(body?.ip || '').trim();
        if (!ip) return NextResponse.json({ success: false, error: 'IP kosong.' }, { status: 400 });
        await unblockIp(ip);
        return NextResponse.json({ success: true });
      }
      case 'clear_visitors': {
        await clearVisitors();
        return NextResponse.json({ success: true });
      }
      case 'req_status': {
        const id = String(body?.id || '').trim();
        const status = body?.status as ReqStatus;
        if (!id || !REQ_STATUSES.includes(status)) {
          return NextResponse.json({ success: false, error: 'Data tidak valid.' }, { status: 400 });
        }
        await setRequestStatus(id, status);
        return NextResponse.json({ success: true });
      }
      case 'req_delete': {
        const id = String(body?.id || '').trim();
        if (!id) return NextResponse.json({ success: false, error: 'ID kosong.' }, { status: 400 });
        await deleteRequest(id);
        return NextResponse.json({ success: true });
      }
      default:
        return NextResponse.json({ success: false, error: 'Aksi tidak dikenal.' }, { status: 400 });
    }
  } catch (e) {
    console.error('state POST error:', e);
    return NextResponse.json({ success: false, error: 'Kesalahan server.' }, { status: 500 });
  }
}
