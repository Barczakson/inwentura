import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();
    
    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query parameter is required' },
        { status: 400 }
      );
    }
    
    // Simple search - in a real implementation, you might want fuzzy search
    const products = await db.product.findMany({
      where: {
        OR: [
          {
            name: {
              contains: query,
              mode: 'insensitive'
            }
          },
          {
            category: {
              contains: query,
              mode: 'insensitive'
            }
          }
        ]
      },
      orderBy: [
        { frequency: 'desc' },
        { name: 'asc' }
      ],
      take: 10 // Limit results
    });
    
    return NextResponse.json({
      success: true,
      data: products
    });
    
  } catch (error) {
    console.error('Error searching products:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}