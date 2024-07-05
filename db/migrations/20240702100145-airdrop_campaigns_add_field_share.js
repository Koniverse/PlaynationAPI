'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('airdrop_campaigns', 'share', {
      type: Sequelize.JSON,
      allowNull: true,
    });
    await queryInterface.addColumn('airdrop_campaigns', 'token_slug', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('airdrop_campaigns', 'token_slug');
  }
};
