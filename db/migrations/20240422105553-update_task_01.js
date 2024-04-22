'use strict';

const {DataTypes} = require("sequelize");
/** @type {import('sequelize-cli').Migration} */
module.exports = {
    up: async (queryInterface, Sequelize) => {
        const newCols = {
            interval: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            startTime: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            endTime: {
                type: DataTypes.DATE,
                allowNull: true,
            }
        };

        await queryInterface.addColumn('task', 'interval', newCols.interval);
        await queryInterface.addColumn('task', 'startTime', newCols.startTime)
        await queryInterface.addColumn('task', 'endTime', newCols.endTime);
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.removeColumn('task', 'interval');
        await queryInterface.removeColumn('task', 'startTime');
        await queryInterface.removeColumn('task', 'endTime');
    },
};
