import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    console.log('=== DATABASE DEBUG ===');
    console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
    console.log('DATABASE_URL starts with:', process.env.DATABASE_URL?.substring(0, 20) + '...');
    
    // Test simple query
    const result = await db.$queryRaw`SELECT 1 as test`;
    console.log('Database query successful:', result);
    
    // Test products table
    const count = await db.product.count();
    console.log('Products count:', count);
    
    return NextResponse.json({
      status: 'success',
      database_url_exists: !!process.env.DATABASE_URL,
      database_url_preview: process.env.DATABASE_URL?.substring(0, 30) + '...',
      test_query: result,
      products_count: count,
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('Database debug error:', error);
    
    return NextResponse.json({
      status: 'error',
      error: error.message,
      error_code: error.code,
      database_url_exists: !!process.env.DATABASE_URL,
      database_url_preview: process.env.DATABASE_URL?.substring(0, 30) + '...',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
