const { sequelize } = require('./db/models');
const { User } = require('./db/models');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const bcrypt = require('bcryptjs');

async function setupDatabase() {
  try {
    console.log('Setting up database...');
    
    // Force NODE_ENV to production
    process.env.NODE_ENV = 'production';
    
    // Set schema to baba_abdalla_project if not already set
    if (!process.env.SCHEMA) {
      process.env.SCHEMA = 'baba_abdalla_project';
      console.log('Setting SCHEMA to baba_abdalla_project');
    }
    
    // Show all schemas
    const schemas = await sequelize.query('SELECT schema_name FROM information_schema.schemata;');
    console.log('Available schemas:', schemas[0].map(schema => schema.schema_name));
    
    // Create the schema if it doesn't exist
    const schemaName = process.env.SCHEMA;
    console.log(`Creating schema: ${schemaName}`);
    await sequelize.query(`CREATE SCHEMA IF NOT EXISTS "${schemaName}";`);
    console.log(`Schema "${schemaName}" created successfully`);
    
    // Direct approach: Create tables using Sequelize sync
    console.log('Creating tables directly using Sequelize sync...');
    
    // Force sync will drop and recreate all tables
    // This is destructive, so we only do it in development or when explicitly requested
    const forceSync = process.env.FORCE_SYNC === 'true';
    
    if (forceSync) {
      console.log('FORCE_SYNC is true, dropping and recreating all tables...');
      await sequelize.sync({ force: true });
    } else {
      // Just create tables if they don't exist
      await sequelize.sync();
    }
    
    console.log('Tables created successfully');
    
    // Check if we need to add firstName and lastName columns to Users table
    try {
      // Check if the columns exist
      const tableInfo = await sequelize.query(
        `SELECT column_name FROM information_schema.columns 
         WHERE table_schema = '${schemaName}' 
         AND table_name = 'Users' 
         AND column_name IN ('firstName', 'lastName');`
      );
      
      const existingColumns = tableInfo[0].map(col => col.column_name);
      console.log('Existing columns in Users table:', existingColumns);
      
      // Add firstName column if it doesn't exist
      if (!existingColumns.includes('firstName')) {
        console.log('Adding firstName column to Users table...');
        await sequelize.query(
          `ALTER TABLE "${schemaName}"."Users" 
           ADD COLUMN IF NOT EXISTS "firstName" VARCHAR(255);`
        );
        console.log('firstName column added successfully');
      }
      
      // Add lastName column if it doesn't exist
      if (!existingColumns.includes('lastName')) {
        console.log('Adding lastName column to Users table...');
        await sequelize.query(
          `ALTER TABLE "${schemaName}"."Users" 
           ADD COLUMN IF NOT EXISTS "lastName" VARCHAR(255);`
        );
        console.log('lastName column added successfully');
      }
    } catch (columnError) {
      console.error('Error checking/adding columns:', columnError);
      // Continue execution even if this fails
    }
    
    // Run seeds if requested
    if (process.env.RUN_SEEDS === 'true') {
      console.log('Running seeds directly using Sequelize models...');
      try {
        // Check if we already have a demo user
        const existingUser = await User.findOne({
          where: { email: 'demo@example.com' }
        });
        
        if (!existingUser) {
          console.log('Creating demo user...');
          const hashedPassword = await bcrypt.hash('password', 10);
          
          await User.create({
            email: 'demo@example.com',
            username: 'DemoUser',
            hashedPassword,
            firstName: 'Demo',
            lastName: 'User'
          });
          
          console.log('Demo user created successfully');
        } else {
          console.log('Demo user already exists, skipping creation');
        }
        
        console.log('Seeds completed successfully');
      } catch (seedError) {
        console.error('Error running seeds directly:', seedError);
        // Continue execution even if seeding fails
      }
    }
    
    console.log('Database setup completed successfully');
  } catch (error) {
    console.error('Error setting up database:', error);
    process.exit(1);
  }
}

// Call the setup function
setupDatabase(); 