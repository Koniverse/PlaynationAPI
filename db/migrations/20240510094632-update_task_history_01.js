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
            retry: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            extrinsicHash: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            status: {
                type: DataTypes.ENUM('failed', 'checking', 'completed'),
            },
            completedAt: DataTypes.DATE,
        };

        await queryInterface.addColumn('task_history', 'network', newCols.network);
        await queryInterface.addColumn('task_history', 'retry', newCols.retry);
        await queryInterface.addColumn('task_history', 'status', newCols.status);
        await queryInterface.addColumn('task_history', 'extrinsicHash', newCols.extrinsicHash);
        await queryInterface.addColumn('task_history', 'completedAt', newCols.completedAt);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('task_history', 'network');
        await queryInterface.removeColumn('task_history', 'retry');
        await queryInterface.removeColumn('task_history', 'status');
        await queryInterface.removeColumn('task_history', 'extrinsicHash');
        await queryInterface.removeColumn('task_history', 'completedAt');
    }
};
