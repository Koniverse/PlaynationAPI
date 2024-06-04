'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('airdrop_campaigns', 'shortDescription', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('airdrop_campaigns', 'token_slug', {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: 'karura_evm-NATIVE-KAR',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('airdrop_campaigns', 'shortDescription');
  },
};
