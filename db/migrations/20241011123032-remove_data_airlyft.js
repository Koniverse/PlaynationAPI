'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.removeColumn('task', 'airlyftType');
    await queryInterface.removeColumn('task', 'airlyftId');
    await queryInterface.removeColumn('task', 'airlyftEventId');
    await queryInterface.removeColumn('task', 'airlyftWidgetId');
    await queryInterface.dropTable('airlyft_account');
    await queryInterface.dropTable('airlyft_events');
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  }
};
