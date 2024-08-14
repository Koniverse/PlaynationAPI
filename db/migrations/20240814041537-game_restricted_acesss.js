'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('game', 'restrictedAccess', {
      type: Sequelize.JSON,
      allowNull: true
    });
    await queryInterface.addColumn('game', 'restrictedAccessText', {
      type: Sequelize.TEXT,
      allowNull: true
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('game', 'restrictedAccess');
    await queryInterface.removeColumn('game', 'restrictedAccessText');
  }
};
