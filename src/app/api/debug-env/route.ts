import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    vercel_environment: process.env.VERCEL_ENV,
    vercel_url: process.env.VERCEL_URL,
    
    // Google Sheets variables - check actual values
    google_sheets_id: process.env.GOOGLE_SHEETS_ID || 'NOT_SET',
    google_service_account_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || 'NOT_SET', 
    google_private_key: process.env.GOOGLE_PRIVATE_KEY ? 'SET' : 'NOT_SET',
    google_private_key_length: process.env.GOOGLE_PRIVATE_KEY ? process.env.GOOGLE_PRIVATE_KEY.length : 0,
    
    // App password - check actual value
    inwentura_password: process.env.INWENTURA_PASSWORD || 'NOT_SET',
    inwentura_password_length: process.env.INWENTURA_PASSWORD ? process.env.INWENTURA_PASSWORD.length : 0,
    
    // Database
    database_url: process.env.DATABASE_URL || 'NOT_SET',
    
    // All environment variables (for debugging)
    all_env_keys: Object.keys(process.env).filter(key => 
      key.includes('GOOGLE') || 
      key.includes('INWENTURA') || 
      key.includes('DATABASE') ||
      key.includes('VERCEL')
    ).sort(),
    
    // Vercel specific info
    vercel_deployment_id: process.env.VERCEL_DEPLOYMENT_ID || 'NOT_SET',
    vercel_project_id: process.env.VERCEL_PROJECT_ID || 'NOT_SET',
  });
}