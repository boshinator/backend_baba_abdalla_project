const { sequelize } = require('./db/models');
const { User } = require('./db/models');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

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
      console.log('Running seeds...');
      try {
        // Change to the backend directory
        process.chdir(path.join(__dirname));
        
        // Create a temporary .sequelizerc file to set the correct schema
        const sequelizercPath = path.join(__dirname, '.sequelizerc');
        const sequelizercContent = `
module.exports = {
  'config': path.resolve('config', 'database.js'),
  'models-path': path.resolve('db', 'models'),
  'seeders-path': path.resolve('db', 'seeders'),
  'migrations-path': path.resolve('db', 'migrations')
};
`;
        fs.writeFileSync(sequelizercPath, sequelizercContent);
        console.log('Created temporary .sequelizerc file');
        
        // Create a temporary config file for seeding
        const configPath = path.join(__dirname, 'config', 'seed-config.js');
        const configContent = `
module.exports = {
  production: {
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    dialect: 'postgres',
    schema: '${schemaName}'
  }
};
`;
        // Ensure the config directory exists
        if (!fs.existsSync(path.join(__dirname, 'config'))) {
          fs.mkdirSync(path.join(__dirname, 'config'));
        }
        fs.writeFileSync(configPath, configContent);
        console.log('Created temporary seed config file');
        
        // Run seeds using npx with the custom config
        execSync(`npx sequelize-cli db:seed:all --env production --config ${configPath}`, { 
          stdio: 'inherit',
          env: { ...process.env, NODE_ENV: 'production', SCHEMA: schemaName }
        });
        
        console.log('Seeds completed successfully');
        
        // Clean up temporary files
        fs.unlinkSync(sequelizercPath);
        fs.unlinkSync(configPath);
        console.log('Cleaned up temporary files');
      } catch (seedError) {
        console.error('Error running seeds:', seedError);
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