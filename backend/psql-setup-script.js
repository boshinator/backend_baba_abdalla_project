// backend/psql-setup-script.js
const { sequelize } = require('./db/models');

async function setupDatabase() {
  try {
    // Show all schemas
    const schemas = await sequelize.query('SELECT schema_name FROM information_schema.schemata;');
    console.log('Available schemas:', schemas[0].map(schema => schema.schema_name));

    // If in production environment, create the schema
    if (process.env.NODE_ENV === 'production') {
      const schemaName = process.env.SCHEMA;
      
      if (!schemaName) {
        throw new Error('SCHEMA environment variable is not set');
      }
      
      console.log(`Creating schema: ${schemaName}`);
      
      // Create the schema if it doesn't exist
      await sequelize.query(`CREATE SCHEMA IF NOT EXISTS "${schemaName}";`);
      
      console.log(`Schema "${schemaName}" created successfully`);
    } else {
      console.log('Not in production environment, skipping schema creation');
    }
  } catch (error) {
    console.error('Error setting up database:', error);
    process.exit(1);
  }
}

// Call the setup function
setupDatabase();