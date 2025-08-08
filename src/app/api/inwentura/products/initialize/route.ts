import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST() {
  try {
    console.log('Starting product initialization...');
    
    const sampleProducts = [
      { name: 'jabłko', category: 'owoce', defaultUnit: 'kg' },
      { name: 'banan', category: 'owoce', defaultUnit: 'kg' },
      { name: 'pomarańcza', category: 'owoce', defaultUnit: 'kg' },
      { name: 'marchew', category: 'warzywa', defaultUnit: 'kg' },
      { name: 'ziemniak', category: 'warzywa', defaultUnit: 'kg' }
    ];

    console.log('Sample products to add:', sampleProducts.length);

    for (const product of sampleProducts) {
      console.log('Processing product:', product.name);
      
      const existing = await prisma.product.findFirst({
        where: {
          name: {
            equals: product.name,
            mode: 'insensitive'
          }
        }
      });

      if (!existing) {
        console.log('Creating new product:', product.name);
        await prisma.product.create({
          data: product
        });
        console.log('Product created:', product.name);
      } else {
        console.log('Product already exists:', product.name);
      }
    }

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