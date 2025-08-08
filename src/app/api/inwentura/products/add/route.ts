import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { name, category, defaultUnit } = await request.json();
    
    if (!name || !category || !defaultUnit) {
      return NextResponse.json(
        { error: 'Name, category, and defaultUnit are required' },
        { status: 400 }
      );
    }
    
    // Check if product already exists
    const existingProduct = await db.product.findUnique({
      where: { name }
    });
    
    if (existingProduct) {
      return NextResponse.json(
        { error: 'Product with this name already exists' },
        { status: 400 }
      );
    }
    
    const product = await db.product.create({
      data: {
        name,
        category,
        defaultUnit,
        frequency: 0
      }
    });
    
    return NextResponse.json({
      success: true,
      data: product
    });
    
  } catch (error) {
    console.error('Error adding product:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}