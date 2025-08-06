import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }
    
    const inventoryItems = await db.inventoryItem.findMany({
      where: { userId },
      include: {
        product: true
      },
      orderBy: {
        timestamp: 'desc'
      }
    });
    
    return NextResponse.json({
      success: true,
      data: inventoryItems
    });
    
  } catch (error) {
    console.error('Error fetching inventory items:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}