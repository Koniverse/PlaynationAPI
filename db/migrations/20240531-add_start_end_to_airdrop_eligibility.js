'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('airdrop_eligibility', 'start', {
      type: Sequelize.DATE,
      allowNull: true,
    });

    await queryInterface.addColumn('airdrop_eligibility', 'end', {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('airdrop_eligibility', 'start');
    await queryInterface.removeColumn('airdrop_eligibility', 'end');
  },
};
