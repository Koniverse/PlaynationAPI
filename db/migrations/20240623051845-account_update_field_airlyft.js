'use strict';

const {DataTypes} = require("sequelize");
/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        const newCols = {
            airlyftId: {
                type: DataTypes.STRING,
                allowNull: true,
            }
        };
        await queryInterface.addColumn('account', 'airlyftId', newCols.airlyftId);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('account', 'airlyftId');
    }
};
