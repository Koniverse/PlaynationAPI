'use strict';

const {DataTypes} = require("sequelize");
/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        const newCols = {

            indirectAccount: {
                type: DataTypes.INTEGER,
                defaultValue: 0,
            },
            indirectPoint: {
                type: DataTypes.INTEGER,
                defaultValue: 0,
            },
            invitePoint: {
                type: DataTypes.INTEGER,
                defaultValue: 0,
            },
            receiverInviteRatio: {
                type: DataTypes.INTEGER,
                defaultValue: 0,
            },
        };

        await queryInterface.addColumn('referral_log', 'indirectAccount', newCols.indirectAccount);
        await queryInterface.addColumn('referral_log', 'indirectPoint', newCols.indirectPoint);
        await queryInterface.addColumn('referral_log', 'invitePoint', newCols.invitePoint);
        await queryInterface.addColumn('referral_log', 'receiverInviteRatio', newCols.receiverInviteRatio);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('referral_log', 'indirectAccount');
        await queryInterface.removeColumn('referral_log', 'indirectPoint');
        await queryInterface.removeColumn('referral_log', 'invitePoint');
        await queryInterface.removeColumn('referral_log', 'receiverInviteRatio');
    }
};
