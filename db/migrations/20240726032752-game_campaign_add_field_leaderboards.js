'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('airdrop_campaigns', 'leaderboards', {
      type: Sequelize.JSON,
      allowNull: true,
    });
    await queryInterface.addColumn('game', 'leaderboards', {
      type: Sequelize.JSON,
      allowNull: true,
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('game', 'leaderboards');
    await queryInterface.removeColumn('airdrop_campaigns', 'leaderboards');
  }
};
