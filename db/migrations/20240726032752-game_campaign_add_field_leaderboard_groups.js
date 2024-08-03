'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('airdrop_campaigns', 'leaderboard_groups', {
      type: Sequelize.JSON,
      allowNull: true,
    });
    await queryInterface.addColumn('game', 'leaderboard_groups', {
      type: Sequelize.JSON,
      allowNull: true,
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('game', 'leaderboard_groups');
    await queryInterface.removeColumn('airdrop_campaigns', 'leaderboard_groups');
  }
};
