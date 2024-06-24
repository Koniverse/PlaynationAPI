'use strict';

const {DataTypes} = require("sequelize");
/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        const newCols = {
            zealyId: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            discordId: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            twitterId: {
                type: DataTypes.STRING,
                allowNull: true,
            },

            zealyEvmAccount: {
              type: DataTypes.STRING,
              allowNull: true,
            },
            evmAccount: {
              type: DataTypes.STRING,
              allowNull: true,
            },
        };
        await queryInterface.addColumn('account', 'zealyId', newCols.zealyId);
        await queryInterface.addColumn('account', 'discordId', newCols.discordId);
        await queryInterface.addColumn('account', 'twitterId', newCols.twitterId);
        await queryInterface.addColumn('account', 'zealyEvmAccount', newCols.zealyEvmAccount);
        await queryInterface.addColumn('account', 'evmAccount', newCols.evmAccount);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('account', 'discordId');
        await queryInterface.removeColumn('account', 'zealyId');
        await queryInterface.removeColumn('account', 'twitterId');
        await queryInterface.removeColumn('account', 'zealyEvmAccount');
        await queryInterface.removeColumn('account', 'evmAccount');
    }
};
