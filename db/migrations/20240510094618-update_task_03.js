'use strict';

const {DataTypes} = require("sequelize");
/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        const newCols = {

            onChainType: {
                type: DataTypes.STRING,
                allowNull: true,
            },
        };
        await queryInterface.addColumn('task', 'onChainType', newCols.onChainType);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('task', 'onChainType');
    }
};
