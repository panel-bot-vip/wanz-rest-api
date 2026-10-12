import { NextRequest, NextResponse } from 'next/server';

const TURNSTILE_SECRET_KEY = process.env.TURNSTILE_SECRET_KEY;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, action } = body;

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token tidak ditemukan' },
        { status: 400 }
      );
    }

    if (!TURNSTILE_SECRET_KEY) {
      return NextResponse.json(
        { success: false, error: 'TURNSTILE_SECRET_KEY belum dikonfigurasi di environment variables' },
        { status: 500 }
      );
    }

    // Verify token dengan Cloudflare Turnstile API
    const verifyUrl = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
    
    const formData = new URLSearchParams();
    formData.append('secret', TURNSTILE_SECRET_KEY);
    formData.append('response', token);

    const verifyResponse = await fetch(verifyUrl, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const verifyData = await verifyResponse.json();

    if (verifyData.success) {
      // Optional: Check action match
      if (action && verifyData.action && verifyData.action !== action) {
        return NextResponse.json(
          { success: false, error: 'Action mismatch' },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Verifikasi berhasil',
        action: verifyData.action,
        challenge_ts: verifyData.challenge_ts,
        hostname: verifyData.hostname,
      });
    } else {
      const errorCodes = verifyData['error-codes'] || [];
      return NextResponse.json(
        { 
          success: false, 
          error: 'Verifikasi gagal',
          codes: errorCodes 
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Turnstile verification error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server saat verifikasi' },
      { status: 500 }
    );
  }
}
