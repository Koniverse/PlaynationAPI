'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('game', 'gameType', {
      type: Sequelize.ENUM('casual', 'farming'),
      defaultValue: 'casual'
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('game', 'gameType');
  }
};
