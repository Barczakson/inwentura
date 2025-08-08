const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting Supabase deployment setup...\n');

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  console.error('❌ .env file not found. Please create it with your DATABASE_URL.');
  process.exit(1);
}

// Read .env file
const envContent = fs.readFileSync(envPath, 'utf8');
const databaseUrl = envContent.match(/DATABASE_URL=(.+)/)?.[1];

if (!databaseUrl) {
  console.error('❌ DATABASE_URL not found in .env file');
  process.exit(1);
}

console.log('📋 Configuration check:');
console.log(`✅ .env file found`);
console.log(`✅ DATABASE_URL configured: ${databaseUrl.replace(/:([^:@]+)@/, ':***@')}`);

// Check if it's a PostgreSQL URL
if (!databaseUrl.startsWith('postgresql://') && !databaseUrl.startsWith('postgres://')) {
  console.error('❌ DATABASE_URL must be a PostgreSQL connection string');
  process.exit(1);
}

console.log('✅ DATABASE_URL format is correct\n');

console.log('🔧 Running pre-deployment checks...\n');

try {
  // Generate Prisma client
  console.log('📦 Generating Prisma client...');
  execSync('npm run db:generate', { stdio: 'inherit' });
  console.log('✅ Prisma client generated\n');

  // Test database connection
  console.log('🔌 Testing database connection...');
  execSync('npm run db:test', { stdio: 'inherit' });
  console.log('✅ Database connection successful\n');

  // Run migrations
  console.log('🔄 Running database migrations...');
  execSync('npm run db:migrate:deploy', { stdio: 'inherit' });
  console.log('✅ Migrations completed\n');

  // Seed database
  console.log('🌱 Seeding database...');
  execSync('npm run db:seed', { stdio: 'inherit' });
  console.log('✅ Database seeded\n');

  // Build application
  console.log('🏗️  Building application...');
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Application built successfully\n');

  console.log('🎉 All checks passed! Ready for deployment to Vercel.');
  console.log('\n📝 Next steps:');
  console.log('1. Commit your changes to git');
  console.log('2. Push to your repository');
  console.log('3. Vercel will automatically deploy');
  console.log('4. Make sure DATABASE_URL is set in Vercel environment variables');

} catch (error) {
  console.error('❌ Deployment setup failed:', error.message);
  process.exit(1);
}