const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Sample products
  const sampleProducts = [
    { name: 'jabłko', category: 'owoce', defaultUnit: 'kg' },
    { name: 'banan', category: 'owoce', defaultUnit: 'kg' },
    { name: 'pomarańcza', category: 'owoce', defaultUnit: 'kg' },
    { name: 'gruszka', category: 'owoce', defaultUnit: 'kg' },
    { name: 'winogrona', category: 'owoce', defaultUnit: 'kg' },
    { name: 'marchew', category: 'warzywa', defaultUnit: 'kg' },
    { name: 'ziemniak', category: 'warzywa', defaultUnit: 'kg' },
    { name: 'cebula', category: 'warzywa', defaultUnit: 'kg' },
    { name: 'pomidor', category: 'warzywa', defaultUnit: 'kg' },
    { name: 'ogórek', category: 'warzywa', defaultUnit: 'kg' },
    { name: 'mleko', category: 'nabiał', defaultUnit: 'l' },
    { name: 'ser', category: 'nabiał', defaultUnit: 'kg' },
    { name: 'jajko', category: 'nabiał', defaultUnit: 'szt' },
    { name: 'jogurt', category: 'nabiał', defaultUnit: 'szt' },
    { name: 'masło', category: 'nabiał', defaultUnit: 'kg' },
    { name: 'chleb', category: 'pieczywo', defaultUnit: 'szt' },
    { name: 'bułka', category: 'pieczywo', defaultUnit: 'szt' },
    { name: 'rogal', category: 'pieczywo', defaultUnit: 'szt' },
    { name: 'bagietka', category: 'pieczywo', defaultUnit: 'szt' },
    { name: 'kurczak', category: 'mięso', defaultUnit: 'kg' },
    { name: 'wieprzowina', category: 'mięso', defaultUnit: 'kg' },
    { name: 'wołowina', category: 'mięso', defaultUnit: 'kg' },
    { name: 'ryba', category: 'mięso', defaultUnit: 'kg' },
    { name: 'kiełbasa', category: 'mięso', defaultUnit: 'kg' },
    { name: 'woda', category: 'napoje', defaultUnit: 'l' },
    { name: 'kawa', category: 'napoje', defaultUnit: 'g' },
    { name: 'herbata', category: 'napoje', defaultUnit: 'g' },
    { name: 'sok', category: 'napoje', defaultUnit: 'l' },
    { name: 'piwo', category: 'napoje', defaultUnit: 'l' },
    { name: 'cukier', category: 'przyprawy', defaultUnit: 'kg' },
    { name: 'sól', category: 'przyprawy', defaultUnit: 'kg' },
    { name: 'pieprz', category: 'przyprawy', defaultUnit: 'g' },
    { name: 'kminek', category: 'przyprawy', defaultUnit: 'g' },
    { name: 'cynamon', category: 'przyprawy', defaultUnit: 'g' },
    { name: 'olej', category: 'inne', defaultUnit: 'l' },
    { name: 'makaron', category: 'inne', defaultUnit: 'kg' },
    { name: 'ryż', category: 'inne', defaultUnit: 'kg' },
    { name: 'kasza', category: 'inne', defaultUnit: 'kg' },
    { name: 'mąka', category: 'inne', defaultUnit: 'kg' },
    { name: 'czekolada', category: 'słodycze', defaultUnit: 'kg' },
    { name: 'ciastko', category: 'słodycze', defaultUnit: 'szt' },
    { name: 'cukierek', category: 'słodycze', defaultUnit: 'kg' },
    { name: 'lody', category: 'słodycze', defaultUnit: 'l' },
    { name: 'dżem', category: 'słodycze', defaultUnit: 'kg' }
  ];

  // Insert products
  for (const product of sampleProducts) {
    await prisma.product.upsert({
      where: { name: product.name },
      update: {},
      create: {
        name: product.name,
        category: product.category,
        defaultUnit: product.defaultUnit,
        frequency: Math.floor(Math.random() * 10) + 1 // Random frequency 1-10
      }
    });
  }

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });