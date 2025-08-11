import { NextResponse } from 'next/server';
import { ProductService } from '@/lib/inwentura/productService';

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

    const results = await ProductService.searchProducts(query, 10);
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