#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Simple PostgreSQL migration runner
// No dependencies required - uses Node.js built-ins only

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function runMigration() {
  console.log('🚀 CompuCar Vimeo Migration Runner');
  console.log('=================================\n');

  // Check if migration file exists
  const migrationFile = path.join(__dirname, 'database-migration-vimeo.sql');
  if (!fs.existsSync(migrationFile)) {
    console.error('❌ Error: database-migration-vimeo.sql not found!');
    console.log('Make sure you\'re running this from the project root directory.');
    process.exit(1);
  }

  // Get database connection details
  console.log('📋 Database Connection Setup:');
  const host = await question('Host (default: 72.60.95.142): ') || '72.60.95.142';
  const port = await question('Port (default: 5432): ') || '5432';
  const database = await question('Database (default: tuning): ') || 'tuning';
  const username = await question('Username (default: postgres): ') || 'postgres';
  const password = await question('Password: ');

  console.log('\n📊 Migration Summary:');
  console.log(`  Host: ${host}`);
  console.log(`  Port: ${port}`);
  console.log(`  Database: ${database}`);
  console.log(`  Username: ${username}`);

  const confirm = await question('\nDo you want to proceed? (y/N): ');
  if (confirm.toLowerCase() !== 'y') {
    console.log('❌ Migration cancelled.');
    rl.close();
    return;
  }

  console.log('\n🔄 Running migration...');

  // Read migration SQL
  const migrationSQL = fs.readFileSync(migrationFile, 'utf8');

  // Try to use pg library if available, otherwise show manual instructions
  try {
    const { Client } = require('pg');
    
    const client = new Client({
      host,
      port: parseInt(port),
      database,
      user: username,
      password,
    });

    try {
      await client.connect();
      console.log('✅ Connected to PostgreSQL');
      
      await client.query(migrationSQL);
      console.log('✅ Migration completed successfully!');
      
      // Verify migration
      const result = await client.query(`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'product_videos' 
        AND column_name IN ('vimeo_id', 'video_type')
      `);
      
      console.log('\n📊 Verification Results:');
      result.rows.forEach(row => {
        console.log(`  ✅ ${row.column_name} (${row.data_type}) - Nullable: ${row.is_nullable}`);
      });
      
    } catch (error) {
      console.error('❌ Migration failed:', error.message);
      console.log('\n📖 Check POSTGRESQL_MIGRATION_GUIDE.md for troubleshooting.');
    } finally {
      await client.end();
    }
    
  } catch (requireError) {
    // pg library not available - show manual instructions
    console.log('\n📝 pg library not found. Please run the migration manually:');
    console.log('\n1. Connect to your database using psql:');
    console.log(`   psql -h ${host} -p ${port} -U ${username} -d ${database}`);
    console.log('\n2. Copy and paste this SQL:');
    console.log('\n' + '='.repeat(50));
    console.log(migrationSQL);
    console.log('='.repeat(50));
    console.log('\n📖 See POSTGRESQL_MIGRATION_GUIDE.md for detailed instructions.');
  }

  console.log('\n🎯 Next Steps:');
  console.log('  1. Go to Admin → Products → Edit → Media tab');
  console.log('  2. Look for "Professional Video Hosting" section');
  console.log('  3. Add your first Vimeo video!');
  
  rl.close();
}

// Handle errors gracefully
process.on('uncaughtException', (error) => {
  console.error('\n❌ Unexpected error:', error.message);
  console.log('📖 See POSTGRESQL_MIGRATION_GUIDE.md for help.');
  rl.close();
  process.exit(1);
});

process.on('SIGINT', () => {
  console.log('\n❌ Migration cancelled by user.');
  rl.close();
  process.exit(0);
});

runMigration().catch(error => {
  console.error('\n❌ Migration error:', error.message);
  console.log('📖 See POSTGRESQL_MIGRATION_GUIDE.md for troubleshooting.');
  rl.close();
  process.exit(1);
});
