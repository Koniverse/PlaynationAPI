'use strict';

const {DataTypes} = require("sequelize");
/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        const newCols = {
            gamePoint: {
                type: DataTypes.INTEGER,
            },
            ratio: {
                type: DataTypes.FLOAT,
                defaultValue: 1,
            },
        };

        await queryInterface.addColumn('game_play', 'gamePoint', newCols.gamePoint);
        await queryInterface.addColumn('game_play', 'ratio', newCols.ratio);
        await queryInterface.sequelize.query('UPDATE game_play SET "gamePoint" = point where true');
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('game_play', 'gamePoint');
        await queryInterface.removeColumn('game_play', 'ratio');
    }
};
