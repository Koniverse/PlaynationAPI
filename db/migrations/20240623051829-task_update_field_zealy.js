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
            zealyType: {
                type: DataTypes.STRING,
                allowNull: true,
            },
        };
        await queryInterface.addColumn('task', 'zealyId', newCols.zealyId);
        await queryInterface.addColumn('task', 'zealyType', newCols.zealyType);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('task', 'zealyId');
        await queryInterface.removeColumn('task', 'zealyType');
    }
};
