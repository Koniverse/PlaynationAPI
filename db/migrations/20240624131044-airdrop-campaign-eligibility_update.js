'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('airdrop_campaigns', 'content_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
    await queryInterface.addColumn('airdrop_eligibility', 'content_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('airdrop_eligibility', 'content_id');
    await queryInterface.removeColumn('airdrop_campaigns', 'content_id');
  },
};
