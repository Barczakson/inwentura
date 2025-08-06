import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { weight, unit } = await request.json();
    
    if (!weight || !unit) {
      return NextResponse.json(
        { error: 'Weight and unit are required' },
        { status: 400 }
      );
    }
    
    const updatedItem = await db.inventoryItem.update({
      where: { id },
      data: {
        weight: parseFloat(weight),
        unit
      },
      include: {
        product: true
      }
    });
    
    return NextResponse.json({
      success: true,
      data: updatedItem
    });
    
  } catch (error) {
    console.error('Error updating inventory item:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}