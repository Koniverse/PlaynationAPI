'use strict';

const {DataTypes} = require("sequelize");
/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        const newCols = {

            network: {
                type: DataTypes.STRING,
                allowNull: true,
            },
        };
        await queryInterface.addColumn('task', 'network', newCols.network);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('task', 'network');
    }
};
