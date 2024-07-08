'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.changeColumn('airdrop_records', 'token', {
      type: Sequelize.FLOAT,
      allowNull: true,
    });
    await queryInterface.changeColumn('airdrop_transaction_log', 'amount', {
      type: Sequelize.FLOAT,
      allowNull: true,
    });
  },

  async down (queryInterface, Sequelize) {
    // Can not down
  }
};
