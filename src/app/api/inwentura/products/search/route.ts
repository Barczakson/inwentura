import { NextResponse } from 'next/server';
import { ProductService } from '@/lib/inwentura/productService';
import { MockProductService } from '@/lib/inwentura/mockProductService';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';

    console.log('Search API called with query:', JSON.stringify(query));

    if (!query.trim()) {
      return new NextResponse(JSON.stringify([]), {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
        },
      });
    }

    let results;
    try {
      // Try real database first
      console.log('Trying to search products in database...');
      results = await ProductService.searchProducts(query, 10);
      console.log('Got search results from database:', results.length);
    } catch (dbError) {
      console.warn('Database unavailable, using mock data:', (dbError as Error)?.message);
      // Fallback to mock service
      results = await MockProductService.searchProducts(query, 10);
      console.log('Got search results from mock service:', results.length);
    }

    return new NextResponse(JSON.stringify(results), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
      },
    });
  } catch (error: any) {
    console.error('Error in search API:', error);
    return NextResponse.json(
      { error: 'Failed to search products', details: error?.message ?? 'Unknown error' },
      { status: 500 }
    );
  }
}