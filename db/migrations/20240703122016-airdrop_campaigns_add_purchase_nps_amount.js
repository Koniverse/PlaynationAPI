'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {

    await queryInterface.addColumn('airdrop_campaigns', 'purchase_nps_amount', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });

    await queryInterface.addColumn('airdrop_campaigns', 'max_tokens_per_campaign', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('airdrop_campaigns', 'purchase_nps_amount');
    await queryInterface.removeColumn('airdrop_campaigns', 'max_tokens_per_campaign');
  }
};
