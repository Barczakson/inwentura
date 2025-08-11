import { NextResponse } from 'next/server';
import { ProductService } from '@/lib/inwentura/productService';
import { MockProductService } from '@/lib/inwentura/mockProductService';

export async function GET() {
  try {
    let categories;
    try {
      categories = await ProductService.getCategories();
    } catch (dbError) {
      console.warn('Database unavailable, using mock data:', dbError);
      categories = await MockProductService.getCategories();
    }

    return new NextResponse(JSON.stringify(categories), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=600, stale-while-revalidate=1800',
      },
    });
  } catch (error) {
    console.error('Error getting categories:', error);
    return NextResponse.json(
      { error: 'Failed to get categories' },
      { status: 500 }
    );
  }
}