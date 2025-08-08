import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST() {
  try {
    console.log('Adding test product...');
    
    const testProduct = await prisma.product.create({
      data: {
        name: 'test jabłko',
        category: 'owoce',
        defaultUnit: 'kg'
      }
    });
    
    console.log('Test product created:', testProduct);
    
    // Check total count
    const totalCount = await prisma.product.count();
    console.log('Total products:', totalCount);
    
    return NextResponse.json({ 
      success: true, 
      product: testProduct,
      totalCount: totalCount
    });
  } catch (error) {
    console.error('Error adding test product:', error);
    return NextResponse.json(
      { error: 'Failed to add test product', details: error.message },
      { status: 500 }
    );
  }
}