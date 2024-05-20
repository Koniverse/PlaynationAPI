'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('airdrop_campaigns', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      icon: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      start_snapshot: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      end_snapshot: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      start_claim: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      end_claim: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      eglibility_date: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      network: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      total_tokens: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      total_nft: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      decimal: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      method: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      raffle_count: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      eligibility_criteria: {
        type: Sequelize.JSON,
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('ACTIVE', 'INACTIVE', 'CANCELED'),
        defaultValue: 'INACTIVE',
        allowNull: false,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('airdrop_campaigns');
  }
};
