'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Remove columns that are no longer needed
      await queryInterface.removeColumn('airdrop_record_log', 'name', { transaction });
      await queryInterface.removeColumn('airdrop_record_log', 'campaign_method', { transaction });
      await queryInterface.removeColumn('airdrop_record_log', 'amount', { transaction });
      await queryInterface.removeColumn('airdrop_record_log', 'decimal', { transaction });
      await queryInterface.removeColumn('airdrop_record_log', 'network', { transaction });
      await queryInterface.removeColumn('airdrop_record_log', 'address', { transaction });

      // Add new columns
      await queryInterface.addColumn(
        'airdrop_record_log',
        'eligibility_id',
        {
          type: Sequelize.INTEGER,
          allowNull: true,
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'airdrop_record_log',
        'expiryDate',
        {
          type: Sequelize.DATE,
          allowNull: false,
        },
        { transaction },
      );

      // Update foreign key references
      await queryInterface.changeColumn(
        'airdrop_record_log',
        'airdrop_record_id',
        {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'airdrop_records',
            key: 'id',
          },
        },
        { transaction },
      );

      await queryInterface.changeColumn(
        'airdrop_record_log',
        'account_id',
        {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'account',
            key: 'id',
          },
        },
        { transaction },
      );

      // Update table owner
      await queryInterface.sequelize.query(
        `
          ALTER TABLE airdrop_record_log
              OWNER TO postgres;
      `,
        { transaction },
      );

      // Commit the transaction
      await transaction.commit();
    } catch (err) {
      // Rollback the transaction if any error occurred
      await transaction.rollback();
      throw err;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Revert changes made in up()
      // Add removed columns
      await queryInterface.addColumn(
        'airdrop_record_log',
        'name',
        {
          type: Sequelize.STRING,
          allowNull: false,
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'airdrop_record_log',
        'campaign_method',
        {
          type: Sequelize.STRING,
          allowNull: false,
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'airdrop_record_log',
        'amount',
        {
          type: Sequelize.INTEGER,
          allowNull: false,
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'airdrop_record_log',
        'decimal',
        {
          type: Sequelize.INTEGER,
          allowNull: false,
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'airdrop_record_log',
        'network',
        {
          type: Sequelize.STRING,
          allowNull: false,
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'airdrop_record_log',
        'address',
        {
          type: Sequelize.STRING,
          allowNull: false,
        },
        { transaction },
      );

      // Remove newly added columns
      await queryInterface.removeColumn('airdrop_record_log', 'eligibility_id', { transaction });
      await queryInterface.removeColumn('airdrop_record_log', 'expiryDate', { transaction });

      // Revert foreign key references
      await queryInterface.changeColumn(
        'airdrop_record_log',
        'airdrop_record_id',
        {
          type: Sequelize.INTEGER,
          allowNull: false,
        },
        { transaction },
      );

      await queryInterface.changeColumn(
        'airdrop_record_log',
        'account_id',
        {
          type: Sequelize.INTEGER,
          allowNull: false,
        },
        { transaction },
      );

      // Commit the transaction
      await transaction.commit();
    } catch (err) {
      // Rollback the transaction if any error occurred
      await transaction.rollback();
      throw err;
    }
  },
};
