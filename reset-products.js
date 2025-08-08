const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Resetting products database...');
  
  try {
    // Delete all existing products
    const deleteCount = await prisma.product.deleteMany({});
    console.log(`🗑️  Deleted ${deleteCount.count} existing products`);
    
    // Add new products with consistent lowercase naming
    const products = [
      // Owoce
      { name: 'jabłko', category: 'owoce', defaultUnit: 'kg' },
      { name: 'banan', category: 'owoce', defaultUnit: 'kg' },
      { name: 'pomarańcza', category: 'owoce', defaultUnit: 'kg' },
      { name: 'gruszka', category: 'owoce', defaultUnit: 'kg' },
      { name: 'śliwka', category: 'owoce', defaultUnit: 'kg' },
      { name: 'truskawka', category: 'owoce', defaultUnit: 'kg' },
      { name: 'malina', category: 'owoce', defaultUnit: 'kg' },
      { name: 'porzeczka', category: 'owoce', defaultUnit: 'kg' },
      { name: 'winogrona', category: 'owoce', defaultUnit: 'kg' },
      { name: 'cytryna', category: 'owoce', defaultUnit: 'kg' },
      
      // Warzywa
      { name: 'marchew', category: 'warzywa', defaultUnit: 'kg' },
      { name: 'ziemniak', category: 'warzywa', defaultUnit: 'kg' },
      { name: 'cebula', category: 'warzywa', defaultUnit: 'kg' },
      { name: 'pomidor', category: 'warzywa', defaultUnit: 'kg' },
      { name: 'ogórek', category: 'warzywa', defaultUnit: 'kg' },
      { name: 'papryka', category: 'warzywa', defaultUnit: 'kg' },
      { name: 'sałata', category: 'warzywa', defaultUnit: 'kg' },
      { name: 'rzodkiewka', category: 'warzywa', defaultUnit: 'kg' },
      { name: 'brokuł', category: 'warzywa', defaultUnit: 'kg' },
      { name: 'kalafior', category: 'warzywa', defaultUnit: 'kg' },
      
      // Nabiał
      { name: 'mleko', category: 'nabiał', defaultUnit: 'l' },
      { name: 'ser', category: 'nabiał', defaultUnit: 'kg' },
      { name: 'jajko', category: 'nabiał', defaultUnit: 'szt' },
      { name: 'masło', category: 'nabiał', defaultUnit: 'kg' },
      { name: 'jogurt', category: 'nabiał', defaultUnit: 'g' },
      { name: 'kefir', category: 'nabiał', defaultUnit: 'l' },
      { name: 'twaróg', category: 'nabiał', defaultUnit: 'kg' },
      { name: 'śmietana', category: 'nabiał', defaultUnit: 'ml' },
      
      // Pieczywo
      { name: 'chleb', category: 'pieczywo', defaultUnit: 'szt' },
      { name: 'bułka', category: 'pieczywo', defaultUnit: 'szt' },
      { name: 'rogal', category: 'pieczywo', defaultUnit: 'szt' },
      { name: 'drożdżówka', category: 'pieczywo', defaultUnit: 'szt' },
      { name: 'bagietka', category: 'pieczywo', defaultUnit: 'szt' },
      { name: 'chałka', category: 'pieczywo', defaultUnit: 'szt' },
      { name: 'grzanki', category: 'pieczywo', defaultUnit: 'g' },
      
      // Mięso
      { name: 'kurczak', category: 'mięso', defaultUnit: 'kg' },
      { name: 'wieprzowina', category: 'mięso', defaultUnit: 'kg' },
      { name: 'wołowina', category: 'mięso', defaultUnit: 'kg' },
      { name: 'indyk', category: 'mięso', defaultUnit: 'kg' },
      { name: 'baranina', category: 'mięso', defaultUnit: 'kg' },
      { name: 'kiełbasa', category: 'mięso', defaultUnit: 'kg' },
      { name: 'szynka', category: 'mięso', defaultUnit: 'kg' },
      { name: 'boczek', category: 'mięso', defaultUnit: 'kg' },
      
      // Napoje
      { name: 'woda', category: 'napoje', defaultUnit: 'l' },
      { name: 'kawa', category: 'napoje', defaultUnit: 'g' },
      { name: 'herbata', category: 'napoje', defaultUnit: 'g' },
      { name: 'sok', category: 'napoje', defaultUnit: 'l' },
      { name: 'napój gazowany', category: 'napoje', defaultUnit: 'l' },
      { name: 'piwo', category: 'napoje', defaultUnit: 'l' },
      { name: 'wino', category: 'napoje', defaultUnit: 'l' },
      { name: 'spirytus', category: 'napoje', defaultUnit: 'ml' },
      
      // Przyprawy
      { name: 'cukier', category: 'przyprawy', defaultUnit: 'kg' },
      { name: 'sól', category: 'przyprawy', defaultUnit: 'kg' },
      { name: 'pieprz', category: 'przyprawy', defaultUnit: 'g' },
      { name: 'papryka mielona', category: 'przyprawy', defaultUnit: 'g' },
      { name: 'kminek', category: 'przyprawy', defaultUnit: 'g' },
      { name: 'majeranek', category: 'przyprawy', defaultUnit: 'g' },
      { name: 'bazylia', category: 'przyprawy', defaultUnit: 'g' },
      { name: 'oregano', category: 'przyprawy', defaultUnit: 'g' },
      { name: 'cynamon', category: 'przyprawy', defaultUnit: 'g' },
      
      // Słodycze
      { name: 'czekolada', category: 'słodycze', defaultUnit: 'g' },
      { name: 'cukierki', category: 'słodycze', defaultUnit: 'g' },
      { name: 'ciastko', category: 'słodycze', defaultUnit: 'g' },
      { name: 'baton', category: 'słodycze', defaultUnit: 'g' },
      { name: 'guma do żucia', category: 'słodycze', defaultUnit: 'szt' },
      { name: 'lody', category: 'słodycze', defaultUnit: 'g' },
      
      // Inne
      { name: 'olej', category: 'inne', defaultUnit: 'l' },
      { name: 'makaron', category: 'inne', defaultUnit: 'kg' },
      { name: 'ryż', category: 'inne', defaultUnit: 'kg' },
      { name: 'mąka', category: 'inne', defaultUnit: 'kg' },
      { name: 'kasza', category: 'inne', defaultUnit: 'kg' },
      { name: 'płatki śniadaniowe', category: 'inne', defaultUnit: 'kg' },
      { name: 'konservy', category: 'inne', defaultUnit: 'szt' },
      { name: 'sos', category: 'inne', defaultUnit: 'ml' },
      { name: 'ketchup', category: 'inne', defaultUnit: 'ml' },
      { name: 'musztarda', category: 'inne', defaultUnit: 'ml' },
      { name: 'majonez', category: 'inne', defaultUnit: 'ml' },
      { name: 'oct', category: 'inne', defaultUnit: 'ml' },
      { name: 'miód', category: 'inne', defaultUnit: 'kg' },
      { name: 'orzechy', category: 'inne', defaultUnit: 'kg' },
      { name: 'suszone owoce', category: 'inne', defaultUnit: 'kg' },
      { name: 'pasta', category: 'inne', defaultUnit: 'kg' },
      { name: 'ryba', category: 'inne', defaultUnit: 'kg' },
      { name: 'grzyby', category: 'inne', defaultUnit: 'kg' },
      { name: 'nasiona', category: 'inne', defaultUnit: 'kg' }
    ];

    console.log(`📝 Adding ${products.length} products...`);

    for (const product of products) {
      try {
        const newProduct = await prisma.product.create({
          data: {
            name: product.name.toLowerCase(),
            category: product.category.toLowerCase(),
            defaultUnit: product.defaultUnit,
            frequency: 0
          }
        });
        console.log(`✅ Added: ${product.name} (${product.category})`);
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
    
    // Show sample products
    const sampleProducts = await prisma.product.findMany({
      take: 5,
      orderBy: { name: 'asc' }
    });
    console.log('📋 Sample products:', sampleProducts.map(p => `${p.name} (${p.category})`).join(', '));

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });