'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('airdrop_record_log', 'status', {
      type: Sequelize.ENUM('PENDING', 'EXPIRED', 'RECEIVED'),
      allowNull: false,
      defaultValue: 'PENDING',
    });

    await queryInterface.addColumn('airdrop_record_log', 'expiryDate', {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('airdrop_record_log', 'status', {
      type: Sequelize.ENUM('PENDING', 'MISSED', 'RECEIVED'),
      allowNull: false,
      defaultValue: 'PENDING',
    });

    // Xóa cột expiryDate
    await queryInterface.removeColumn('airdrop_record_log', 'expiryDate');
  },
};
