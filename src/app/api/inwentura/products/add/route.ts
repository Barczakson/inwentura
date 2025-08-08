import { NextResponse } from 'next/server';
import { ProductService } from '@/lib/inwentura/productService';

export async function POST(request: Request) {
  try {
    const { name, category, defaultUnit = 'szt' } = await request.json();

    if (!name?.trim() || !category?.trim()) {
      return NextResponse.json(
        { error: 'Name and category are required' },
        { status: 400 }
      );
    }

    const product = await ProductService.addProduct(name, category, defaultUnit);

    if (!product) {
      return NextResponse.json(
        { error: 'Failed to add product' },
        { status: 500 }
      );
    }

    return NextResponse.json(product);

  } catch (error) {
    console.error('Error adding product:', error);
    return NextResponse.json(
      { error: 'Failed to add product' },
      { status: 500 }
    );
  }
}