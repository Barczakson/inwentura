import { NextResponse } from 'next/server';
import { ProductService } from '@/lib/inwentura/productService';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');

    const products = await ProductService.getPopularProducts(limit);
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