'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.removeColumn('task', 'achievement');
  },

  async down (queryInterface, Sequelize) {
  }
};
