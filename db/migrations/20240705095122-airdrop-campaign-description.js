'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('airdrop_campaigns', 'conditionDescription', {
      type: Sequelize.TEXT,
      allowNull: true,
    });
  },

  async down (queryInterface, Sequelize) {
     await queryInterface.removeColumn('airdrop_campaigns', 'conditionDescription');
  }
};
