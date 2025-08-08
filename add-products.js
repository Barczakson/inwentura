const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Starting to add products...');
  
  const products = [
    { name: 'jabłko', category: 'owoce', defaultUnit: 'kg' },
    { name: 'banan', category: 'owoce', defaultUnit: 'kg' },
    { name: 'pomarańcza', category: 'owoce', defaultUnit: 'kg' },
    { name: 'marchew', category: 'warzywa', defaultUnit: 'kg' },
    { name: 'ziemniak', category: 'warzywa', defaultUnit: 'kg' },
    { name: 'cebula', category: 'warzywa', defaultUnit: 'kg' },
    { name: 'mleko', category: 'nabiał', defaultUnit: 'l' },
    { name: 'ser', category: 'nabiał', defaultUnit: 'kg' },
    { name: 'jajko', category: 'nabiał', defaultUnit: 'szt' },
    { name: 'chleb', category: 'pieczywo', defaultUnit: 'szt' },
    { name: 'bułka', category: 'pieczywo', defaultUnit: 'szt' },
    { name: 'kurczak', category: 'mięso', defaultUnit: 'kg' },
    { name: 'wieprzowina', category: 'mięso', defaultUnit: 'kg' },
    { name: 'woda', category: 'napoje', defaultUnit: 'l' },
    { name: 'kawa', category: 'napoje', defaultUnit: 'g' },
    { name: 'cukier', category: 'przyprawy', defaultUnit: 'kg' },
    { name: 'sól', category: 'przyprawy', defaultUnit: 'kg' },
    { name: 'olej', category: 'inne', defaultUnit: 'l' },
    { name: 'makaron', category: 'inne', defaultUnit: 'kg' },
    { name: 'ryż', category: 'inne', defaultUnit: 'kg' }
  ];

  for (const product of products) {
    try {
      // Check if product already exists
      const existing = await prisma.product.findFirst({
        where: {
          name: {
            equals: product.name.toLowerCase()
          }
        }
      });

      if (!existing) {
        const newProduct = await prisma.product.create({
          data: {
            name: product.name,
            category: product.category,
            defaultUnit: product.defaultUnit,
            frequency: 0
          }
        });
        console.log(`✅ Added: ${product.name} (${product.category})`);
      } else {
        console.log(`⏭️  Already exists: ${product.name}`);
      }
    } catch (error) {
      console.error(`❌ Error adding ${product.name}:`, error.message);
    }
  }

  console.log('✅ All products processed!');
  
  // Show final count
  const totalProducts = await prisma.product.count();
  console.log(`📊 Total products in database: ${totalProducts}`);
  
  // Show categories
  const categories = await prisma.product.findMany({
    select: { category: true },
    distinct: ['category'],
    orderBy: { category: 'asc' }
  });
  console.log('📂 Categories:', categories.map(c => c.category).join(', '));
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });