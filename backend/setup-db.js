const { sequelize } = require('./db/models');
const { execSync } = require('child_process');
const path = require('path');

async function setupDatabase() {
  try {
    console.log('Setting up database...');
    
    // Force NODE_ENV to production
    process.env.NODE_ENV = 'production';
    
    // Set schema to public if not already set
    if (!process.env.SCHEMA) {
      process.env.SCHEMA = 'public';
      console.log('Setting SCHEMA to public');
    }
    
    // Show all schemas
    const schemas = await sequelize.query('SELECT schema_name FROM information_schema.schemata;');
    console.log('Available schemas:', schemas[0].map(schema => schema.schema_name));
    
    // Create the schema if it doesn't exist
    const schemaName = process.env.SCHEMA;
    console.log(`Creating schema: ${schemaName}`);
    await sequelize.query(`CREATE SCHEMA IF NOT EXISTS "${schemaName}";`);
    console.log(`Schema "${schemaName}" created successfully`);
    
    // Run migrations directly using sequelize-cli
    console.log('Running migrations...');
    try {
      // Change to the backend directory
      process.chdir(path.join(__dirname));
      
      // Run migrations
      execSync('npx sequelize-cli db:migrate --env production', { stdio: 'inherit' });
      console.log('Migrations completed successfully');
    } catch (migrationError) {
      console.error('Error running migrations:', migrationError);
      throw migrationError;
    }
    
    console.log('Database setup completed successfully');
  } catch (error) {
    console.error('Error setting up database:', error);
    process.exit(1);
  }
}

// Call the setup function
setupDatabase(); 