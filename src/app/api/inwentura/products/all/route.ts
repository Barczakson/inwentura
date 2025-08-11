import { NextResponse } from 'next/server';
import { ProductService } from '@/lib/inwentura/productService';
import { MockProductService } from '@/lib/inwentura/mockProductService';

export async function GET() {
  try {
    let products;
    try {
      console.log('Trying to get all products from database...');
      products = await ProductService.getAllProducts();
      console.log('Got products from database:', products.length);
    } catch (dbError) {
      console.warn('Database unavailable, using mock data:', (dbError as Error)?.message);
      products = await MockProductService.getAllProducts();
      console.log('Got products from mock service:', products.length);
    }

    return new NextResponse(JSON.stringify(products), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('Error getting all products:', error);
    return NextResponse.json(
      { error: 'Failed to get all products' },
      { status: 500 }
    );
  }
}
