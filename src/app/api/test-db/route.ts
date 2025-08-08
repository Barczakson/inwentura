import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Test database connection
    const products = await prisma.product.findMany();
    
    return NextResponse.json({
      success: true,
      productCount: products.length,
      products: products.slice(0, 5) // First 5 products
    });
  } catch (error) {
    console.error('Database test error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}