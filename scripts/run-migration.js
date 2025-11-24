/*
 * Script to run database migrations
 * 
 * This script initializes the database by running all migration files
 * in the migrations directory.
 */

const { initializeDatabase } = require('../utils/databaseInit');

async function runMigrations() {
  try {
    console.log('Starting database migrations...');
    await initializeDatabase();
    console.log('Database migrations completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Database migration failed:', error.message);
    process.exit(1);
  }
}

// Run the migrations
runMigrations();