'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('airdrop_records', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      campaign_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'airdrop_campaigns',
          key: 'id',
        },
      },
      account: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      amount: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      network: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      snapshot_data: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      point_nps: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM(
          'NEW_REGISTRATION',
          'CHECKING_CONDITIONS',
          'ELIGIBLE_FOR_REWARD',
          'RECEIVED',
          'NOT_ELIGIBLE_FOR_REWARD',
          'CANCELED'
        ),
        defaultValue: 'NEW_REGISTRATION',
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('airdrop_records');
  }
};
