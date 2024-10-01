'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('game', 'documentId', {
            type: Sequelize.STRING,
            allowNull: true
        });
        await queryInterface.addColumn('airdrop_eligibility', 'document_id', {
            type: Sequelize.STRING,
            allowNull: true
        });
        await queryInterface.addColumn('airdrop_campaigns', 'document_id', {
            type: Sequelize.STRING,
            allowNull: true
        });
        await queryInterface.addColumn('game_item', 'documentId', {
            type: Sequelize.STRING,
            allowNull: true
        });
        await queryInterface.addColumn('giveaway_point', 'documentId', {
            type: Sequelize.STRING,
            allowNull: true
        });
        await queryInterface.addColumn('task_category', 'documentId', {
            type: Sequelize.STRING,
            allowNull: true
        });
        await queryInterface.addColumn('task', 'documentId', {
            type: Sequelize.STRING,
            allowNull: true
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('game', 'documentId');
        await queryInterface.removeColumn('airdrop_eligibility', 'document_id');
        await queryInterface.removeColumn('airdrop_campaigns', 'document_id');
        await queryInterface.removeColumn('game_item', 'documentId');
        await queryInterface.removeColumn('giveaway_point', 'documentId');
        await queryInterface.removeColumn('task_category', 'documentId');
        await queryInterface.removeColumn('task', 'documentId');
    }
};
