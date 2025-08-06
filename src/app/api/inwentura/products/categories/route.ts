import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // Get unique categories from products
    const categories = await db.product.findMany({
      select: {
        category: true
      },
      distinct: ['category'],
      orderBy: {
        category: 'asc'
      }
    });
    
    const categoryList = categories.map(c => c.category);
    
    // If no categories exist, return default ones
    if (categoryList.length === 0) {
      const defaultCategories = [
        'Nabiał',
        'Pieczywo',
        'Owoce',
        'Warzywa',
        'Mięso',
        'Napoje',
        'Słodycze',
        'Przyprawy',
        'Mrożonki',
        'Inne'
      ];
      
      return NextResponse.json({
        success: true,
        data: defaultCategories
      });
    }
    
    return NextResponse.json({
      success: true,
      data: categoryList
    });
    
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}