'use strict';

const { DataTypes } = require("sequelize");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // Modify the foreign key constraint on gameId
        await queryInterface.sequelize.query(`
            ALTER TABLE public.game_item DROP CONSTRAINT IF EXISTS game_item_gameid_fkey;
            ALTER TABLE public.game_item
            ADD CONSTRAINT game_item_gameid_fkey FOREIGN KEY ("gameId")
            REFERENCES public.game(id) ON UPDATE CASCADE ON DELETE SET NULL;
        `);

        const newCols = {
            slug: {
                type: DataTypes.STRING(255),
                allowNull: true
            },
            itemGroup: {
                type: DataTypes.STRING(255),
                allowNull: true
            },
            itemGroupLevel: {
                type: DataTypes.INTEGER,
                allowNull: true
            },
            maxBuyDaily: {
                type: DataTypes.INTEGER,
                allowNull: true
            }
        };

        await queryInterface.addColumn('game_item', 'slug', newCols.slug);
        await queryInterface.addColumn('game_item', 'itemGroup', newCols.itemGroup);
        await queryInterface.addColumn('game_item', 'itemGroupLevel', newCols.itemGroupLevel);
        await queryInterface.addColumn('game_item', 'maxBuyDaily', newCols.maxBuyDaily);
    },

    async down(queryInterface, Sequelize) {
        // Revert the foreign key constraint on gameId
        await queryInterface.sequelize.query(`
            ALTER TABLE public.game_item DROP CONSTRAINT IF EXISTS game_item_gameid_fkey;
            ALTER TABLE public.game_item
            ADD CONSTRAINT game_item_gameid_fkey FOREIGN KEY ("gameId")
            REFERENCES public.game(id) ON UPDATE CASCADE;
        `);

        await queryInterface.removeColumn('game_item', 'slug');
        await queryInterface.removeColumn('game_item', 'itemGroup');
        await queryInterface.removeColumn('game_item', 'itemGroupLevel');
        await queryInterface.removeColumn('game_item', 'maxBuyDaily');
    }
};
