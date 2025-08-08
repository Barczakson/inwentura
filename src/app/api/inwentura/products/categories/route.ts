import { NextResponse } from 'next/server';
import { ProductService } from '@/lib/inwentura/productService';

export async function GET() {
  try {
    const categories = await ProductService.getCategories();
    return NextResponse.json(categories);

  } catch (error) {
    console.error('Error getting categories:', error);
    return NextResponse.json(
      { error: 'Failed to get categories' },
      { status: 500 }
    );
  }
}