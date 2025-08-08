import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    
    console.log('Test search for:', query);
    
    // Get all products for debugging
    const allProducts = await db.product.findMany({
      take: 10,
      orderBy: { name: 'asc' }
    });
    
    console.log('Sample products in database:');
    allProducts.forEach(p => {
      console.log(`- ${p.name} (${p.category})`);
    });
    
    // Test exact match
    const exactMatches = await db.product.findMany({
      where: {
        name: {
          contains: query.toLowerCase()
        }
      },
      take: 5
    });
    
    console.log('Exact matches:', exactMatches.length);
    exactMatches.forEach(p => {
      console.log(`- ${p.name} (${p.category})`);
    });
    
    // Test partial match
    const partialMatches = await db.product.findMany({
      where: {
        OR: [
          {
            name: {
              contains: query.toLowerCase()
            }
          },
          {
            category: {
              contains: query.toLowerCase()
            }
          }
        ]
      },
      take: 5
    });
    
    console.log('Partial matches:', partialMatches.length);
    partialMatches.forEach(p => {
      console.log(`- ${p.name} (${p.category})`);
    });
    
    return NextResponse.json({
      query,
      allProductsSample: allProducts,
      exactMatches,
      partialMatches,
      totalProducts: await db.product.count()
    });
    
  } catch (error) {
    console.error('Error in test search:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}