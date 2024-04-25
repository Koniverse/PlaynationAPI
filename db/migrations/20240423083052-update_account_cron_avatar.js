'use strict';

const {DataTypes} = require("sequelize");
/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        const newCols = {
            cronAvatar: {
                type: DataTypes.BOOLEAN,
                allowNull: true,
            },
        };
        await queryInterface.addColumn('account', 'cronAvatar', newCols.cronAvatar);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('account', 'cronAvatar');
    }
};
