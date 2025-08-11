import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testTables() {
  try {
    console.log('Testing database tables...');
    
    // Raw query to check tables
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    
    console.log('Available tables:', tables);
    
    // Try to query products table with lowercase
    const products = await prisma.$queryRaw`
      SELECT * FROM products LIMIT 5
    `;
    
    console.log('Products (lowercase):', products);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testTables();
