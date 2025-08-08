import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    vercel_environment: process.env.VERCEL_ENV,
    vercel_url: process.env.VERCEL_URL,
    
    // Google Sheets variables
    google_sheets_id: process.env.GOOGLE_SHEETS_ID ? 'SET' : 'NOT_SET',
    google_service_account_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ? 'SET' : 'NOT_SET', 
    google_private_key: process.env.GOOGLE_PRIVATE_KEY ? 'SET' : 'NOT_SET',
    
    // App password
    inwentura_password: process.env.INWENTURA_PASSWORD ? 'SET' : 'NOT_SET',
    
    // Database
    database_url: process.env.DATABASE_URL ? 'SET' : 'NOT_SET',
    
    // All environment variables (for debugging)
    all_env_keys: Object.keys(process.env).filter(key => 
      key.includes('GOOGLE') || 
      key.includes('INWENTURA') || 
      key.includes('DATABASE') ||
      key.includes('VERCEL')
    ).sort()
  });
}