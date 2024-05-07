'use strict';

const {DataTypes} = require("sequelize");
/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        const newCols = {
            categoryId: {
                type: DataTypes.INTEGER,
            },
            active: {
                type: DataTypes.BOOLEAN,
                defaultValue: false,
            },
        };

        await queryInterface.addColumn('task', 'categoryId', newCols.categoryId);
        await queryInterface.addColumn('task', 'active', newCols.active);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('task', 'categoryId');
        await queryInterface.removeColumn('task', 'active');
    }
};
