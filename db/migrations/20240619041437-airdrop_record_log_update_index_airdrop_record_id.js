'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addIndex('airdrop_record_log', ['airdrop_record_id'], {
        name: 'airdrop_record_log_airdrop_record_id',
        unique: true,
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeIndex('airdrop_record_log', 'airdrop_record_log_airdrop_record_id');
  }
};
