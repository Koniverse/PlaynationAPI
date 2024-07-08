'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('airdrop_eligibility', 'box_price', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
    await queryInterface.addColumn('airdrop_eligibility', 'box_limit', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
    await queryInterface.addColumn('airdrop_records', 'use_point', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    });
  },

  async down (queryInterface, Sequelize) {
     await queryInterface.removeColumn('airdrop_eligibility', 'box_price');
     await queryInterface.removeColumn('airdrop_eligibility', 'box_limit');
     await queryInterface.removeColumn('airdrop_records', 'use_point');
  }
};
