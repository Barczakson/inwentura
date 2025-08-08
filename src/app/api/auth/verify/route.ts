import { NextResponse } from 'next/server';

// Ensure Node.js runtime so process.env is available consistently on Vercel
export const runtime = 'nodejs';


export async function POST(request: Request) {
  try {
    const { password } = await request.json();

    const provided = (password ?? '').trim();
    const envPasswordRaw = process.env.INWENTURA_PASSWORD ?? '';
    const envPassword = envPasswordRaw.trim();
    const isProduction = process.env.NODE_ENV === 'production';

    if (!envPassword) {
      if (isProduction) {
        return NextResponse.json({ success: false, error: 'Password not configured' }, { status: 500 });
      }
      if (provided === 'inwentura123') {
        return NextResponse.json({ success: true });
      }
      return NextResponse.json({ success: false, error: 'Invalid password' }, { status: 401 });
    }

    if (provided === envPassword) {
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ success: false, error: 'Invalid password' }, { status: 401 });
  } catch (error) {
    console.error('Auth verification error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}