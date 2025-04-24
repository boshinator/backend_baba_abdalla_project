const { sequelize } = require('./db/models');
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

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
    
    // Check if migrations directory exists
    const migrationsDir = path.join(__dirname, 'db', 'migrations');
    if (!fs.existsSync(migrationsDir)) {
      console.error(`Migrations directory not found: ${migrationsDir}`);
      throw new Error(`Migrations directory not found: ${migrationsDir}`);
    }
    
    // List migration files
    const migrationFiles = fs.readdirSync(migrationsDir);
    console.log('Migration files:', migrationFiles);
    
    // Run migrations directly using sequelize-cli
    console.log('Running migrations...');
    try {
      // Change to the backend directory
      process.chdir(path.join(__dirname));
      
      // Check if sequelize-cli is installed
      try {
        execSync('npx sequelize-cli --version', { stdio: 'inherit' });
      } catch (versionError) {
        console.error('Error checking sequelize-cli version:', versionError);
        console.log('Installing sequelize-cli...');
        execSync('npm install -g sequelize-cli', { stdio: 'inherit' });
      }
      
      // Try to run migrations with more detailed error output
      console.log('Running migrations with detailed output...');
      execSync('npx sequelize-cli db:migrate --env production --debug', { 
        stdio: 'inherit',
        env: { ...process.env, DEBUG: 'sequelize:*' }
      });
      
      console.log('Migrations completed successfully');
    } catch (migrationError) {
      console.error('Error running migrations:', migrationError);
      
      // Try an alternative approach - run migrations directly using Sequelize
      console.log('Trying alternative approach - running migrations directly...');
      try {
        // Import and run migrations directly
        const { Umzug, SequelizeStorage } = require('umzug');
        const umzug = new Umzug({
          migrations: {
            path: migrationsDir,
            params: [sequelize.getQueryInterface(), sequelize.constructor]
          },
          storage: new SequelizeStorage({ sequelize }),
          logger: console
        });
        
        await umzug.up();
        console.log('Migrations completed successfully using alternative approach');
      } catch (directMigrationError) {
        console.error('Error running migrations directly:', directMigrationError);
        throw directMigrationError;
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