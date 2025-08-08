import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { password } = await request.json();
    
    // Get password from environment variables - no fallback for security
    const appPassword = process.env.INWENTURA_PASSWORD;
    
    // Check if password is configured
    if (!appPassword) {
      console.error('INWENTURA_PASSWORD environment variable is not set');
      return NextResponse.json({ 
        success: false, 
        error: 'Server configuration error: Password not set',
        configError: true 
      }, { status: 500 });
    }
    
    if (password === appPassword) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ success: false, error: 'Invalid password' }, { status: 401 });
    }
  } catch (error) {
    console.error('Auth verification error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}