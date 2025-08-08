import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { InventoryItem, Product } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    const { user, product, weight, unit, timestamp } = await request.json();
    
    if (!user || !product || !weight || !unit) {
      return NextResponse.json(
        { error: 'Missing required fields: user, product, weight, unit' },
        { status: 400 }
      );
    }
    
    // Find or create product
    let productRecord = await db.product.findUnique({
      where: { name: product }
    });
    
    if (!productRecord) {
      // Determine default unit based on product name
      let defaultUnit = unit;
      const lowerProduct = product.toLowerCase();
      
      if (lowerProduct.includes('mleko') || lowerProduct.includes('woda') || 
          lowerProduct.includes('sok') || lowerProduct.includes('olej')) {
        defaultUnit = 'l';
      } else if (lowerProduct.includes('cukier') || lowerProduct.includes('mąka') || 
                 lowerProduct.includes('ryż') || lowerProduct.includes('kasza')) {
        defaultUnit = 'kg';
      } else if (lowerProduct.includes('chleb') || lowerProduct.includes('jajko') || 
                 lowerProduct.includes('jabłko') || lowerProduct.includes('banan')) {
        defaultUnit = 'szt';
      }
      
      // Determine category based on product name
      let category = 'Inne';
      if (lowerProduct.includes('mleko') || lowerProduct.includes('sery') || lowerProduct.includes('jogurt')) {
        category = 'Nabiał';
      } else if (lowerProduct.includes('chleb') || lowerProduct.includes('bułka') || lowerProduct.includes('pieczywo')) {
        category = 'Pieczywo';
      } else if (lowerProduct.includes('owoce') || lowerProduct.includes('jabłko') || lowerProduct.includes('banan') || 
                 lowerProduct.includes('pomarańcza')) {
        category = 'Owoce';
      } else if (lowerProduct.includes('warzywa') || lowerProduct.includes('marchew') || lowerProduct.includes('ziemniak')) {
        category = 'Warzywa';
      } else if (lowerProduct.includes('mięso') || lowerProduct.includes('kurczak') || lowerProduct.includes('wieprzowina')) {
        category = 'Mięso';
      }
      
      productRecord = await db.product.create({
        data: {
          name: product,
          category,
          defaultUnit,
          frequency: 1
        }
      });
    } else {
      // Increment product frequency
      await db.product.update({
        where: { id: productRecord.id },
        data: { frequency: (productRecord.frequency || 0) + 1 }
      });
    }
    
    // Create inventory item
    const inventoryItem = await db.inventoryItem.create({
      data: {
        productId: productRecord.id,
        weight: parseFloat(weight),
        unit,
        userId: user,
        timestamp: timestamp ? new Date(timestamp) : new Date()
      },
      include: {
        product: true
      }
    });
    
    return NextResponse.json({
      success: true,
      data: inventoryItem
    });
    
  } catch (error) {
    console.error('Error adding inventory item:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}