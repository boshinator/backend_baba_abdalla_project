'use strict';

let options = {};
if (process.env.NODE_ENV === 'production') {
  options.schema = process.env.SCHEMA;  // define your schema in options object
}

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.addColumn('Users', 'firstName', {    // Add firstName column
      type: Sequelize.STRING,
      allowNull: true                                       // Make it optional
    }, options);
    
    await queryInterface.addColumn('Users', 'lastName', {     // Add lastName column
      type: Sequelize.STRING,
      allowNull: true                                       // Make it optional
    }, options);
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    options.tableName = "Users";
    await queryInterface.removeColumn(options, 'firstName');   // Remove in down migration
    await queryInterface.removeColumn(options, 'lastName');    // Remove in down migration
  }
};
