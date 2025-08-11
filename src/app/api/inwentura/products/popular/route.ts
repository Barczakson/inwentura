import { NextResponse } from 'next/server';
import { ProductService } from '@/lib/inwentura/productService';
import { MockProductService } from '@/lib/inwentura/mockProductService';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');

    let products;
    try {
      console.log('Trying to get popular products from database...');
      products = await ProductService.getPopularProducts(limit);
      console.log('Got products from database:', products.length);
    } catch (dbError) {
      console.warn('Database unavailable, using mock data:', (dbError as Error)?.message);
      products = await MockProductService.getPopularProducts(limit);
      console.log('Got products from mock service:', products.length);
    }

    return new NextResponse(JSON.stringify(products), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('Error getting popular products:', error);
    return NextResponse.json(
      { error: 'Failed to get popular products' },
      { status: 500 }
    );
  }
}