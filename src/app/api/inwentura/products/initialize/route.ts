import { NextResponse } from 'next/server';
import { ProductService } from '@/lib/inwentura/productService';

export async function POST() {
  try {
    console.log('Starting product initialization...');
    
    await ProductService.initializeSampleProducts();
    
    console.log('Product initialization completed');
    
    return NextResponse.json({ 
      success: true, 
      message: 'Sample products initialized successfully' 
    });
  } catch (error) {
    console.error('Error initializing sample products:', error);
    return NextResponse.json(
      { error: 'Failed to initialize sample products', details: error.message },
      { status: 500 }
    );
  }
}