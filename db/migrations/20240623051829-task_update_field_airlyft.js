'use strict';

const {DataTypes} = require("sequelize");
/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        const newCols = {

            airlyftId: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            airlyftType: {
                type: DataTypes.STRING,
                allowNull: true,
            },

            airlyftEventId: {
                type: DataTypes.STRING,
                allowNull: true,
            },
        };
        await queryInterface.addColumn('task', 'airlyftId', newCols.airlyftId);
        await queryInterface.addColumn('task', 'airlyftType', newCols.airlyftType);
        await queryInterface.addColumn('task', 'airlyftEventId', newCols.airlyftEventId);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('task', 'airlyftId');
        await queryInterface.removeColumn('task', 'airlyftType');
        await queryInterface.removeColumn('task', 'airlyftEventId');
    }
};
