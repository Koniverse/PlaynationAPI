'use strict';

const {DataTypes} = require("sequelize");
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
        const newCols = {
            airlyftWidgetId: {
                type: DataTypes.STRING,
                allowNull: true,
            }
        };
        await queryInterface.addColumn('task', 'airlyftWidgetId', newCols.airlyftWidgetId);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('task', 'airlyftWidgetId');
    }
};
