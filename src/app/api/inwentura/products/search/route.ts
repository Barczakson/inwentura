import { NextResponse } from 'next/server';
import { ProductService } from '@/lib/inwentura/productService';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    
    console.log('Search API called with query:', JSON.stringify(query));

    if (!query.trim()) {
      return NextResponse.json([]);
    }

    const results = await ProductService.searchProducts(query, 10);
    return NextResponse.json(results);

  } catch (error) {
    console.error('Error in search API:', error);
    return NextResponse.json(
      { error: 'Failed to search products', details: error.message },
      { status: 500 }
    );
  }
}