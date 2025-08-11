import { NextResponse } from 'next/server';
import { ProductService } from '@/lib/inwentura/productService';

export async function GET() {
  try {
    const categories = await ProductService.getCategories();
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